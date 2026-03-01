const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wedding_marketplace'
};

// Middleware to verify vendor authentication
const authenticateVendor = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // Extract vendor ID from token or headers
    req.vendorId = parseInt(req.headers['vendor-id']) || parseInt(req.query.vendorId);
    next();
};

/**
 * Get packages for a service
 * GET /api/packages/service/:serviceId
 */
router.get('/service/:serviceId', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { serviceId } = req.params;

        const [packages] = await connection.execute(
            `SELECT * FROM service_packages 
             WHERE service_id = ? AND is_active = 1 
             ORDER BY display_order, price`,
            [serviceId]
        );

        // Parse JSON features
        const packagesWithFeatures = packages.map(pkg => ({
            ...pkg,
            features: pkg.features ? JSON.parse(pkg.features) : []
        }));

        res.json({
            success: true,
            packages: packagesWithFeatures
        });

    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch packages'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Create a new package
 * POST /api/packages
 */
router.post('/', authenticateVendor, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const {
            serviceId,
            name,
            description,
            price,
            discountPercentage,
            features,
            maxGuests,
            durationHours,
            isPopular,
            displayOrder
        } = req.body;

        // Verify service belongs to vendor
        const [service] = await connection.execute(
            'SELECT vendor_id FROM vendor_services WHERE id = ?',
            [serviceId]
        );

        if (service.length === 0 || service[0].vendor_id !== req.vendorId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Insert package
        const [result] = await connection.execute(
            `INSERT INTO service_packages 
             (service_id, name, description, price, discount_percentage, features, 
              max_guests, duration_hours, is_popular, display_order, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
            [
                serviceId,
                name,
                description,
                price,
                discountPercentage || 0,
                JSON.stringify(features || []),
                maxGuests || null,
                durationHours || null,
                isPopular || false,
                displayOrder || 0
            ]
        );

        res.json({
            success: true,
            packageId: result.insertId,
            message: 'Package created successfully'
        });

    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create package'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Update a package
 * PUT /api/packages/:packageId
 */
router.put('/:packageId', authenticateVendor, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { packageId } = req.params;
        const updates = req.body;

        // Verify package belongs to vendor
        const [pkg] = await connection.execute(
            `SELECT sp.*, vs.vendor_id 
             FROM service_packages sp 
             JOIN vendor_services vs ON sp.service_id = vs.id 
             WHERE sp.id = ?`,
            [packageId]
        );

        if (pkg.length === 0 || pkg[0].vendor_id !== req.vendorId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Build update query
        const updateFields = [];
        const values = [];

        if (updates.name !== undefined) {
            updateFields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.description !== undefined) {
            updateFields.push('description = ?');
            values.push(updates.description);
        }
        if (updates.price !== undefined) {
            updateFields.push('price = ?');
            values.push(updates.price);
        }
        if (updates.discountPercentage !== undefined) {
            updateFields.push('discount_percentage = ?');
            values.push(updates.discountPercentage);
        }
        if (updates.features !== undefined) {
            updateFields.push('features = ?');
            values.push(JSON.stringify(updates.features));
        }
        if (updates.maxGuests !== undefined) {
            updateFields.push('max_guests = ?');
            values.push(updates.maxGuests);
        }
        if (updates.durationHours !== undefined) {
            updateFields.push('duration_hours = ?');
            values.push(updates.durationHours);
        }
        if (updates.isPopular !== undefined) {
            updateFields.push('is_popular = ?');
            values.push(updates.isPopular);
        }
        if (updates.displayOrder !== undefined) {
            updateFields.push('display_order = ?');
            values.push(updates.displayOrder);
        }
        if (updates.isActive !== undefined) {
            updateFields.push('is_active = ?');
            values.push(updates.isActive);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        updateFields.push('updated_at = NOW()');
        values.push(packageId);

        await connection.execute(
            `UPDATE service_packages SET ${updateFields.join(', ')} WHERE id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Package updated successfully'
        });

    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update package'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Delete a package
 * DELETE /api/packages/:packageId
 */
router.delete('/:packageId', authenticateVendor, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { packageId } = req.params;

        // Verify package belongs to vendor
        const [pkg] = await connection.execute(
            `SELECT sp.*, vs.vendor_id 
             FROM service_packages sp 
             JOIN vendor_services vs ON sp.service_id = vs.id 
             WHERE sp.id = ?`,
            [packageId]
        );

        if (pkg.length === 0 || pkg[0].vendor_id !== req.vendorId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Soft delete (set is_active to false)
        await connection.execute(
            'UPDATE service_packages SET is_active = 0, updated_at = NOW() WHERE id = ?',
            [packageId]
        );

        res.json({
            success: true,
            message: 'Package deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting package:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete package'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get popular packages across all services
 * GET /api/packages/popular
 */
router.get('/popular', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { limit = 6 } = req.query;

        const [packages] = await connection.execute(
            `SELECT 
                sp.*,
                vs.name as service_name,
                vs.category as service_category,
                v.business_name as vendor_name,
                v.average_rating,
                (SELECT file_path FROM service_images WHERE service_id = sp.service_id AND is_primary = 1 LIMIT 1) as image
             FROM service_packages sp
             JOIN vendor_services vs ON sp.service_id = vs.id
             JOIN vendors v ON vs.vendor_id = v.id
             WHERE sp.is_active = 1 AND sp.is_popular = 1 AND vs.is_active = 1 AND v.is_active = 1
             ORDER BY v.average_rating DESC, sp.price
             LIMIT ?`,
            [parseInt(limit)]
        );

        // Parse JSON features
        const packagesWithFeatures = packages.map(pkg => ({
            ...pkg,
            features: pkg.features ? JSON.parse(pkg.features) : []
        }));

        res.json({
            success: true,
            packages: packagesWithFeatures
        });

    } catch (error) {
        console.error('Error fetching popular packages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch popular packages'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Apply a promotion code to a package
 * POST /api/packages/:packageId/apply-promo
 */
router.post('/:packageId/apply-promo', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { packageId } = req.params;
        const { promoCode } = req.body;

        // Get package details
        const [pkg] = await connection.execute(
            'SELECT * FROM service_packages WHERE id = ? AND is_active = 1',
            [packageId]
        );

        if (pkg.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Package not found'
            });
        }

        // Check if promo code exists and is valid
        const [promo] = await connection.execute(
            `SELECT * FROM promotions 
             WHERE promo_code = ? 
             AND package_id = ? 
             AND is_active = 1 
             AND valid_from <= NOW() 
             AND valid_until >= NOW()
             AND (usage_limit IS NULL OR used_count < usage_limit)`,
            [promoCode, packageId]
        );

        if (promo.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired promo code'
            });
        }

        const promotion = promo[0];
        const originalPrice = pkg[0].price;
        let discountAmount = 0;
        let finalPrice = originalPrice;

        if (promotion.discount_type === 'percentage') {
            discountAmount = (originalPrice * promotion.discount_value) / 100;
            if (promotion.max_discount_amount) {
                discountAmount = Math.min(discountAmount, promotion.max_discount_amount);
            }
        } else {
            discountAmount = promotion.discount_value;
        }

        finalPrice = originalPrice - discountAmount;

        // Check minimum booking amount
        if (promotion.min_booking_amount && originalPrice < promotion.min_booking_amount) {
            return res.status(400).json({
                success: false,
                error: `Minimum booking amount is $${promotion.min_booking_amount}`
            });
        }

        // Update promo usage count
        await connection.execute(
            'UPDATE promotions SET used_count = used_count + 1 WHERE id = ?',
            [promotion.id]
        );

        res.json({
            success: true,
            originalPrice,
            discountAmount,
            finalPrice,
            promoDetails: {
                code: promotion.promo_code,
                description: promotion.description,
                type: promotion.discount_type,
                value: promotion.discount_value
            }
        });

    } catch (error) {
        console.error('Error applying promo:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to apply promo code'
        });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;
