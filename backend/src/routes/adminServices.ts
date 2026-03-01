import express from 'express';
import { adminAuthMiddleware } from '../middleware/auth';
import db from '../database';

const router = express.Router();

// Input validation middleware for service actions
const validateServiceAction = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const { notes } = req.body;
  
  if (notes !== undefined && (typeof notes !== 'string' || notes.trim().length > 500)) {
    res.status(400).json({ error: 'Notes must be a string with maximum 500 characters' });
    return;
  }
  
  next();
};

// Get all services with filtering
router.get('/admin/services', adminAuthMiddleware, async (req, res) => {
  try {
    const { search, status, category, vendor_id } = req.query;
    
    let whereConditions = [];
    let queryParams: any[] = [];
    
    if (search) {
      whereConditions.push('(s.title LIKE ? OR s.description LIKE ? OR v.business_name LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      whereConditions.push('s.status = ?');
      queryParams.push(status);
    }
    
    if (category) {
      whereConditions.push('s.category = ?');
      queryParams.push(category);
    }
    
    if (vendor_id) {
      whereConditions.push('s.vendor_id = ?');
      queryParams.push(vendor_id);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const services = await db.query(`
      SELECT 
        s.*,
        v.name as vendor_name,
        v.business_name,
        v.email as vendor_email,
        (SELECT COUNT(*) FROM bookings WHERE service_id = s.id) as total_bookings,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE service_id = s.id) as average_rating,
        (SELECT COUNT(*) FROM reviews WHERE service_id = s.id) as total_reviews
      FROM services s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      ${whereClause}
      ORDER BY s.created_at DESC
    `, queryParams);

    res.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get service details
router.get('/admin/services/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [service] = await db.query(`
      SELECT 
        s.*,
        v.name as vendor_name,
        v.business_name,
        v.email as vendor_email,
        v.phone as vendor_phone
      FROM services s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      WHERE s.id = ?
    `, [id]);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Get service bookings
    const bookings = await db.query(`
      SELECT 
        b.*,
        c.name as client_name,
        c.email as client_email
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      WHERE b.service_id = ?
      ORDER BY b.created_at DESC
      LIMIT 10
    `, [id]);

    // Get service reviews
    const reviews = await db.query(`
      SELECT 
        r.*,
        c.name as client_name
      FROM reviews r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.service_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      service,
      bookings,
      reviews
    });
  } catch (error) {
    console.error('Error fetching service details:', error);
    return res.status(500).json({ error: 'Failed to fetch service details' });
  }
});

// Approve service
router.post('/admin/services/:id/approve', adminAuthMiddleware, validateServiceAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.admin!.id;

    const [service] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (service.status !== 'pending') {
      return res.status(400).json({ error: 'Service is not pending approval' });
    }

    await db.query(
      'UPDATE services SET status = ?, approved_by = ?, approved_at = NOW(), admin_notes = ? WHERE id = ?',
      ['approved', adminId, notes || null, id]
    );

    console.log(`Admin ${adminId} approved service ${id}`);
    res.json({ message: 'Service approved successfully' });
  } catch (error) {
    console.error('Error approving service:', error);
    return res.status(500).json({ error: 'Failed to approve service' });
  }
});

// Reject service
router.post('/admin/services/:id/reject', adminAuthMiddleware, validateServiceAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.admin!.id;

    const [service] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (service.status !== 'pending') {
      return res.status(400).json({ error: 'Service is not pending approval' });
    }

    await db.query(
      'UPDATE services SET status = ?, approved_by = ?, approved_at = NOW(), admin_notes = ? WHERE id = ?',
      ['rejected', adminId, notes || null, id]
    );

    console.log(`Admin ${adminId} rejected service ${id}`);
    res.json({ message: 'Service rejected successfully' });
  } catch (error) {
    console.error('Error rejecting service:', error);
    return res.status(500).json({ error: 'Failed to reject service' });
  }
});

// Suspend service
router.post('/admin/services/:id/suspend', adminAuthMiddleware, validateServiceAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.admin!.id;

    const [service] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.query(
      'UPDATE services SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
      ['suspended', notes || null, id]
    );

    console.log(`Admin ${adminId} suspended service ${id}`);
    res.json({ message: 'Service suspended successfully' });
  } catch (error) {
    console.error('Error suspending service:', error);
    return res.status(500).json({ error: 'Failed to suspend service' });
  }
});

// Reactivate service
router.post('/admin/services/:id/reactivate', adminAuthMiddleware, validateServiceAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.admin!.id;

    const [service] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.query(
      'UPDATE services SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
      ['approved', notes || null, id]
    );

    console.log(`Admin ${adminId} reactivated service ${id}`);
    res.json({ message: 'Service reactivated successfully' });
  } catch (error) {
    console.error('Error reactivating service:', error);
    return res.status(500).json({ error: 'Failed to reactivate service' });
  }
});

// Delete service
router.delete('/admin/services/:id', adminAuthMiddleware, validateServiceAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.admin!.id;

    const [service] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if service has active bookings
    const [activeBookings] = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE service_id = ? AND status IN (?, ?)',
      [id, 'confirmed', 'pending']
    );

    if (activeBookings.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete service with active bookings. Suspend instead.' 
      });
    }

    await db.query('DELETE FROM services WHERE id = ?', [id]);

    console.log(`Admin ${adminId} deleted service ${id}: ${notes || 'No reason provided'}`);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Get service categories
router.get('/admin/services/categories', adminAuthMiddleware, async (_req, res) => {
  try {
    const categories = await db.query(`
      SELECT 
        category,
        COUNT(*) as service_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM services 
      GROUP BY category
      ORDER BY service_count DESC
    `);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
