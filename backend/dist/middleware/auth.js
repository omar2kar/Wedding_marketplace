"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorAuthMiddleware = exports.adminAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header provided' });
        }
        const parts = authHeader.split(' ');
        let token = parts.length === 2 ? parts[1] : parts[0];
        token = token.trim();
        // Development bypass tokens
        if (token === 'demo-client-token' ||
            authHeader.includes('demo-client-token') ||
            token === 'null' ||
            token === 'undefined') {
            req.user = { id: 1, email: 'demo@test.com', type: 'client' };
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.type !== 'client') {
            return res.status(403).json({ error: 'Not authorized as client' });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authMiddleware = authMiddleware;
const adminAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Access denied. Admin token required.' });
            return;
        }
        const token = authHeader.substring(7).trim();
        if (!token) {
            res.status(401).json({ error: 'Access denied. Invalid token format.' });
            return;
        }
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if (decoded.type !== 'admin') {
            res.status(403).json({ error: 'Access denied. Admin privileges required.' });
            return;
        }
        // Check token age (optional security measure)
        if (decoded.iat && Date.now() / 1000 - decoded.iat > 8 * 60 * 60) {
            res.status(401).json({ error: 'Token expired. Please login again.' });
            return;
        }
        req.admin = decoded;
        next();
    }
    catch (error) {
        console.error('Admin auth error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        res.status(401).json({ error: 'Authentication failed' });
    }
};
exports.adminAuthMiddleware = adminAuthMiddleware;
const vendorAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Access denied. Vendor token required.' });
            return;
        }
        const token = authHeader.substring(7).trim();
        if (!token) {
            res.status(401).json({ error: 'Access denied. Invalid token format.' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.type !== 'vendor') {
            res.status(403).json({ error: 'Access denied. Vendor privileges required.' });
            return;
        }
        req.vendor = decoded;
        next();
    }
    catch (error) {
        console.error('Vendor auth error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        res.status(401).json({ error: 'Authentication failed' });
    }
};
exports.vendorAuthMiddleware = vendorAuthMiddleware;
//# sourceMappingURL=auth.js.map