const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};

// GET /api/featured-vendors (public)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT 
                v.id, v.business_name, v.name as owner_name, v.category, 
                v.rating, v.total_reviews, v.profile_image, v.is_verified,
                fv.display_order,
                (SELECT file_path FROM service_images si 
                 JOIN vendor_services vs ON si.service_id = vs.id 
                 WHERE vs.vendor_id = v.id AND vs.is_active = 1
                 ORDER BY si.is_primary DESC LIMIT 1) as service_image
             FROM featured_vendors fv
             JOIN vendors v ON fv.vendor_id = v.id
             ORDER BY fv.display_order ASC, fv.created_at DESC`
        );

        const vendors = rows.map(r => ({
            id: r.id,
            businessName: r.business_name,
            ownerName: r.owner_name,
            category: r.category,
            rating: parseFloat(r.rating) || 0,
            reviewCount: r.total_reviews || 0,
            profileImage: r.profile_image || r.service_image || null,
            isVerified: Boolean(r.is_verified),
            displayOrder: r.display_order
        }));

        res.json(vendors);
    } catch (error) {
        console.error('Error fetching featured vendors:', error);
        res.status(500).json({ error: 'Failed to fetch featured vendors' });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/featured-vendors/all-vendors (admin)
router.get('/all-vendors', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT v.id, v.business_name, v.name as owner_name, v.category, v.rating, v.profile_image,
                    (SELECT id FROM featured_vendors WHERE vendor_id = v.id) as is_featured
             FROM vendors v
             WHERE v.status = 'approved' OR v.status IS NULL
             ORDER BY v.business_name ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    } finally {
        if (connection) await connection.end();
    }
});

// POST /api/featured-vendors
router.post('/', async (req, res) => {
    let connection;
    try {
        const { vendorId, displayOrder } = req.body;
        if (!vendorId) return res.status(400).json({ error: 'vendorId required' });

        connection = await mysql.createConnection(dbConfig);
        const [maxRows] = await connection.execute('SELECT MAX(display_order) as maxOrder FROM featured_vendors');
        const nextOrder = displayOrder || (maxRows[0].maxOrder || 0) + 1;

        await connection.execute(
            'INSERT INTO featured_vendors (vendor_id, display_order) VALUES (?, ?) ON DUPLICATE KEY UPDATE display_order = VALUES(display_order)',
            [vendorId, nextOrder]
        );

        res.status(201).json({ success: true, message: 'Vendor added to featured' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to add featured vendor' });
    } finally {
        if (connection) await connection.end();
    }
});

// DELETE /api/featured-vendors/:vendorId
router.delete('/:vendorId', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM featured_vendors WHERE vendor_id = ?', [req.params.vendorId]);
        res.json({ success: true, message: 'Vendor removed from featured' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to remove' });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /api/featured-vendors/reorder
router.put('/reorder', async (req, res) => {
    let connection;
    try {
        const { order } = req.body;
        if (!order || !Array.isArray(order)) return res.status(400).json({ error: 'order array required' });

        connection = await mysql.createConnection(dbConfig);
        for (let i = 0; i < order.length; i++) {
            await connection.execute(
                'UPDATE featured_vendors SET display_order = ? WHERE vendor_id = ?',
                [order[i].displayOrder, order[i].vendorId]
            );
        }
        res.json({ success: true, message: 'Order updated' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to reorder' });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;