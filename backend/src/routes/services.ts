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

router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const { category, search, minPrice, maxPrice, minRating, keyword } = req.query;
    let query = `
      SELECT 
        s.*,
        v.id as vendor_id,
        v.business_name as vendor_businessName,
        v.name as vendor_ownerName,
        v.email as vendor_email,
        v.phone as vendor_phone,
        v.category as vendor_category,
        v.is_verified as vendor_isVerified,
        COALESCE(AVG(sr.rating), 0) as calculated_rating,
        COUNT(sr.id) as review_count,
        COALESCE(v.rating, 4.5) as vendor_rating,
        v.total_reviews as vendor_reviewCount,
        GROUP_CONCAT(DISTINCT si.file_path ORDER BY si.is_primary DESC, si.display_order ASC SEPARATOR ',') as image_paths
      FROM vendor_services s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      LEFT JOIN service_reviews sr ON s.id = sr.service_id
      LEFT JOIN service_images si ON s.id = si.service_id
      WHERE s.is_active = 1 AND (v.status = 'approved' OR v.status IS NULL)
    `;
    
    const params: any[] = [];
    
    if (category && category !== 'All') {
      query += ' AND s.category = ?';
      params.push(category);
    }
    
    if (search || keyword) {
      const searchTerm = search || keyword;
      query += ' AND (s.name LIKE ? OR s.description LIKE ? OR v.business_name LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (minPrice) {
      query += ' AND s.price >= ?';
      params.push(parseFloat(minPrice as string));
    }
    
    if (maxPrice) {
      query += ' AND s.price <= ?';
      params.push(parseFloat(maxPrice as string));
    }
    
    if (minRating) {
      query += ' AND COALESCE(AVG(sr.rating), 0) >= ?';
      params.push(parseFloat(minRating as string));
    }
    
    query += ' GROUP BY s.id';
    
    query += ' ORDER BY s.created_at DESC';
    
    const [rows] = await connection.execute(query, params);
    
    const services = (rows as any[]).map(row => {
      // Get images from service_images table, fallback to JSON field
      let images = [];
      if (row.image_paths) {
        images = row.image_paths.split(',').filter((p: string) => p);
      } else if (row.images) {
        try {
          images = JSON.parse(row.images);
        } catch (e) {
          images = [];
        }
      }
      
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        price: parseFloat(row.price),
        images: images,
        rating: parseFloat(row.calculated_rating) || 0,
        vendorName: row.vendor_businessName || row.vendor_ownerName || 'Unknown Vendor',
        vendorEmail: row.vendor_email,
        vendorPhone: row.vendor_phone,
        isActive: row.is_active,
        createdAt: row.created_at,
        vendorId: row.vendor_id,
        vendor: row.vendor_id ? {
          id: row.vendor_id,
          businessName: row.vendor_businessName,
          ownerName: row.vendor_ownerName,
          email: row.vendor_email,
          phone: row.vendor_phone,
          category: row.vendor_category,
          isVerified: row.vendor_isVerified,
          rating: parseFloat(row.calculated_rating) || 0,
          reviewCount: parseInt(row.review_count) || 0
        } : null
      };
    });
    
    await connection.end();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const serviceId = parseInt(req.params.id);
    
    const query = `
      SELECT 
        s.*,
        v.id as vendor_id,
        v.business_name as vendor_businessName,
        v.name as vendor_ownerName,
        v.email as vendor_email,
        v.phone as vendor_phone,
        v.category as vendor_category,
        v.is_verified as vendor_isVerified,
        COALESCE(AVG(sr.rating), 0) as calculated_rating,
        COUNT(sr.id) as review_count,
        COALESCE(v.rating, 4.5) as vendor_rating,
        v.total_reviews as vendor_reviewCount,
        GROUP_CONCAT(DISTINCT si.file_path ORDER BY si.is_primary DESC, si.display_order ASC SEPARATOR ',') as image_paths
      FROM vendor_services s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      LEFT JOIN service_reviews sr ON s.id = sr.service_id
      LEFT JOIN service_images si ON s.id = si.service_id
      WHERE s.id = ? AND s.is_active = 1 AND (v.status = 'approved' OR v.status IS NULL)
      GROUP BY s.id
    `;
    
    const [rows] = await connection.execute(query, [serviceId]);
    
    if ((rows as any[]).length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const row = (rows as any[])[0];
    
    // Get images from service_images table, fallback to JSON field
    let images = [];
    if (row.image_paths) {
      images = row.image_paths.split(',').filter((p: string) => p);
    } else if (row.images) {
      try {
        images = JSON.parse(row.images);
      } catch (e) {
        images = [];
      }
    }
    
    const service = {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      images: images,
      rating: parseFloat(row.calculated_rating) || 0,
      vendorName: row.vendor_businessName || row.vendor_ownerName || 'Unknown Vendor',
      vendorEmail: row.vendor_email,
      vendorPhone: row.vendor_phone,
      isActive: row.is_active,
      createdAt: row.created_at,
      vendorId: row.vendor_id,
      vendor: row.vendor_id ? {
        id: row.vendor_id,
        businessName: row.vendor_businessName,
        ownerName: row.vendor_ownerName,
        email: row.vendor_email,
        phone: row.vendor_phone,
        address: null,
        city: null,
        country: null,
        category: row.vendor_category,
        description: null,
        website: null,
        socialMedia: {},
        isVerified: row.vendor_isVerified,
        rating: parseFloat(row.calculated_rating) || 0,
        reviewCount: parseInt(row.review_count) || 0
      } : null
    };
    
    await connection.end();
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Search services
router.get('/search', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const { q } = req.query;
    
    if (!q) {
      await connection.end();
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const query = `
      SELECT 
        s.*,
        v.id as vendor_id,
        v.business_name as vendor_businessName,
        v.name as vendor_ownerName,
        v.email as vendor_email,
        v.phone as vendor_phone,
        v.category as vendor_category,
        v.is_verified as vendor_isVerified,
        COALESCE(v.rating, 4.5) as vendor_rating,
        v.total_reviews as vendor_reviewCount
      FROM vendor_services s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      WHERE s.is_active = 1 AND (v.status = 'approved' OR v.status IS NULL)
        AND (s.name LIKE ? OR s.description LIKE ? OR v.business_name LIKE ?)
      ORDER BY s.created_at DESC
    `;
    
    const searchTerm = `%${q}%`;
    const [rows] = await connection.execute(query, [searchTerm, searchTerm, searchTerm]);
    
    const services = (rows as any[]).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      images: row.images ? JSON.parse(row.images) : [],
      rating: parseFloat(row.vendor_rating) || 4.5,
      vendorName: row.vendor_businessName || row.vendor_ownerName || 'Unknown Vendor',
      vendorEmail: row.vendor_email,
      vendorPhone: row.vendor_phone,
      isActive: row.is_active,
      createdAt: row.created_at,
      vendorId: row.vendor_id,
      vendor: row.vendor_id ? {
        id: row.vendor_id,
        businessName: row.vendor_businessName,
        ownerName: row.vendor_ownerName,
        email: row.vendor_email,
        phone: row.vendor_phone,
        category: row.vendor_category,
        isVerified: row.vendor_isVerified,
        rating: parseFloat(row.vendor_rating) || 4.5,
        reviewCount: parseInt(row.vendor_reviewCount) || 0
      } : null
    }));
    
    await connection.end();
    res.json(services);
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({ error: 'Failed to search services' });
  }
});

export default router;
