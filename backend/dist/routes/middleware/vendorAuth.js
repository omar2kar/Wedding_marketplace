"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorAuthMiddleware = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var allowDemo = process.env.ALLOW_DEMO_LOGIN === 'true';
var vendorAuthMiddleware = function (req, res, next) {
    try {
        var authHeader = req.headers.authorization;
        console.log('vendorAuth header:', authHeader);
        if (!authHeader) {
            if (allowDemo) {
                // demo mode: allow vendor without token
                req.vendor = { id: 1, email: 'demo@test.com', type: 'vendor' };
                return next();
            }
            return res.status(401).json({ error: 'No authorization header provided' });
        }
        // Support both "Bearer <token>" and raw token formats
        var parts = authHeader.split(' ');
        var token = parts.length === 2 ? parts[1] : parts[0];
        token = token.trim();
        // Development bypass for demo token or any short token used by frontend mock login
        // Accept any header that contains demo-vendor-token (with or without Bearer)
        if (allowDemo && (token === 'demo-vendor-token' || authHeader.includes('demo-vendor-token') || token === 'null' || token === 'undefined')) {
            req.vendor = { id: 1, email: 'demo@test.com', type: 'vendor' };
            return next();
        }
        // In development allow empty token to continue as demo vendor to avoid 401
        if (!token) {
            if (allowDemo) {
                req.vendor = { id: 1, email: 'demo@test.com', type: 'vendor' };
                return next();
            }
            return res.status(401).json({ error: 'No token provided' });
        }
        var decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.type !== 'vendor') {
            return res.status(403).json({ error: 'Not authorized as vendor' });
        }
        req.vendor = decoded;
        next();
    }
    catch (error) {
        console.error('Vendor auth error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.vendorAuthMiddleware = vendorAuthMiddleware;
