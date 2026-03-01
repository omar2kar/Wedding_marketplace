import express from 'express';
import { vendorAuthMiddleware } from '../middleware/vendorAuth';
import db from '../database';

const router = express.Router();

// Get vendor services
router.get('/vendor/services', vendorAuthMiddleware, async (req, res) => {
  try {
    const vendorId = req.vendor!.id;
    
    const services = await db.query(`
      SELECT id, name, description, category, price, images, is_active as isActive, created_at as createdAt
      FROM vendor_services 
      WHERE vendor_id = ? 
      ORDER BY created_at DESC
    `, [vendorId]);

    res.json(services);
  } catch (error) {
    console.error('Error fetching vendor services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
  return;
});

// Add new service
router.post('/vendor/services', vendorAuthMiddleware, async (req, res) => {
  try {
    const vendorId = req.vendor!.id;
    const { name, description, category, price, images, isActive } = req.body;

    // Validation
    if (!name || !description || !category || !price) {
      res.status(400).json({ error: 'Name, description, category, and price are required' });
      return;
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      res.status(400).json({ error: 'Price must be a valid positive number' });
      return;
    }

    const result = await db.query(`
      INSERT INTO vendor_services (vendor_id, name, description, category, price, images, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      vendorId,
      name,
      description,
      category,
      Number(price),
      JSON.stringify(images || []),
      isActive !== false ? 1 : 0
    ]);

    const newService = {
      id: result.insertId,
      name,
      description,
      category,
      price: Number(price),
      images: images || [],
      isActive: isActive !== false,
      createdAt: new Date().toISOString()
    };

    console.log('Service added successfully');
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
  return;
});

// Update service
router.put('/vendor/services/:id', vendorAuthMiddleware, async (req, res) => {
  try {
    const vendorId = req.vendor!.id;
    const serviceId = req.params.id;
    const { name, description, category, price, images, isActive } = req.body;

    // Check if service belongs to vendor
    const [existingService] = await db.query(
      'SELECT id FROM vendor_services WHERE id = ? AND vendor_id = ?',
      [serviceId, vendorId]
    );

    if (!existingService) {
      res.status(404).json({ error: 'Service not found or not owned by vendor' });
      return;
    }

    // Validation
    if (price && (isNaN(Number(price)) || Number(price) < 0)) {
      res.status(400).json({ error: 'Price must be a valid positive number' });
      return;
    }

    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (category) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (price) {
      updateFields.push('price = ?');
      updateValues.push(Number(price));
    }
    if (images) {
      updateFields.push('images = ?');
      updateValues.push(JSON.stringify(images));
    }
    if (typeof isActive === 'boolean') {
      updateFields.push('is_active = ?');
      updateValues.push(isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updateValues.push(serviceId, vendorId);

    await db.query(`
      UPDATE vendor_services 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND vendor_id = ?
    `, updateValues);

    console.log(`Vendor ${vendorId} updated service ${serviceId}`);
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
  return;
});

// Delete service
router.delete('/vendor/services/:id', vendorAuthMiddleware, async (req, res) => {
  try {
    const vendorId = req.vendor!.id;
    const serviceId = req.params.id;

    // Check if service belongs to vendor
    const [existingService] = await db.query(
      'SELECT id FROM vendor_services WHERE id = ? AND vendor_id = ?',
      [serviceId, vendorId]
    );

    if (!existingService) {
      res.status(404).json({ error: 'Service not found or not owned by vendor' });
      return;
    }

    await db.query(
      'DELETE FROM vendor_services WHERE id = ? AND vendor_id = ?',
      [serviceId, vendorId]
    );

    console.log(`Vendor ${vendorId} deleted service ${serviceId}`);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
  return;
});

export default router;
