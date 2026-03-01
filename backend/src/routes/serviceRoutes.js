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

/**
 * Get all vendors with filters (instead of individual services)
 * GET /api/services (keeping same endpoint for backwards compatibility)
 */
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const {
            category = '',
            minPrice = 0,
            maxPrice = 999999,
            minRating = 0,
            keyword = '',
            limit = 50,
            offset = 0
        } = req.query;

        console.log('Fetching vendors with filters:', { category, minPrice, maxPrice, minRating, keyword });

        let query = `
            SELECT 
                v.id,
                v.business_name,
                v.name as owner_name,
                v.phone,
                v.email,
                v.category as vendor_category,
                v.rating,
                v.total_reviews,
                v.created_at,
                v.profile_image as vendor_profile_image,
                COUNT(CASE WHEN vs.is_active = 1 THEN vs.id END) as service_count,
                MIN(CASE WHEN vs.is_active = 1 THEN vs.price END) as min_price,
                MAX(CASE WHEN vs.is_active = 1 THEN vs.price END) as max_price,
                GROUP_CONCAT(DISTINCT CASE WHEN vs.is_active = 1 THEN vs.category END) as service_categories,
                (SELECT file_path FROM service_images si 
                 INNER JOIN vendor_services vss ON si.service_id = vss.id 
                 WHERE vss.vendor_id = v.id AND vss.is_active = 1
                 ORDER BY si.is_primary DESC, si.id ASC 
                 LIMIT 1) as service_image
            FROM vendors v
            LEFT JOIN vendor_services vs ON v.id = vs.vendor_id
            WHERE v.status = 'approved'
        `;

        const params = [];

        // Category name mapping: frontend names -> possible DB values
        const categoryMap = {
            'Photography': ['Photography', 'photography'],
            'Videography': ['Videography', 'videography'],
            'Floristry': ['Floristry', 'floristry', 'Florist', 'florist'],
            'Venues': ['Venues', 'venues', 'Venue', 'venue'],
            'Beauty': ['Beauty', 'beauty', 'Makeup', 'makeup'],
            'Entertainment': ['Entertainment', 'entertainment', 'Music & Entertainment', 'Music'],
            'Cake & Sweets': ['Cake & Sweets', 'cake & sweets', 'Cake', 'cake', 'Catering', 'catering'],
            'Planning': ['Planning', 'planning', 'Planner', 'planner'],
            'Car Rental': ['Car Rental', 'car rental'],
        };

        // Add category filter (check BOTH vendors.category AND vendor_services.category)
        if (category && category !== 'All' && category !== '') {
            const possibleNames = categoryMap[category] || [category];
            const placeholders = possibleNames.map(() => '?').join(',');
            
            query += ` AND (
                LOWER(v.category) IN (${possibleNames.map(() => 'LOWER(?)').join(',')})
                OR EXISTS (SELECT 1 FROM vendor_services vsc WHERE vsc.vendor_id = v.id AND LOWER(vsc.category) IN (${possibleNames.map(() => 'LOWER(?)').join(',')}) AND vsc.is_active = 1)
            )`;
            params.push(...possibleNames, ...possibleNames);
        }

        // Add price range filter 
        if (Number(minPrice) > 0 || Number(maxPrice) < 999999) {
            query += ` AND EXISTS (SELECT 1 FROM vendor_services vsp WHERE vsp.vendor_id = v.id AND vsp.price >= ? AND vsp.price <= ? AND vsp.is_active = 1)`;
            params.push(Number(minPrice), Number(maxPrice));
        }

        // Add keyword search
        if (keyword) {
            query += ` AND (v.business_name LIKE ? OR v.name LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        // Group by vendor
        query += ` GROUP BY v.id, v.business_name, v.name, v.phone, v.email, v.category, v.rating, v.total_reviews, v.created_at`;

        // Add rating filter (don't require active services if filtering by vendor category)
        let havingConditions = [];
        
        // Only require active services if NOT filtering by category (when filtering by category, vendor.category match is enough)
        if (!category || category === 'All' || category === '') {
            havingConditions.push('COUNT(CASE WHEN vs.is_active = 1 THEN vs.id END) > 0');
        }
        
        if (Number(minRating) > 0) {
            havingConditions.push('v.rating >= ?');
            params.push(Number(minRating));
        }
        
        if (havingConditions.length > 0) {
            query += ` HAVING ${havingConditions.join(' AND ')}`;
        }

        query += ` ORDER BY v.rating DESC, v.created_at DESC`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        console.log('Executing vendor query with params:', params);
        console.log('Final query:', query);

        const [vendors] = await connection.execute(query, params);
        
        console.log('Raw vendor data from database:', vendors);

        // Process vendors to format data
        const processedVendors = vendors.map(row => {
            console.log('Processing vendor row:', row);
            return {
                id: row.id,
                businessName: row.business_name || 'بائع غير محدد',
                ownerName: row.owner_name || 'غير محدد',
                phone: row.phone || '',
                email: row.email || '',
                city: 'غير محدد', // الحقل غير موجود في قاعدة البيانات الحالية
                vendorCategory: row.vendor_category || 'غير محدد',
                description: 'لا يوجد وصف متاح', // الحقل غير موجود في قاعدة البيانات الحالية
                rating: row.rating ? Number(row.rating) : 0,
                reviewCount: Number(row.total_reviews) || 0,
                isVerified: Boolean(row.is_verified) || false,
                createdAt: row.created_at,
                serviceCount: Number(row.service_count) || 0,
                minPrice: row.min_price ? Number(row.min_price) : 0,
                maxPrice: row.max_price ? Number(row.max_price) : 0,
                serviceCategories: row.service_categories ? row.service_categories.split(',') : [],
                profileImage: row.vendor_profile_image || row.service_image || null
            };
        });

        console.log(`Returning ${processedVendors.length} vendors`);

        res.json(processedVendors);

    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ 
            error: 'Failed to fetch vendors',
            details: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get service by ID
 * GET /api/services/:id
 */
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;

        const [services] = await connection.execute(
            `SELECT 
                vs.*,
                v.id as vendor_id,
                v.business_name as vendor_businessName,
                v.name as vendor_ownerName,
                v.phone as vendor_phone,
                v.email as vendor_email,
                v.category as vendor_category,
                v.is_verified as vendor_isVerified,
                v.rating as average_rating,
                v.total_reviews,
                (SELECT GROUP_CONCAT(file_path ORDER BY is_primary DESC, display_order ASC) FROM service_images WHERE service_id = vs.id) as images
             FROM vendor_services vs
             INNER JOIN vendors v ON vs.vendor_id = v.id
             WHERE vs.id = ? AND vs.is_active = 1`,
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const row = services[0];
        const service = {
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            price: Number(row.price),
            images: row.images ? row.images.split(',') : [],
            isActive: row.is_active,
            createdAt: row.created_at,
            vendorId: row.vendor_id,
            rating: row.average_rating ? Number(row.average_rating) : 0,
            vendor: {
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
                rating: row.average_rating ? Number(row.average_rating) : 0,
                reviewCount: Number(row.total_reviews) || 0
            }
        };

        // Get reviews for this service
        try {
            const [reviews] = await connection.execute(
                `SELECT 
                    r.*,
                    c.name as client_name
                 FROM service_reviews r
                 LEFT JOIN clients c ON r.client_id = c.id
                 WHERE r.service_id = ?
                 ORDER BY r.created_at DESC
                 LIMIT 10`,
                [id]
            );
            service.reviews = reviews || [];
        } catch (reviewError) {
            console.log('Could not fetch reviews:', reviewError.message);
            service.reviews = [];
        }

        res.json(service);

    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ 
            error: 'Failed to fetch service',
            details: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get vendor profile with all services
 * GET /api/services/vendor/:id
 */
router.get('/vendor/:id', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;

        // Get vendor details
        const [vendorData] = await connection.execute(
            `SELECT 
                v.*,
                COUNT(CASE WHEN vs.is_active = 1 THEN vs.id END) as service_count,
                MIN(CASE WHEN vs.is_active = 1 THEN vs.price END) as min_price,
                MAX(CASE WHEN vs.is_active = 1 THEN vs.price END) as max_price
             FROM vendors v
             LEFT JOIN vendor_services vs ON v.id = vs.vendor_id
             WHERE v.id = ?
             GROUP BY v.id`,
            [id]
        );

        if (vendorData.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const vendor = vendorData[0];

        // Get all vendor services with images
        const [services] = await connection.execute(
            `SELECT 
                vs.*,
                (SELECT GROUP_CONCAT(file_path ORDER BY is_primary DESC, display_order ASC) 
                 FROM service_images WHERE service_id = vs.id) as images
             FROM vendor_services vs
             WHERE vs.vendor_id = ? AND vs.is_active = 1
             ORDER BY vs.created_at DESC`,
            [id]
        );

        // Get vendor reviews (handle missing table gracefully)
        let reviews = [];
        try {
            const [reviewRows] = await connection.execute(
                `SELECT 
                    sr.rating,
                    sr.comment,
                    sr.created_at,
                    c.name as client_name,
                    vs.name as service_name
                 FROM service_reviews sr
                 LEFT JOIN clients c ON sr.client_id = c.id
                 LEFT JOIN vendor_services vs ON sr.service_id = vs.id
                 WHERE vs.vendor_id = ?
                 ORDER BY sr.created_at DESC
                 LIMIT 10`,
                [id]
            );
            reviews = reviewRows || [];
        } catch (reviewError) {
            console.log('Could not fetch reviews (table may not exist):', reviewError.message);
            // Try alternative reviews table
            try {
                const [reviewRows] = await connection.execute(
                    `SELECT 
                        r.rating,
                        r.comment,
                        r.created_at,
                        c.name as client_name,
                        vs.name as service_name
                     FROM reviews r
                     LEFT JOIN clients c ON r.client_id = c.id
                     LEFT JOIN vendor_services vs ON r.service_id = vs.id
                     WHERE r.vendor_id = ?
                     ORDER BY r.created_at DESC
                     LIMIT 10`,
                    [id]
                );
                reviews = reviewRows || [];
            } catch (e) {
                console.log('No reviews table found, returning empty reviews');
                reviews = [];
            }
        }

        // Get packages for vendor services
        let packages = [];
        try {
            const serviceIds = services.map(s => s.id);
            if (serviceIds.length > 0) {
                const placeholders = serviceIds.map(() => '?').join(',');
                const [packageRows] = await connection.execute(
                    `SELECT * FROM service_packages WHERE service_id IN (${placeholders}) AND is_active = 1 ORDER BY price ASC`,
                    serviceIds
                );
                packages = packageRows || [];
            }
        } catch (pkgError) {
            console.log('Could not fetch packages:', pkgError.message);
            packages = [];
        }

        // Process services data
        const processedServices = services.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            category: service.category,
            price: Number(service.price),
            images: service.images ? service.images.split(',') : [],
            isActive: service.is_active,
            createdAt: service.created_at,
            packages: packages.filter(p => p.service_id === service.id).map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: Number(p.price),
                features: p.features ? (typeof p.features === 'string' ? JSON.parse(p.features) : p.features) : []
            }))
        }));

        const vendorProfile = {
            id: vendor.id,
            businessName: vendor.business_name || 'Unknown Vendor',
            ownerName: vendor.name || 'Unknown',
            email: vendor.email || '',
            phone: vendor.phone || '',
            city: vendor.city || '',
            category: vendor.category || 'General',
            description: vendor.bio || vendor.description || '',
            isVerified: Boolean(vendor.is_verified),
            rating: vendor.rating ? Number(vendor.rating) : 0,
            reviewCount: Number(vendor.total_reviews) || 0,
            createdAt: vendor.created_at,
            serviceCount: Number(vendor.service_count) || 0,
            minPrice: vendor.min_price ? Number(vendor.min_price) : 0,
            maxPrice: vendor.max_price ? Number(vendor.max_price) : 0,
            services: processedServices,
            reviews: reviews
        };

        res.json(vendorProfile);

    } catch (error) {
        console.error('Error fetching vendor profile:', error);
        res.status(500).json({ 
            error: 'Failed to fetch vendor profile',
            details: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;