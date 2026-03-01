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

// Get reviews for a service (public endpoint)
router.get('/services/:serviceId/reviews', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const serviceId = parseInt(req.params.serviceId);
    
    console.log('Fetching reviews for service ID:', serviceId);
    
    const query = `
      SELECT 
        r.id,
        r.rating,
        r.review_text as comment,
        r.created_at,
        r.is_verified,
        r.helpful_count,
        c.name as client_name
      FROM service_reviews r
      JOIN clients c ON r.client_id = c.id
      WHERE r.service_id = ?
      ORDER BY r.created_at DESC
    `;
    
    const [rows] = await connection.execute(query, [serviceId]);
    console.log('Reviews query result:', rows);
    
    const reviews = (rows as any[]).map(row => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      date: row.created_at,
      isVerified: row.is_verified,
      helpfulCount: row.helpful_count,
      user: row.client_name
    }));
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching service reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Add a new review
router.post('/services/:serviceId/add', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const serviceId = parseInt(req.params.serviceId);
    const { clientId, rating, reviewText } = req.body;
    
    console.log('Adding review:', { serviceId, clientId, rating, reviewText });
    
    // Validate input
    if (!clientId || !rating || !reviewText) {
      return res.status(400).json({ error: 'Client ID, rating, and review text are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    if (reviewText.trim().length < 10) {
      return res.status(400).json({ error: 'Review must be at least 10 characters long' });
    }
    
    // Get vendor ID from service
    const [serviceRows] = await connection.execute(
      'SELECT vendor_id FROM vendor_services WHERE id = ?',
      [serviceId]
    );
    
    if ((serviceRows as any[]).length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const vendorId = (serviceRows as any[])[0].vendor_id;
    
    // For testing purposes, allow multiple reviews from same client
    // In production, you might want to enable this check:
    /*
    const [existingReviews] = await connection.execute(
      'SELECT id FROM service_reviews WHERE client_id = ? AND service_id = ?',
      [clientId, serviceId]
    );
    
    if ((existingReviews as any[]).length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this service' });
    }
    */
    
    // Insert the review
    const insertQuery = `
      INSERT INTO service_reviews (client_id, service_id, vendor_id, rating, review_text)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await connection.execute(insertQuery, [clientId, serviceId, vendorId, rating, reviewText]);
    
    console.log('Review inserted successfully:', result);
    
    // Get client name for response
    const [clientRows] = await connection.execute(
      'SELECT name FROM clients WHERE id = ?',
      [clientId]
    );
    
    const clientName = (clientRows as any[]).length > 0 ? (clientRows as any[])[0].name : 'Client';
    
    res.status(201).json({
      message: 'Review added successfully',
      reviewId: (result as any).insertId,
      clientName: clientName
    });
    
  } catch (error: any) {
    console.error('Error adding review:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'You have already reviewed this service' });
    } else {
      res.status(500).json({ error: 'Failed to add review' });
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Get service rating summary
router.get('/services/:serviceId/summary', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const serviceId = parseInt(req.params.serviceId);
    
    const query = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM service_reviews 
      WHERE service_id = ?
    `;
    
    const [rows] = await connection.execute(query, [serviceId]);
    const summary = (rows as any[])[0];
    
    res.json({
      totalReviews: summary.total_reviews || 0,
      averageRating: parseFloat(summary.average_rating) || 0,
      ratingDistribution: {
        5: summary.five_star || 0,
        4: summary.four_star || 0,
        3: summary.three_star || 0,
        2: summary.two_star || 0,
        1: summary.one_star || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching review summary:', error);
    res.status(500).json({ error: 'Failed to fetch review summary' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

export default router;
