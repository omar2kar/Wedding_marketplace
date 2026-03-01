"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../database"));
const router = express_1.default.Router();
// Input validation middleware
const validateLoginInput = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'Invalid input format' });
        return;
    }
    if (!email.includes('@') || email.length < 5) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
    }
    next();
};
// Admin Login
router.post('/admin/login', validateLoginInput, async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔍 Admin login attempt:', { email, passwordLength: password.length });
        // Get admin from database
        const admins = await database_1.default.query('SELECT id, email, password, name, role, is_active FROM admins WHERE email = ? AND is_active = TRUE', [email]);
        console.log('📊 Database query result:', {
            found: admins.length > 0,
            adminCount: admins.length
        });
        if (admins.length === 0) {
            console.log('❌ No admin found with email:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const admin = admins[0];
        console.log('👤 Admin found:', {
            id: admin.id,
            email: admin.email,
            hashPrefix: admin.password.substring(0, 10) + '...',
            hashLength: admin.password.length,
            isActive: admin.is_active
        });
        // Check password
        console.log('🔐 Comparing passwords...');
        console.log('Input password:', password);
        console.log('Stored hash:', admin.password);
        const validPassword = await bcrypt_1.default.compare(password, admin.password);
        console.log('🔍 Password comparison result:', validPassword);
        if (!validPassword) {
            // Log failed login attempt
            console.warn(`❌ Failed admin login attempt for email: ${email} at ${new Date().toISOString()}`);
            console.log('🔧 Debugging info:', {
                inputPassword: password,
                storedHash: admin.password,
            });
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Check if admin account is active
        if (!admin.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }
        // Generate JWT token with shorter expiration for security
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        if (!process.env.JWT_SECRET) {
            console.warn('JWT_SECRET not set in environment variables');
        }
        const token = jsonwebtoken_1.default.sign({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            type: 'admin',
            iat: Math.floor(Date.now() / 1000)
        }, secret, { expiresIn: '8h' });
        // Log successful login
        console.info(`✅ Admin login successful for: ${admin.email} at ${new Date().toISOString()}`);
        // Return success response (don't expose sensitive data)
        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    }
    catch (error) {
        console.error('💥 Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get Dashboard Stats - Now using proper middleware
router.get('/admin/dashboard/stats', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        // Get statistics
        const [pendingVendors, totalVendors, totalClients, totalBookings, todayRegistrations] = await Promise.all([
            database_1.default.query('SELECT COUNT(*) as count FROM vendors WHERE status = "pending"'),
            database_1.default.query('SELECT COUNT(*) as count FROM vendors'),
            database_1.default.query('SELECT COUNT(*) as count FROM clients'),
            database_1.default.query('SELECT COUNT(*) as count FROM bookings'),
            database_1.default.query('SELECT COUNT(*) as count FROM vendors WHERE DATE(created_at) = CURDATE()')
        ]);
        res.json({
            pendingVendors: pendingVendors[0].count,
            totalVendors: totalVendors[0].count,
            totalClients: totalClients[0].count,
            totalBookings: totalBookings[0].count,
            todayRegistrations: todayRegistrations[0].count
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=adminAuth.js.map