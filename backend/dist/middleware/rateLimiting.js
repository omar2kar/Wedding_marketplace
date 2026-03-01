"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBruteForceProtection = exports.passwordResetRateLimit = exports.registerRateLimit = exports.apiRateLimit = exports.loginRateLimit = exports.createRateLimit = void 0;
const database_1 = __importDefault(require("../database"));
// In-memory store for rate limiting (for production, use Redis)
const rateLimitStore = new Map();
// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);
const createRateLimit = (options) => {
    return async (req, res, next) => {
        try {
            const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || 'unknown';
            const now = Date.now();
            let record = rateLimitStore.get(key);
            if (!record || now > record.resetTime) {
                record = {
                    count: 1,
                    resetTime: now + options.windowMs
                };
                rateLimitStore.set(key, record);
                return next();
            }
            if (record.count >= options.maxAttempts) {
                return res.status(429).json({
                    error: 'Too many requests',
                    retryAfter: Math.ceil((record.resetTime - now) / 1000)
                });
            }
            record.count++;
            rateLimitStore.set(key, record);
            next();
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            next(); // Allow request if rate limiting fails
        }
    };
};
exports.createRateLimit = createRateLimit;
// Login rate limiter - more restrictive
exports.loginRateLimit = (0, exports.createRateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    keyGenerator: (req) => {
        const email = req.body?.email || '';
        const ip = req.ip || 'unknown';
        return `login:${email}:${ip}`;
    }
});
// General API rate limiter
exports.apiRateLimit = (0, exports.createRateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100,
    keyGenerator: (req) => req.ip || 'unknown'
});
// Registration rate limiter
exports.registerRateLimit = (0, exports.createRateLimit)({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    keyGenerator: (req) => req.ip || 'unknown'
});
// Password reset rate limiter
exports.passwordResetRateLimit = (0, exports.createRateLimit)({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    keyGenerator: (req) => {
        const email = req.body?.email || '';
        return `password-reset:${email}`;
    }
});
// Brute force protection with exponential backoff
const createBruteForceProtection = (userType) => {
    return async (req, res, next) => {
        try {
            const email = req.body?.email;
            if (!email) {
                return next();
            }
            // Check recent failed attempts
            const recentAttempts = await database_1.default.query(`SELECT COUNT(*) as count, MAX(attempted_at) as lastAttempt
         FROM login_attempts 
         WHERE email = ? AND user_type = ? AND success = FALSE 
         AND attempted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`, [email, userType]);
            const failedCount = recentAttempts[0]?.count || 0;
            const lastAttempt = recentAttempts[0]?.lastAttempt;
            if (failedCount > 0 && lastAttempt) {
                const timeSinceLastAttempt = Date.now() - new Date(lastAttempt).getTime();
                // Exponential backoff: 2^(attempts-1) minutes, max 30 minutes
                const backoffMinutes = Math.min(Math.pow(2, failedCount - 1), 30);
                const backoffMs = backoffMinutes * 60 * 1000;
                if (timeSinceLastAttempt < backoffMs) {
                    const waitTime = Math.ceil((backoffMs - timeSinceLastAttempt) / 1000);
                    return res.status(429).json({
                        error: `Account temporarily locked due to multiple failed attempts. Try again in ${Math.ceil(waitTime / 60)} minutes.`,
                        retryAfter: waitTime
                    });
                }
            }
            next();
        }
        catch (error) {
            console.error('Brute force protection error:', error);
            next(); // Allow request if protection check fails
        }
    };
};
exports.createBruteForceProtection = createBruteForceProtection;
//# sourceMappingURL=rateLimiting.js.map