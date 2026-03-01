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
const validateRegisterInput = (req, res, next) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        res.status(400).json({ error: 'Email, password, and name are required' });
        return;
    }
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
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
    if (name.length < 2) {
        res.status(400).json({ error: 'Name must be at least 2 characters' });
        return;
    }
    next();
};
// Helper function to log login attempts
const logLoginAttempt = async (email, ipAddress, success) => {
    try {
        await database_1.default.query('INSERT INTO login_attempts (email, user_type, ip_address, success) VALUES (?, ?, ?, ?)', [email, 'client', ipAddress, success]);
    }
    catch (error) {
        console.error('Error logging login attempt:', error);
    }
};
// Helper function to check rate limiting
const checkRateLimit = async (email, ipAddress) => {
    try {
        // Check failed attempts in last 15 minutes
        const recentAttempts = await database_1.default.query(`SELECT COUNT(*) as count FROM login_attempts 
       WHERE (email = ? OR ip_address = ?) 
       AND user_type = 'client' 
       AND success = FALSE 
       AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`, [email, ipAddress]);
        return recentAttempts[0].count < 5; // Allow max 5 failed attempts per 15 minutes
    }
    catch (error) {
        console.error('Error checking rate limit:', error);
        return true; // Allow login if rate limit check fails
    }
};
// Generate refresh token
const generateRefreshToken = async (userId) => {
    const refreshToken = jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
    // Store refresh token in database
    await database_1.default.query('INSERT INTO refresh_tokens (user_id, user_type, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))', [userId, 'client', refreshToken]);
    return refreshToken;
};
// Client Registration
router.post('/client/register', validateRegisterInput, async (req, res) => {
    try {
        const { email, password, name, phone, role = 'client' } = req.body;
        // Check if client already exists
        const existingClients = await database_1.default.query('SELECT id FROM clients WHERE email = ?', [email]);
        if (existingClients.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        // Insert new client
        const result = await database_1.default.query(`INSERT INTO clients (email, password, name, phone, role, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?)`, [email, hashedPassword, name, phone || null, role, false]);
        const clientId = result.insertId;
        // Generate tokens
        const accessToken = jsonwebtoken_1.default.sign({
            id: clientId,
            email: email,
            type: 'client',
            role: role
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
        const refreshToken = await generateRefreshToken(clientId);
        // Update last login
        await database_1.default.query('UPDATE clients SET last_login_at = NOW() WHERE id = ?', [clientId]);
        res.status(201).json({
            message: 'Registration successful',
            token: accessToken,
            refreshToken,
            expires_in: 3600,
            user: {
                id: clientId,
                email: email,
                name: name,
                role: role,
                phone: phone || null,
                is_verified: false
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'An error occurred during registration' });
    }
});
// Client Login
router.post('/client/login', validateLoginInput, async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        // Check rate limiting
        const canAttempt = await checkRateLimit(email, ipAddress);
        if (!canAttempt) {
            return res.status(429).json({
                error: 'Too many failed login attempts. Please try again in 15 minutes.'
            });
        }
        // Get client from database
        const clients = await database_1.default.query('SELECT id, email, password, name, phone, role, is_verified FROM clients WHERE email = ?', [email]);
        if (clients.length === 0) {
            await logLoginAttempt(email, ipAddress, false);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const client = clients[0];
        // Check password
        const validPassword = await bcrypt_1.default.compare(password, client.password);
        if (!validPassword) {
            await logLoginAttempt(email, ipAddress, false);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Generate tokens
        const accessToken = jsonwebtoken_1.default.sign({
            id: client.id,
            email: client.email,
            type: 'client',
            role: client.role
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
        const refreshToken = await generateRefreshToken(client.id);
        // Update last login and log successful attempt
        await Promise.all([
            database_1.default.query('UPDATE clients SET last_login_at = NOW() WHERE id = ?', [client.id]),
            logLoginAttempt(email, ipAddress, true)
        ]);
        res.json({
            message: 'Login successful',
            token: accessToken,
            refreshToken,
            expires_in: 3600,
            user: {
                id: client.id,
                email: client.email,
                name: client.name,
                role: client.role,
                phone: client.phone,
                is_verified: client.is_verified
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});
// Refresh Token
router.post('/client/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        // Check if refresh token exists in database
        const storedTokens = await database_1.default.query('SELECT user_id FROM refresh_tokens WHERE token = ? AND user_type = ? AND expires_at > NOW()', [refreshToken, 'client']);
        if (storedTokens.length === 0) {
            return res.status(401).json({ error: 'Refresh token expired or invalid' });
        }
        const userId = storedTokens[0].user_id;
        // Get user data
        const clients = await database_1.default.query('SELECT id, email, name, role FROM clients WHERE id = ?', [userId]);
        if (clients.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        const client = clients[0];
        // Generate new access token
        const newAccessToken = jsonwebtoken_1.default.sign({
            id: client.id,
            email: client.email,
            type: 'client',
            role: client.role
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
        res.json({
            token: newAccessToken,
            expires_in: 3600
        });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});
// Logout
router.post('/client/logout', auth_1.authMiddleware, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user.id;
        // Remove refresh token from database
        if (refreshToken) {
            await database_1.default.query('DELETE FROM refresh_tokens WHERE token = ? AND user_id = ? AND user_type = ?', [refreshToken, userId, 'client']);
        }
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'An error occurred during logout' });
    }
});
exports.default = router;
//# sourceMappingURL=clientAuth.js.map