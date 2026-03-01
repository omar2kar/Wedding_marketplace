import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: number;
  email: string;
  type: 'client';
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

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    const parts = authHeader.split(' ');
    let token = parts.length === 2 ? parts[1] : parts[0];
    token = token.trim();

    // Development bypass tokens
    if (
      token === 'demo-client-token' ||
      authHeader.includes('demo-client-token') ||
      token === 'null' ||
      token === 'undefined'
    ) {
      req.user = { id: 1, email: 'demo@test.com', type: 'client' } as UserPayload;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as UserPayload;
    
    if (decoded.type !== 'client') {
      return res.status(403).json({ error: 'Not authorized as client' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    
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
    const decoded = jwt.verify(token, secret) as AdminPayload;
    
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
  } catch (error) {
    console.error('Admin auth error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const vendorAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. Vendor token required.' });
      return;
    }

    const token = authHeader.substring(7).trim();
    
    if (!token) {
      res.status(401).json({ error: 'Access denied. Invalid token format.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as VendorPayload;
    
    if (decoded.type !== 'vendor') {
      res.status(403).json({ error: 'Access denied. Vendor privileges required.' });
      return;
    }

    req.vendor = decoded;
    next();
  } catch (error) {
    console.error('Vendor auth error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};
