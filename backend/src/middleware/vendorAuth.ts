import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface VendorPayload {
  id: number;
  email: string;
  type: 'vendor';
}

declare global {
  namespace Express {
    interface Request {
      vendor?: VendorPayload;
    }
  }
}

const allowDemo = process.env.ALLOW_DEMO_LOGIN === 'true';

export const vendorAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    console.log('vendorAuth header:', authHeader);
    
    if (!authHeader) {
      if (allowDemo) {
        // demo mode: allow vendor without token
        req.vendor = { id: 1, email: 'demo@test.com', type: 'vendor' } as VendorPayload;
        return next();
      }
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    // Support both "Bearer <token>" and raw token formats
    const parts = authHeader.split(' ');
    let token = parts.length === 2 ? parts[1] : parts[0];
    token = token.trim();

    // Development bypass for demo token or any short token used by frontend mock login
    // Accept any header that contains demo-vendor-token (with or without Bearer)
    if (allowDemo && (token === 'demo-vendor-token' || authHeader.includes('demo-vendor-token') || token === 'null' || token === 'undefined')) {
      req.vendor = { id: 1, email: 'demo@test.com', type: 'vendor' } as VendorPayload;
      return next();
    }
    
    // In development allow empty token to continue as demo vendor to avoid 401
    if (!token) {
      if (allowDemo) {
        req.vendor = { id: 1, email: 'demo@test.com', type: 'vendor' } as VendorPayload;
        return next();
      }
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as VendorPayload;
    
    if (decoded.type !== 'vendor') {
      return res.status(403).json({ error: 'Not authorized as vendor' });
    }

    req.vendor = decoded;
    next();
  } catch (error) {
    console.error('Vendor auth error:', error);
    
    // Provide specific error messages based on JWT error type
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: 'Your session has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: 'Invalid authentication token. Please login again.',
        code: 'TOKEN_INVALID'
      });
    } else {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: 'Authentication failed. Please login again.',
        code: 'AUTH_FAILED'
      });
    }
  }
};
