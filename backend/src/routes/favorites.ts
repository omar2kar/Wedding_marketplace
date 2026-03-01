import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace'
};

// Get client favorites
router.get('/:clientId', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const clientId = parseInt(req.params.clientId);
    
    console.log('Fetching favorites for client ID:', clientId);
    
    const query = `
      SELECT 
        f.*,
        s.id as service_id,
        s.name as service_name,
        s.description as service_description,
        s.category as service_category,
        s.price as service_price,
        s.images as service_images,
        v.id as vendor_id,
        v.business_name as vendor_businessName,
        v.name as vendor_ownerName,
        v.email as vendor_email,
        v.phone as vendor_phone,
        COALESCE(v.rating, 4.5) as vendor_rating
      FROM client_favorites f
      JOIN vendor_services s ON f.service_id = s.id
      LEFT JOIN vendors v ON s.vendor_id = v.id
      WHERE f.client_id = ? AND s.is_active = 1
      ORDER BY f.created_at DESC
    `;
    
    const [rows] = await connection.execute(query, [clientId]);
    console.log('Raw favorites query result:', rows);
    
    const favorites = (rows as any[]).map(row => ({
      id: row.id,
      addedAt: row.created_at,
      service: {
        id: row.service_id,
        name: row.service_name,
        description: row.service_description,
        category: row.service_category,
        price: parseFloat(row.service_price),
        images: row.service_images ? JSON.parse(row.service_images) : [],
        vendor: {
          id: row.vendor_id,
          businessName: row.vendor_businessName,
          ownerName: row.vendor_ownerName,
          email: row.vendor_email,
          phone: row.vendor_phone,
          rating: parseFloat(row.vendor_rating) || 4.5
        }
      }
    }));
    
    console.log('Formatted favorites response:', favorites);
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Add service to favorites
router.post('/add', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { clientId, serviceId } = req.body;
    
    console.log('Adding to favorites - clientId:', clientId, 'serviceId:', serviceId);
    
    if (!clientId || !serviceId) {
      return res.status(400).json({ error: 'Client ID and Service ID are required' });
    }
    
    // First check if the service exists
    const serviceCheckQuery = 'SELECT id FROM vendor_services WHERE id = ? AND is_active = 1';
    const [serviceRows] = await connection.execute(serviceCheckQuery, [serviceId]);
    
    if ((serviceRows as any[]).length === 0) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }
    
    // Check if already in favorites
    const existsQuery = 'SELECT id FROM client_favorites WHERE client_id = ? AND service_id = ?';
    const [existsRows] = await connection.execute(existsQuery, [clientId, serviceId]);
    
    if ((existsRows as any[]).length > 0) {
      return res.status(409).json({ error: 'Service already in favorites' });
    }
    
    const insertQuery = `
      INSERT INTO client_favorites (client_id, service_id)
      VALUES (?, ?)
    `;
    
    const result = await connection.execute(insertQuery, [clientId, serviceId]);
    console.log('Insert result:', result);
    
    return res.json({ message: 'Service added to favorites successfully' });
  } catch (error: any) {
    console.error('Error adding to favorites:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Service already in favorites' });
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Invalid client ID or service ID' });
    } else {
      return res.status(500).json({ error: 'Failed to add to favorites', details: error.message });
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Remove service from favorites
router.delete('/remove', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const { clientId, serviceId } = req.body;
    
    if (!clientId || !serviceId) {
      await connection.end();
      return res.status(400).json({ error: 'Client ID and Service ID are required' });
    }
    
    const query = `
      DELETE FROM client_favorites 
      WHERE client_id = ? AND service_id = ?
    `;
    
    const [result] = await connection.execute(query, [clientId, serviceId]);
    await connection.end();
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    return res.json({ message: 'Service removed from favorites successfully' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Check if service is in favorites
router.get('/check/:clientId/:serviceId', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const clientId = parseInt(req.params.clientId);
    const serviceId = parseInt(req.params.serviceId);
    
    const query = `
      SELECT COUNT(*) as count
      FROM client_favorites 
      WHERE client_id = ? AND service_id = ?
    `;
    
    const [rows] = await connection.execute(query, [clientId, serviceId]);
    const isFavorite = (rows as any[])[0].count > 0;
    
    await connection.end();
    res.json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
});

// Get favorites count for dashboard stats
router.get('/count/:clientId', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const clientId = parseInt(req.params.clientId);
    
    console.log('Fetching favorites count for client ID:', clientId);
    
    const query = `
      SELECT COUNT(*) as count
      FROM client_favorites f
      JOIN vendor_services s ON f.service_id = s.id
      WHERE f.client_id = ? AND s.is_active = 1
    `;
    
    const [rows] = await connection.execute(query, [clientId]);
    const count = (rows as any[])[0]?.count || 0;
    
    console.log('Favorites count result:', count);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching favorites count:', error);
    res.status(500).json({ error: 'Failed to fetch favorites count' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

export default router;
