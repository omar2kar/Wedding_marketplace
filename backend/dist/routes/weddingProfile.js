"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promise_1 = __importDefault(require("mysql2/promise"));
const router = express_1.default.Router();
// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};
// Get client's wedding profile
router.get('/client/:clientId', async (req, res) => {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        const clientId = parseInt(req.params.clientId);
        const query = `
      SELECT * FROM client_wedding_profiles 
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
        const [rows] = await connection.execute(query, [clientId]);
        if (rows.length === 0) {
            await connection.end();
            return res.json(null);
        }
        const profile = rows[0];
        const weddingProfile = {
            id: profile.id,
            clientId: profile.client_id,
            weddingDate: profile.wedding_date,
            venueLocation: profile.venue_location,
            guestCount: profile.guest_count,
            budgetMin: parseFloat(profile.budget_min) || 0,
            budgetMax: parseFloat(profile.budget_max) || 0,
            preferredStyle: profile.preferred_style,
            colorTheme: profile.color_theme,
            specialRequirements: profile.special_requirements,
            servicesNeeded: profile.services_needed ? JSON.parse(profile.services_needed) : [],
            createdAt: profile.created_at,
            updatedAt: profile.updated_at
        };
        await connection.end();
        res.json(weddingProfile);
    }
    catch (error) {
        console.error('Error fetching wedding profile:', error);
        res.status(500).json({ error: 'Failed to fetch wedding profile' });
    }
});
// Create or update wedding profile
router.post('/save', async (req, res) => {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        const { clientId, weddingDate, venueLocation, guestCount, budgetMin, budgetMax, preferredStyle, colorTheme, specialRequirements, servicesNeeded } = req.body;
        if (!clientId) {
            await connection.end();
            return res.status(400).json({ error: 'Client ID is required' });
        }
        // Check if profile exists
        const checkQuery = `SELECT id FROM client_wedding_profiles WHERE client_id = ?`;
        const [existing] = await connection.execute(checkQuery, [clientId]);
        let query;
        let params;
        if (existing.length > 0) {
            // Update existing profile
            query = `
        UPDATE client_wedding_profiles 
        SET wedding_date = ?, venue_location = ?, guest_count = ?, 
            budget_min = ?, budget_max = ?, preferred_style = ?, 
            color_theme = ?, special_requirements = ?, services_needed = ?
        WHERE client_id = ?
      `;
            params = [
                weddingDate || null,
                venueLocation || null,
                guestCount || null,
                budgetMin || null,
                budgetMax || null,
                preferredStyle || null,
                colorTheme || null,
                specialRequirements || null,
                servicesNeeded ? JSON.stringify(servicesNeeded) : null,
                clientId
            ];
        }
        else {
            // Create new profile
            query = `
        INSERT INTO client_wedding_profiles 
        (client_id, wedding_date, venue_location, guest_count, budget_min, 
         budget_max, preferred_style, color_theme, special_requirements, services_needed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            params = [
                clientId,
                weddingDate || null,
                venueLocation || null,
                guestCount || null,
                budgetMin || null,
                budgetMax || null,
                preferredStyle || null,
                colorTheme || null,
                specialRequirements || null,
                servicesNeeded ? JSON.stringify(servicesNeeded) : null
            ];
        }
        await connection.execute(query, params);
        await connection.end();
        res.json({ message: 'Wedding profile saved successfully' });
    }
    catch (error) {
        console.error('Error saving wedding profile:', error);
        res.status(500).json({ error: 'Failed to save wedding profile' });
    }
});
// Get filtered services based on wedding profile
router.get('/recommendations/:clientId', async (req, res) => {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        const clientId = parseInt(req.params.clientId);
        // Get client's wedding profile
        const profileQuery = `
      SELECT * FROM client_wedding_profiles 
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
        const [profileRows] = await connection.execute(profileQuery, [clientId]);
        if (profileRows.length === 0) {
            await connection.end();
            return res.json([]);
        }
        const profile = profileRows[0];
        // Build services query based on profile
        let servicesQuery = `
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
    `;
        const params = [];
        // Filter by budget
        if (profile.budget_min && profile.budget_max) {
            servicesQuery += ' AND s.price BETWEEN ? AND ?';
            params.push(profile.budget_min, profile.budget_max);
        }
        // Filter by services needed
        if (profile.services_needed) {
            const servicesNeeded = JSON.parse(profile.services_needed);
            if (servicesNeeded.length > 0) {
                const placeholders = servicesNeeded.map(() => '?').join(',');
                servicesQuery += ` AND s.category IN (${placeholders})`;
                params.push(...servicesNeeded);
            }
        }
        servicesQuery += ' ORDER BY v.rating DESC, s.created_at DESC';
        const [servicesRows] = await connection.execute(servicesQuery, params);
        const services = servicesRows.map(row => ({
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
    }
    catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});
exports.default = router;
//# sourceMappingURL=weddingProfile.js.map