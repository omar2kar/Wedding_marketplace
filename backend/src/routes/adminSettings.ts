import express from 'express';
import { adminAuthMiddleware } from '../middleware/auth';
import db from '../database';

const router = express.Router();

// Input validation middleware for settings
const validateSettings = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const { key, value } = req.body;
  
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    res.status(400).json({ error: 'Setting key is required' });
    return;
  }
  
  if (value === undefined || value === null) {
    res.status(400).json({ error: 'Setting value is required' });
    return;
  }
  
  next();
};

// Get all system settings
router.get('/admin/settings', adminAuthMiddleware, async (_req, res) => {
  try {
    const settings = await db.query(`
      SELECT * FROM system_settings 
      ORDER BY category, setting_key
    `);

    // Group settings by category
    const groupedSettings = settings.reduce((acc: any, setting: any) => {
      const category = setting.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {});

    return res.json({ settings: groupedSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update system setting
router.put('/admin/settings/:key', adminAuthMiddleware, validateSettings, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const adminId = req.admin!.id;

    // Check if setting exists
    const [existingSetting] = await db.query(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );

    if (existingSetting) {
      // Update existing setting
      await db.query(`
        UPDATE system_settings 
        SET setting_value = ?, description = ?, updated_by = ?, updated_at = NOW()
        WHERE setting_key = ?
      `, [value, description || existingSetting.description, adminId, key]);
    } else {
      // Create new setting
      await db.query(`
        INSERT INTO system_settings (setting_key, setting_value, description, created_by, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [key, value, description || '', adminId]);
    }

    console.log(`Admin ${adminId} updated setting ${key} to: ${value}`);
    return res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Error updating setting:', error);
    return res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Get commission settings
router.get('/admin/settings/commissions', adminAuthMiddleware, async (_req, res) => {
  try {
    const commissions = await db.query(`
      SELECT 
        category,
        COALESCE(commission_rate, 0) as commission_rate
      FROM service_categories
      ORDER BY category
    `);

    return res.json({ commissions });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return res.status(500).json({ error: 'Failed to fetch commission settings' });
  }
});

// Update commission rates
router.put('/admin/settings/commissions/:category', adminAuthMiddleware, async (req, res) => {
  try {
    const { category } = req.params;
    const { commission_rate } = req.body;
    const adminId = req.admin!.id;

    if (!commission_rate || isNaN(commission_rate) || commission_rate < 0 || commission_rate > 100) {
      return res.status(400).json({ error: 'Commission rate must be between 0 and 100' });
    }

    // Update or insert commission rate
    await db.query(`
      INSERT INTO service_categories (category, commission_rate, updated_by, updated_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        commission_rate = VALUES(commission_rate),
        updated_by = VALUES(updated_by),
        updated_at = NOW()
    `, [category, commission_rate, adminId]);

    console.log(`Admin ${adminId} updated commission for ${category} to ${commission_rate}%`);
    return res.json({ message: 'Commission rate updated successfully' });
  } catch (error) {
    console.error('Error updating commission:', error);
    return res.status(500).json({ error: 'Failed to update commission rate' });
  }
});

// Get platform content settings
router.get('/admin/settings/content', adminAuthMiddleware, async (_req, res) => {
  try {
    const content = await db.query(`
      SELECT * FROM platform_content 
      WHERE is_active = TRUE
      ORDER BY content_type, section
    `);

    return res.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return res.status(500).json({ error: 'Failed to fetch content settings' });
  }
});

// Update platform content
router.put('/admin/settings/content/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_active } = req.body;
    const adminId = req.admin!.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    await db.query(`
      UPDATE platform_content 
      SET title = ?, content = ?, is_active = ?, updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `, [title, content, is_active !== false, adminId, id]);

    console.log(`Admin ${adminId} updated content ${id}`);
    return res.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Error updating content:', error);
    return res.status(500).json({ error: 'Failed to update content' });
  }
});

// Get email templates
router.get('/admin/settings/email-templates', adminAuthMiddleware, async (_req, res) => {
  try {
    const templates = await db.query(`
      SELECT * FROM email_templates 
      WHERE is_active = TRUE
      ORDER BY template_type
    `);

    return res.json({ templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

// Update email template
router.put('/admin/settings/email-templates/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body, is_active } = req.body;
    const adminId = req.admin!.id;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    await db.query(`
      UPDATE email_templates 
      SET subject = ?, body = ?, is_active = ?, updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `, [subject, body, is_active !== false, adminId, id]);

    console.log(`Admin ${adminId} updated email template ${id}`);
    return res.json({ message: 'Email template updated successfully' });
  } catch (error) {
    console.error('Error updating email template:', error);
    return res.status(500).json({ error: 'Failed to update email template' });
  }
});

export default router;
