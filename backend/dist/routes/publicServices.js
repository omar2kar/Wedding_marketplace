const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Wrapper for database queries
const db = {
  query: async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
};

// Get all active services for public search
router.get('/services', async (req, res) => {
  try {
    console.log('GET /services called');
    
    const { category, minPrice, maxPrice, minRating, keyword } = req.query;
    
    let sql = `
      SELECT 
        vs.id, 
        vs.name, 
        vs.description, 
        vs.category, 
        vs.price, 
        vs.images, 
        vs.is_active as isActive, 
        vs.created_at as createdAt,
        v.business_name as vendorName,
        v.email as vendorEmail,
        v.phone as vendorPhone
      FROM vendor_services vs
      JOIN vendors v ON vs.vendor_id = v.id
      WHERE vs.is_active = 1
    `;
    
    const params = [];
    
    // Add category filter
    if (category && category !== 'All') {
      sql += ' AND vs.category = ?';
      params.push(category);
    }
    
    // Add price filters
    if (minPrice) {
      sql += ' AND vs.price >= ?';
      params.push(Number(minPrice));
    }
    
    if (maxPrice) {
      sql += ' AND vs.price <= ?';
      params.push(Number(maxPrice));
    }
    
    // Add keyword search
    if (keyword) {
      sql += ' AND (vs.name LIKE ? OR vs.description LIKE ? OR vs.category LIKE ?)';
      const keywordParam = `%${keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam);
    }
    
    sql += ' ORDER BY vs.created_at DESC';
    
    console.log('SQL Query:', sql);
    console.log('Parameters:', params);
    
    const services = await db.query(sql, params);
    
    // Parse images JSON for each service
    const processedServices = services.map(service => ({
      ...service,
      images: service.images ? JSON.parse(service.images) : [],
      rating: 4.5 // Default rating for now
    }));
    
    console.log(`Found ${processedServices.length} services`);
    res.json(processedServices);
    
  } catch (error) {
    console.error('Error fetching public services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get service by ID for public view
router.get('/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    console.log('GET /services/:id called with ID:', serviceId);
    
    const [service] = await db.query(`
      SELECT 
        vs.id, 
        vs.name, 
        vs.description, 
        vs.category, 
        vs.price, 
        vs.images, 
        vs.is_active as isActive, 
        vs.created_at as createdAt,
        v.business_name as vendorName,
        v.email as vendorEmail,
        v.phone as vendorPhone,
        v.address as vendorAddress
      FROM vendor_services vs
      JOIN vendors v ON vs.vendor_id = v.id
      WHERE vs.id = ? AND vs.is_active = 1
    `, [serviceId]);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Parse images JSON
    service.images = service.images ? JSON.parse(service.images) : [];
    service.rating = 4.5; // Default rating for now
    
    console.log('Service found:', service.name);
    res.json(service);
    
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Get categories with service counts
router.get('/categories', async (req, res) => {
  try {
    console.log('GET /categories called');
    
    const categories = await db.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM vendor_services 
      WHERE is_active = 1 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    console.log('Categories found:', categories);
    res.json(categories);
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
