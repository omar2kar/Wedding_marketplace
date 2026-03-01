import { Request, Response, NextFunction } from 'express';
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
export declare const vendorAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=vendorAuth.d.ts.map