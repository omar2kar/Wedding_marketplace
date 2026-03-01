import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database';

const router = express.Router();

// Token validation endpoint for debugging
router.get('/vendor/validate-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ valid: false, error: 'No authorization header' });
    }

    const parts = authHeader.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    return res.json({ 
      valid: true, 
      decoded: {
        id: decoded.id,
        email: decoded.email,
        type: decoded.type,
        exp: decoded.exp,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      }
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        valid: false, 
        error: 'Token expired',
        expiredAt: error.expiredAt
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        valid: false, 
        error: 'Invalid token',
        message: error.message
      });
    }
    return res.status(500).json({ valid: false, error: 'Validation error' });
  }
});

// Vendor Login
router.post('/vendor/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get vendor from database
    const vendors = await db.query(
      'SELECT id, email, password, name, business_name, status FROM vendors WHERE email = ?',
      [email]
    );

    if (vendors.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const vendor = vendors[0];

    // Check if vendor is approved
    if (vendor.status === 'pending') {
      return res.status(403).json({ 
        error: 'Your account is pending approval. Please wait for admin approval.',
        status: 'pending'
      });
    }

    if (vendor.status === 'rejected') {
      return res.status(403).json({ 
        error: 'Your account has been rejected. Please contact support.',
        status: 'rejected'
      });
    }

    if (vendor.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Your account has been suspended. Please contact support.',
        status: 'suspended'
      });
    }

    // Check password
    console.log('Checking password for vendor:', vendor.email);
    console.log('Plain password:', password);
    console.log('Hashed password from DB:', vendor.password);
    
    const validPassword = await bcrypt.compare(password, vendor.password);
    console.log('Password validation result:', validPassword);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: vendor.id, 
        email: vendor.email, 
        type: 'vendor' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return vendor data and token
    res.json({
      token,
      vendor: {
        id: vendor.id,
        email: vendor.email,
        name: vendor.name,
        business_name: vendor.business_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Vendor Registration
router.post('/vendor/register', async (req, res) => {
  try {
    const { email, password, name, business_name, phone, category } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if vendor already exists
    const existingVendors = await db.query(
      'SELECT id FROM vendors WHERE email = ?',
      [email]
    );

    if (existingVendors.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new vendor
    const result = await db.query(
      `INSERT INTO vendors (email, password, name, business_name, phone, category) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, name, business_name || null, phone || null, category || null]
    );

    const vendorId = (result as any).insertId;

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: vendorId, 
        email: email, 
        type: 'vendor' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      vendor: {
        id: vendorId,
        email: email,
        name: name,
        business_name: business_name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

export default router;
