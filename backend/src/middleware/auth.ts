import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: number;
  email: string;
  type: 'client';
  iat?: number;
}

interface AdminPayload {
  id: number;
  email: string;
  role: string;
  type: 'admin';
  iat?: number;
}

interface VendorPayload {
  id: number;
  email: string;
  type: 'vendor';
  iat?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      admin?: AdminPayload;
      vendor?: VendorPayload;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// JWT_SECRET validation — fail-fast in production
// ═══════════════════════════════════════════════════════════
const JWT_SECRET = process.env.JWT_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!JWT_SECRET) {
  if (IS_PRODUCTION) {
    // في الإنتاج: ما نسمح بالسيرفر يشتغل بدون secret قوي
    throw new Error(
      'FATAL: JWT_SECRET environment variable is required in production. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  console.warn(
    '⚠️  WARNING: JWT_SECRET not set. Using insecure fallback for DEVELOPMENT only.'
  );
}

const SECRET: string = JWT_SECRET || 'dev-only-insecure-fallback-do-not-use-in-prod';

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

/**
 * يستخرج التوكن من Authorization header مع التحقق الصارم من Bearer prefix.
 * يرجع null لو الصيغة غلط — ما يقبل توكنات بدون Bearer.
 */
const extractBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  return token || null;
};

/**
 * معالج موحّد لأخطاء JWT.
 * ⚠️ ترتيب الـ checks مهم: TokenExpiredError يرث من JsonWebTokenError،
 *    فلازم يجي قبله — وإلا ما يوصله أبداً.
 */
const handleJwtError = (res: Response, error: unknown, role: string): void => {
  console.error(`${role} auth error:`, error);

  if (error instanceof jwt.TokenExpiredError) {
    res.status(401).json({ error: 'Token expired. Please login again.' });
    return;
  }
  if (error instanceof jwt.JsonWebTokenError) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  res.status(401).json({ error: 'Authentication failed' });
};

// ═══════════════════════════════════════════════════════════
// Client Authentication Middleware
// ═══════════════════════════════════════════════════════════
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    // Demo token: development فقط — مقفول كلياً في production
    if (!IS_PRODUCTION && token === 'demo-client-token') {
      console.warn('⚠️  Demo client token used — development mode only');
      req.user = { id: 1, email: 'demo@test.com', type: 'client' };
      next();
      return;
    }

    if (!token) {
      res.status(401).json({ error: 'Access denied. Client token required.' });
      return;
    }

    const decoded = jwt.verify(token, SECRET) as UserPayload;

    if (decoded.type !== 'client') {
      res.status(403).json({ error: 'Access denied. Client privileges required.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    handleJwtError(res, error, 'Client');
  }
};

// ═══════════════════════════════════════════════════════════
// Admin Authentication Middleware
// ═══════════════════════════════════════════════════════════
export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      res.status(401).json({ error: 'Access denied. Admin token required.' });
      return;
    }

    const decoded = jwt.verify(token, SECRET) as AdminPayload;

    if (decoded.type !== 'admin') {
      res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      return;
    }

    // Admin tokens expire after 8 hours (security measure)
    if (decoded.iat && Date.now() / 1000 - decoded.iat > 8 * 60 * 60) {
      res.status(401).json({ error: 'Token expired. Please login again.' });
      return;
    }

    req.admin = decoded;
    next();
  } catch (error) {
    handleJwtError(res, error, 'Admin');
  }
};

// ═══════════════════════════════════════════════════════════
// Vendor Authentication Middleware
// ═══════════════════════════════════════════════════════════
export const vendorAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      res.status(401).json({ error: 'Access denied. Vendor token required.' });
      return;
    }

    const decoded = jwt.verify(token, SECRET) as VendorPayload;

    if (decoded.type !== 'vendor') {
      res.status(403).json({ error: 'Access denied. Vendor privileges required.' });
      return;
    }

    req.vendor = decoded;
    next();
  } catch (error) {
    handleJwtError(res, error, 'Vendor');
  }
};