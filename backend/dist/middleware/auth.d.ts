import { Request, Response, NextFunction } from 'express';
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
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const adminAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const vendorAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=auth.d.ts.map