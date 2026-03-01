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
 * Advanced search endpoint with multiple filters
 * GET /api/search/services
 * Query params:
 * - q: search query (searches in name, description)
 * - category: service category
 * - minPrice: minimum price
 * - maxPrice: maximum price
 * - minRating: minimum rating
 * - location: location/city
 * - available: availability date
 * - featured: show only featured services
 * - sortBy: sort field (price, rating, popularity, date)
 * - sortOrder: asc or desc
 * - page: page number (default 1)
 * - limit: items per page (default 12)
 */
router.get('/services', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const {
            q = '',
            category = '',
            minPrice = 0,
            maxPrice = 999999,
            minRating = 0,
            location = '',
            available = '',
            featured = '',
            sortBy = 'rating',
            sortOrder = 'desc',
            page = 1,
            limit = 12
        } = req.query;

        // Calculate offset for pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build the base query
        let query = `
            SELECT 
                vs.id,
                vs.name,
                vs.description,
                vs.category,
                vs.price,
                vs.views_count,
                vs.bookings_count,
                vs.featured,
                vs.is_active,
                v.id as vendor_id,
                v.business_name as vendor_name,
                v.city as vendor_city,
                v.area as vendor_area,
                v.average_rating,
                v.total_reviews,
                v.response_time_hours,
                v.completion_rate,
                v.subscription_type as vendor_subscription,
                (SELECT file_path FROM service_images WHERE service_id = vs.id AND is_primary = 1 LIMIT 1) as primary_image,
                (SELECT COUNT(*) FROM service_images WHERE service_id = vs.id) as image_count,
                (SELECT MIN(price) FROM service_packages WHERE service_id = vs.id AND is_active = 1) as min_package_price,
                (SELECT MAX(price) FROM service_packages WHERE service_id = vs.id AND is_active = 1) as max_package_price
            FROM vendor_services vs
            INNER JOIN vendors v ON vs.vendor_id = v.id
            WHERE vs.is_active = 1 AND v.is_active = 1
        `;

        const params = [];

        // Add search query filter
        if (q) {
            query += ` AND (vs.name LIKE ? OR vs.description LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`);
            
            // Save search history for logged-in users
            if (req.user && req.user.id) {
                const searchHistoryQuery = `
                    INSERT INTO search_history (client_id, search_query, filters, results_count, created_at)
                    VALUES (?, ?, ?, 0, NOW())
                `;
                await connection.execute(searchHistoryQuery, [
                    req.user.id,
                    q,
                    JSON.stringify(req.query)
                ]);
            }
        }

        // Add category filter
        if (category) {
            query += ` AND vs.category = ?`;
            params.push(category);
        }

        // Add price range filter
        query += ` AND vs.price >= ? AND vs.price <= ?`;
        params.push(minPrice, maxPrice);

        // Add rating filter
        if (minRating > 0) {
            query += ` AND v.average_rating >= ?`;
            params.push(minRating);
        }

        // Add location filter
        if (location) {
            query += ` AND (v.city LIKE ? OR v.area LIKE ?)`;
            params.push(`%${location}%`, `%${location}%`);
        }

        // Add availability filter
        if (available) {
            query += ` AND vs.id NOT IN (
                SELECT DISTINCT service_id 
                FROM bookings 
                WHERE event_date = ? 
                AND status IN ('confirmed', 'pending')
            )`;
            params.push(available);
        }

        // Add featured filter
        if (featured === 'true') {
            query += ` AND vs.featured = 1`;
        }

        // Add sorting
        const sortFields = {
            'price': 'vs.price',
            'rating': 'v.average_rating',
            'popularity': 'vs.bookings_count',
            'views': 'vs.views_count',
            'date': 'vs.created_at'
        };

        const sortField = sortFields[sortBy] || 'v.average_rating';
        const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortField} ${order}`;

        // Get total count for pagination
        const countQuery = query.replace(
            /SELECT[\s\S]*FROM/,
            'SELECT COUNT(*) as total FROM'
        ).replace(/ORDER BY[\s\S]*$/, '');

        const [countResult] = await connection.execute(countQuery, params);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / parseInt(limit));

        // Add pagination
        query += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        // Execute main query
        const [results] = await connection.execute(query, params);

        // Update view counts for displayed services
        if (results.length > 0) {
            const serviceIds = results.map(r => r.id);
            await connection.execute(
                `UPDATE vendor_services SET views_count = views_count + 1 WHERE id IN (${serviceIds.map(() => '?').join(',')})`,
                serviceIds
            );
        }

        // Update search history with results count
        if (req.user && req.user.id && q) {
            await connection.execute(
                `UPDATE search_history SET results_count = ? WHERE client_id = ? AND search_query = ? ORDER BY created_at DESC LIMIT 1`,
                [totalItems, req.user.id, q]
            );
        }

        res.json({
            success: true,
            data: results,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems,
                itemsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            },
            filters: {
                query: q,
                category,
                priceRange: { min: minPrice, max: maxPrice },
                minRating,
                location,
                available,
                featured
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search services'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

/**
 * Get search suggestions/autocomplete
 * GET /api/search/suggestions
 */
router.get('/suggestions', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { q = '' } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, suggestions: [] });
        }

        // Get service name suggestions
        const [services] = await connection.execute(
            `SELECT DISTINCT name, category 
             FROM vendor_services 
             WHERE is_active = 1 AND name LIKE ? 
             LIMIT 5`,
            [`%${q}%`]
        );

        // Get vendor name suggestions
        const [vendors] = await connection.execute(
            `SELECT DISTINCT business_name, category 
             FROM vendors 
             WHERE is_active = 1 AND business_name LIKE ? 
             LIMIT 5`,
            [`%${q}%`]
        );

        // Get category suggestions
        const [categories] = await connection.execute(
            `SELECT DISTINCT category 
             FROM vendor_services 
             WHERE is_active = 1 AND category LIKE ? 
             LIMIT 3`,
            [`%${q}%`]
        );

        const suggestions = [
            ...services.map(s => ({ type: 'service', text: s.name, category: s.category })),
            ...vendors.map(v => ({ type: 'vendor', text: v.business_name, category: v.category })),
            ...categories.map(c => ({ type: 'category', text: c.category }))
        ];

        res.json({
            success: true,
            suggestions
        });

    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get suggestions'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

/**
 * Get popular searches
 * GET /api/search/popular
 */
router.get('/popular', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const [results] = await connection.execute(
            `SELECT search_query, COUNT(*) as search_count 
             FROM search_history 
             WHERE search_query IS NOT NULL AND search_query != ''
             GROUP BY search_query 
             ORDER BY search_count DESC 
             LIMIT 10`
        );

        res.json({
            success: true,
            popularSearches: results
        });

    } catch (error) {
        console.error('Popular searches error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get popular searches'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

/**
 * Service comparison endpoint
 * POST /api/search/compare
 * Body: { serviceIds: [1, 2, 3] }
 */
router.post('/compare', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { serviceIds } = req.body;

        if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide service IDs to compare'
            });
        }

        if (serviceIds.length > 4) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 4 services can be compared at once'
            });
        }

        const placeholders = serviceIds.map(() => '?').join(',');
        const [services] = await connection.execute(
            `SELECT 
                vs.*,
                v.business_name as vendor_name,
                v.average_rating,
                v.total_reviews,
                v.response_time_hours,
                v.city as vendor_city,
                v.area as vendor_area,
                (SELECT GROUP_CONCAT(file_path) FROM service_images WHERE service_id = vs.id) as images,
                (SELECT COUNT(*) FROM bookings WHERE service_id = vs.id AND status = 'completed') as completed_bookings
             FROM vendor_services vs
             INNER JOIN vendors v ON vs.vendor_id = v.id
             WHERE vs.id IN (${placeholders})`,
            serviceIds
        );

        // Get packages for each service
        for (let service of services) {
            const [packages] = await connection.execute(
                `SELECT * FROM service_packages WHERE service_id = ? AND is_active = 1 ORDER BY price`,
                [service.id]
            );
            service.packages = packages;
        }

        // Save comparison for user if logged in
        if (req.user && req.user.id) {
            await connection.execute(
                `INSERT INTO comparisons (client_id, service_ids, created_at) VALUES (?, ?, NOW())`,
                [req.user.id, JSON.stringify(serviceIds)]
            );
        }

        res.json({
            success: true,
            services,
            comparisonId: Date.now() // Temporary ID for frontend tracking
        });

    } catch (error) {
        console.error('Compare error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare services'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

module.exports = router;
