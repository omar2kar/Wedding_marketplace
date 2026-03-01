const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};

// Images directory
const imagesDir = path.join(__dirname, '../../../frontend/public/images');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

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

// UUID generation
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const uuid = generateUUID();
        const ext = path.extname(file.originalname);
        const filename = `${uuid}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

/**
 * Get all services for the authenticated vendor
 * GET /api/vendor/services
 */
router.get('/', authenticateVendor, async (req, res) => {
    let connection;
    try {
        const vendorId = req.vendorId;
        connection = await mysql.createConnection(dbConfig);

        const [services] = await connection.execute(
            `SELECT 
                vs.*,
                (SELECT GROUP_CONCAT(file_path) FROM service_images WHERE service_id = vs.id LIMIT 5) as images
             FROM vendor_services vs
             WHERE vs.vendor_id = ?
             ORDER BY vs.created_at DESC`,
            [vendorId]
        );

        // Process services to format images
        const processedServices = services.map(service => ({
            ...service,
            images: service.images ? service.images.split(',') : [],
            price: Number(service.price)
        }));

        res.json(processedServices);

    } catch (error) {
        console.error('Error fetching vendor services:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Create a new service
 * POST /api/vendor/services
 */
router.post('/', authenticateVendor, upload.array('images', 10), async (req, res) => {
    let connection;
    try {
        const vendorId = req.vendorId;
        const { name, description, category, price, isActive } = req.body;
        const files = req.files;

        console.log('Creating service for vendor:', vendorId);
        console.log('Service data:', { name, description, category, price });
        console.log('Files uploaded:', files ? files.length : 0);

        // Validate required fields
        if (!name || !description || !category || price === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Insert service into database
        const [result] = await connection.execute(
            'INSERT INTO vendor_services (vendor_id, name, description, category, price, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [vendorId, name, description, category, Number(price), isActive !== undefined ? isActive : true]
        );

        const serviceId = result.insertId;
        console.log('Service created with ID:', serviceId);

        // Upload images if provided
        const uploadedImages = [];
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const publicPath = `/images/${file.filename}`;

                try {
                    // Save image record to database
                    const [imageResult] = await connection.execute(
                        `INSERT INTO service_images 
                         (service_id, file_path, original_filename, uploader_id, file_size, mime_type, display_order, is_primary)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [serviceId, publicPath, file.originalname, vendorId, file.size, file.mimetype, i + 1, i === 0]
                    );

                    uploadedImages.push({
                        id: imageResult.insertId,
                        file_path: publicPath,
                        original_filename: file.originalname,
                        is_primary: i === 0
                    });

                    console.log('Image saved:', publicPath);
                } catch (imageError) {
                    console.error('Error saving image to database:', imageError);
                    // Continue with other images
                }
            }
        }

        const newService = {
            id: serviceId,
            vendor_id: vendorId,
            name,
            description,
            category,
            price: Number(price),
            images: uploadedImages.map(img => img.file_path),
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date().toISOString()
        };

        console.log('Service created successfully:', serviceId);
        res.json({
            success: true,
            message: `Service created successfully${uploadedImages.length > 0 ? ` with ${uploadedImages.length} images` : ''}`,
            service: newService
        });

    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ 
            error: 'Failed to create service',
            details: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Update a service
 * PUT /api/vendor/services/:id
 */
router.put('/:id', authenticateVendor, async (req, res) => {
    let connection;
    try {
        const vendorId = req.vendorId;
        const serviceId = parseInt(req.params.id);
        const { name, description, category, price, isActive } = req.body;

        connection = await mysql.createConnection(dbConfig);

        // Verify service belongs to vendor
        const [services] = await connection.execute(
            'SELECT id FROM vendor_services WHERE id = ? AND vendor_id = ?',
            [serviceId, vendorId]
        );

        if (services.length === 0) {
            return res.status(404).json({ error: 'Service not found or access denied' });
        }

        // Update service
        await connection.execute(
            `UPDATE vendor_services 
             SET name = ?, description = ?, category = ?, price = ?, is_active = ?
             WHERE id = ? AND vendor_id = ?`,
            [name, description, category, Number(price), isActive, serviceId, vendorId]
        );

        res.json({
            success: true,
            message: 'Service updated successfully'
        });

    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Delete a service
 * DELETE /api/vendor/services/:id
 */
router.delete('/:id', authenticateVendor, async (req, res) => {
    let connection;
    try {
        const vendorId = req.vendorId;
        const serviceId = parseInt(req.params.id);

        connection = await mysql.createConnection(dbConfig);

        // Get service images before deleting
        const [images] = await connection.execute(
            'SELECT file_path FROM service_images WHERE service_id = ?',
            [serviceId]
        );

        // Verify service belongs to vendor
        const [services] = await connection.execute(
            'SELECT id FROM vendor_services WHERE id = ? AND vendor_id = ?',
            [serviceId, vendorId]
        );

        if (services.length === 0) {
            return res.status(404).json({ error: 'Service not found or access denied' });
        }

        // Delete service images from database
        await connection.execute(
            'DELETE FROM service_images WHERE service_id = ?',
            [serviceId]
        );

        // Delete service
        await connection.execute(
            'DELETE FROM vendor_services WHERE id = ? AND vendor_id = ?',
            [serviceId, vendorId]
        );

        // Delete image files from disk
        images.forEach(image => {
            try {
                const filename = path.basename(image.file_path);
                const filePath = path.join(imagesDir, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileError) {
                console.error('Error deleting file:', fileError);
            }
        });

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Upload images for an existing service
 * POST /api/vendor/services/:id/images
 */
router.post('/:id/images', authenticateVendor, upload.array('images', 10), async (req, res) => {
    let connection;
    try {
        const vendorId = req.vendorId;
        const serviceId = parseInt(req.params.id);
        const files = req.files;

        console.log('Uploading images for service:', serviceId);
        console.log('Files:', files ? files.length : 0);

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No images provided' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Verify service belongs to vendor
        const [services] = await connection.execute(
            'SELECT id FROM vendor_services WHERE id = ? AND vendor_id = ?',
            [serviceId, vendorId]
        );

        if (services.length === 0) {
            return res.status(404).json({ error: 'Service not found or access denied' });
        }

        // Get current image count
        const [countRows] = await connection.execute(
            'SELECT COUNT(*) as count FROM service_images WHERE service_id = ?',
            [serviceId]
        );

        const currentCount = countRows[0].count;
        const maxImages = 10;

        if (currentCount + files.length > maxImages) {
            return res.status(400).json({
                error: `Maximum ${maxImages} images allowed per service. Current: ${currentCount}`
            });
        }

        const uploadedImages = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const publicPath = `/images/${file.filename}`;

            try {
                const [result] = await connection.execute(
                    `INSERT INTO service_images 
                     (service_id, file_path, original_filename, uploader_id, file_size, mime_type, display_order, is_primary)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [serviceId, publicPath, file.originalname, vendorId, file.size, file.mimetype, currentCount + i + 1, currentCount === 0 && i === 0]
                );

                uploadedImages.push({
                    id: result.insertId,
                    file_path: publicPath,
                    original_filename: file.originalname,
                    is_primary: currentCount === 0 && i === 0
                });
            } catch (imageError) {
                console.error('Error saving image:', imageError);
            }
        }

        res.json({
            success: true,
            message: `${uploadedImages.length} images uploaded successfully`,
            images: uploadedImages
        });

    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ 
            error: 'Failed to upload images',
            details: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Delete an image
 * DELETE /api/vendor/services/:serviceId/images/:imageId
 */
router.delete('/:serviceId/images/:imageId', authenticateVendor, async (req, res) => {
    let connection;
    try {
        const vendorId = req.vendorId;
        const serviceId = parseInt(req.params.serviceId);
        const imageId = parseInt(req.params.imageId);

        connection = await mysql.createConnection(dbConfig);

        // Verify service belongs to vendor
        const [services] = await connection.execute(
            'SELECT id FROM vendor_services WHERE id = ? AND vendor_id = ?',
            [serviceId, vendorId]
        );

        if (services.length === 0) {
            return res.status(404).json({ error: 'Service not found or access denied' });
        }

        // Get image info
        const [images] = await connection.execute(
            'SELECT file_path FROM service_images WHERE id = ? AND service_id = ?',
            [imageId, serviceId]
        );

        if (images.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const image = images[0];

        // Delete from database
        await connection.execute(
            'DELETE FROM service_images WHERE id = ? AND service_id = ?',
            [imageId, serviceId]
        );

        // Delete file from disk
        try {
            const filename = path.basename(image.file_path);
            const filePath = path.join(imagesDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fileError) {
            console.error('Error deleting file:', fileError);
        }

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;
