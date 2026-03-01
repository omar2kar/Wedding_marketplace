const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const router = express.Router();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};

/**
 * Vendor Login
 * POST /api/vendor/login
 */
router.post('/login', async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;
        
        console.log('Vendor login attempt:', email);

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Get vendor from database
        const [vendors] = await connection.execute(
            'SELECT id, email, password, name, business_name, status FROM vendors WHERE email = ?',
            [email]
        );

        if (vendors.length === 0) {
            console.log('Vendor not found:', email);
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
        console.log('Validating password for vendor:', vendor.email);
        const validPassword = await bcrypt.compare(password, vendor.password);

        if (!validPassword) {
            console.log('Invalid password for vendor:', vendor.email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: vendor.id,
                email: vendor.email,
                type: 'vendor'
            },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );

        console.log('Vendor login successful:', vendor.email);

        // Return vendor data and token
        res.json({
            token,
            vendor: {
                id: vendor.id,
                email: vendor.email,
                name: vendor.name,
                business_name: vendor.business_name,
                status: vendor.status
            }
        });

    } catch (error) {
        console.error('Vendor login error:', error);
        res.status(500).json({ 
            error: 'An error occurred during login',
            details: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Vendor Registration
 * POST /api/vendor/register
 */
router.post('/register', async (req, res) => {
    let connection;
    try {
        const { email, password, name, business_name, phone, category } = req.body;

        console.log('Vendor registration attempt:', email);

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Check if vendor already exists
        const [existingVendors] = await connection.execute(
            'SELECT id FROM vendors WHERE email = ?',
            [email]
        );

        if (existingVendors.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new vendor
        const [result] = await connection.execute(
            `INSERT INTO vendors (email, password, name, business_name, phone, category, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [email, hashedPassword, name, business_name || null, phone || null, category || null]
        );

        const vendorId = result.insertId;

        console.log('Vendor registered successfully:', email, 'ID:', vendorId);

        // Generate JWT token
        const token = jwt.sign(
            {
                id: vendorId,
                email: email,
                type: 'vendor'
            },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            vendor: {
                id: vendorId,
                email: email,
                name: name,
                business_name: business_name,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Vendor registration error:', error);
        res.status(500).json({ 
            error: 'An error occurred during registration',
            details: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get Vendor Profile
 * GET /api/vendor/profile
 */
router.get('/profile', authenticateVendor, async (req, res) => {
    let connection;
    try {
        const vendorId = req.vendorId;
        connection = await mysql.createConnection(dbConfig);

        const [vendors] = await connection.execute(
            `SELECT id, email, name, business_name, phone, category, status, rating, total_reviews, 
                    profile_image, bio, city, website, is_verified, created_at 
             FROM vendors WHERE id = ?`,
            [vendorId]
        );

        if (vendors.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        res.json(vendors[0]);

    } catch (error) {
        console.error('Error fetching vendor profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Update Vendor Profile
 * PUT /api/vendor/profile
 */
router.put('/profile', authenticateVendor, async (req, res) => {
    let connection;
    try {
        const vendorId = req.vendorId;
        console.log('PUT /profile - vendorId:', vendorId, 'body:', JSON.stringify(req.body));
        
        const { name, business_name, phone, category, bio, profile_image, city, website } = req.body;

        connection = await mysql.createConnection(dbConfig);

        // Build dynamic update query to only update provided fields
        const updates = [];
        const values = [];

        if (name !== undefined && name !== null) {
            updates.push('name = ?');
            values.push(name);
        }
        if (business_name !== undefined && business_name !== null) {
            updates.push('business_name = ?');
            values.push(business_name);
        }
        if (phone !== undefined && phone !== null) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (category !== undefined && category !== null) {
            updates.push('category = ?');
            values.push(category);
        }
        if (bio !== undefined) {
            updates.push('bio = ?');
            values.push(bio);
        }
        if (profile_image !== undefined && profile_image !== null) {
            updates.push('profile_image = ?');
            values.push(profile_image);
        }
        if (city !== undefined) {
            updates.push('city = ?');
            values.push(city);
        }
        if (website !== undefined) {
            updates.push('website = ?');
            values.push(website);
        }

        // Also check for camelCase variants from frontend
        if (updates.length === 0 && req.body.profileImage !== undefined) {
            updates.push('profile_image = ?');
            values.push(req.body.profileImage);
        }
        if (updates.length === 0 && req.body.businessName !== undefined) {
            updates.push('business_name = ?');
            values.push(req.body.businessName);
        }

        console.log('PUT /profile - updates:', updates, 'values:', values);

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update', receivedBody: req.body });
        }

        values.push(vendorId);

        await connection.execute(
            `UPDATE vendors SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        // Fetch and return updated vendor data
        const [vendors] = await connection.execute(
            `SELECT id, name, email, phone, business_name, category, bio, profile_image, 
                    status, rating, created_at, city, website, is_verified 
             FROM vendors WHERE id = ?`,
            [vendorId]
        );

        if (vendors.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const updatedVendor = vendors[0];
        res.json(updatedVendor);

    } catch (error) {
        console.error('Error updating vendor profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    } finally {
        if (connection) await connection.end();
    }
});

// JWT middleware for vendor authentication
function authenticateVendor(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        req.vendorId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = router;