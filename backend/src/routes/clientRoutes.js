const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wedding_marketplace'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Client Registration
 * POST /api/client/register
 */
router.post('/register', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { name, email, password, phone } = req.body;

        console.log('Client registration attempt:', { name, email, phone });

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Check if email already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM clients WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new client
        const [result] = await connection.execute(
            'INSERT INTO clients (name, email, password, phone, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, email, hashedPassword, phone || null]
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: result.insertId, email, type: 'client' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Client registered successfully:', result.insertId);

        res.json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: result.insertId,
                name,
                email,
                phone
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Registration failed',
            details: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Client Login
 * POST /api/client/login
 */
router.post('/login', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { email, password } = req.body;

        console.log('Client login attempt:', email);

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find client by email
        const [clients] = await connection.execute(
            'SELECT * FROM clients WHERE email = ?',
            [email]
        );

        if (clients.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const client = clients[0];


        // Verify password
        const passwordMatch = await bcrypt.compare(password, client.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: client.id, email: client.email, type: 'client' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Update last login
        await connection.execute(
            'UPDATE clients SET last_login_at = NOW() WHERE id = ?',
            [client.id]
        );

        console.log('Client logged in successfully:', client.id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: client.id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                profile_image: client.profile_image
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed',
            details: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get Client Profile
 * GET /api/client/profile
 */
router.get('/profile', authenticateClient, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const [clients] = await connection.execute(
            'SELECT id, name, email, phone, profile_image, created_at, total_bookings, total_spent FROM clients WHERE id = ?',
            [req.clientId]
        );

        if (clients.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json({
            success: true,
            user: clients[0]
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Update Client Profile
 * PUT /api/client/profile
 */
router.put('/profile', authenticateClient, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { name, phone, profile_image } = req.body;

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (phone) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (profile_image) {
            updates.push('profile_image = ?');
            values.push(profile_image);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.clientId);

        await connection.execute(
            `UPDATE clients SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        // Fetch and return updated client data
        const [clients] = await connection.execute(
            'SELECT id, name, email, phone, profile_image, address, city, country, created_at FROM clients WHERE id = ?',
            [req.clientId]
        );

        if (clients.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const updatedClient = clients[0];
        res.json(updatedClient);

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get Client Bookings
 * GET /api/client/bookings
 */
router.get('/bookings', authenticateClient, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const [bookings] = await connection.execute(
            `SELECT 
                b.*,
                vs.name as service_name,
                vs.category as service_category,
                v.business_name as vendor_name,
                v.phone as vendor_phone
             FROM bookings b
             INNER JOIN vendor_services vs ON b.service_id = vs.id
             INNER JOIN vendors v ON vs.vendor_id = v.id
             WHERE b.client_id = ?
             ORDER BY b.created_at DESC`,
            [req.clientId]
        );

        res.json({
            success: true,
            bookings
        });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get Client Favorites
 * GET /api/client/favorites
 */
router.get('/favorites', authenticateClient, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const [favorites] = await connection.execute(
            `SELECT 
                cf.*,
                vs.name as service_name,
                vs.description as service_description,
                vs.category as service_category,
                vs.price as service_price,
                v.business_name as vendor_name,
                v.average_rating,
                (SELECT file_path FROM service_images WHERE service_id = vs.id AND is_primary = 1 LIMIT 1) as image
             FROM client_favorites cf
             INNER JOIN vendor_services vs ON cf.service_id = vs.id
             INNER JOIN vendors v ON vs.vendor_id = v.id
             WHERE cf.client_id = ?
             ORDER BY cf.created_at DESC`,
            [req.clientId]
        );

        res.json({
            success: true,
            favorites
        });

    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Add to Favorites
 * POST /api/client/favorites
 */
router.post('/favorites', authenticateClient, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { serviceId } = req.body;

        // Check if already favorited
        const [existing] = await connection.execute(
            'SELECT id FROM client_favorites WHERE client_id = ? AND service_id = ?',
            [req.clientId, serviceId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already in favorites' });
        }

        await connection.execute(
            'INSERT INTO client_favorites (client_id, service_id, created_at) VALUES (?, ?, NOW())',
            [req.clientId, serviceId]
        );

        res.json({
            success: true,
            message: 'Added to favorites'
        });

    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({ error: 'Failed to add to favorites' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Remove from Favorites
 * DELETE /api/client/favorites/:serviceId
 */
router.delete('/favorites/:serviceId', authenticateClient, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { serviceId } = req.params;

        await connection.execute(
            'DELETE FROM client_favorites WHERE client_id = ? AND service_id = ?',
            [req.clientId, serviceId]
        );

        res.json({
            success: true,
            message: 'Removed from favorites'
        });

    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({ error: 'Failed to remove from favorites' });
    } finally {
        if (connection) await connection.end();
    }
});

// Middleware to authenticate client
function authenticateClient(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'client') {
            return res.status(403).json({ error: 'Access denied' });
        }
        req.clientId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = router;
