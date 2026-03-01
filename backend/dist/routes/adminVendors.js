"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../database"));
const emailService_1 = __importDefault(require("../services/emailService"));
const router = express_1.default.Router();
// Input validation for vendor actions
const validateVendorAction = (req, res, next) => {
    const { id } = req.params;
    const { notes } = req.body;
    if (!id || isNaN(parseInt(id))) {
        res.status(400).json({ error: 'Valid vendor ID is required' });
        return;
    }
    if (notes && typeof notes !== 'string') {
        res.status(400).json({ error: 'Notes must be a string' });
        return;
    }
    if (notes && notes.length > 500) {
        res.status(400).json({ error: 'Notes cannot exceed 500 characters' });
        return;
    }
    next();
};
// Get all vendors with filters
router.get('/admin/vendors', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const { status, category } = req.query;
        let query = `
      SELECT 
        v.id, v.name, v.email, v.phone, v.business_name, v.category,
        v.status, v.admin_notes, v.created_at, v.approved_at,
        a.name as approved_by_name
      FROM vendors v
      LEFT JOIN admins a ON v.approved_by = a.id
    `;
        const conditions = [];
        const params = [];
        if (status) {
            conditions.push('v.status = ?');
            params.push(status);
        }
        if (category) {
            conditions.push('v.category = ?');
            params.push(category);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY v.created_at DESC';
        const vendors = await database_1.default.query(query, params);
        res.json(vendors);
    }
    catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});
// Get pending vendors
router.get('/admin/vendors/pending', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        console.log('Fetching pending vendors...');
        console.log('Admin ID from token:', req.admin?.id);
        const pendingVendors = await database_1.default.query(`
      SELECT 
        id, name, email, phone, business_name, category, 
        created_at, status
      FROM vendors 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
    `);
        console.log('Pending vendors found:', pendingVendors.length);
        console.log('Sample vendor:', pendingVendors[0] || 'No vendors');
        res.json(pendingVendors);
    }
    catch (error) {
        console.error('Detailed error fetching pending vendors:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch pending vendors', details: error.message });
    }
});
// Approve vendor
router.post('/admin/vendors/:id/approve', auth_1.adminAuthMiddleware, validateVendorAction, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const adminId = req.admin.id;
        // Get vendor details for email
        const [vendor] = await database_1.default.query('SELECT name, email, business_name FROM vendors WHERE id = ?', [id]);
        // Update vendor status (removed admin_notes and approved_by columns that don't exist)
        await database_1.default.query('UPDATE vendors SET status = \'approved\' WHERE id = ?', [id]);
        // Send approval email
        if (vendor) {
            await emailService_1.default.sendVendorApprovalEmail(vendor.email, vendor.name, vendor.business_name);
        }
        console.log(`Admin ${adminId} approved vendor ${id}`);
        res.json({ message: 'Vendor approved successfully' });
    }
    catch (error) {
        console.error('Error approving vendor:', error);
        res.status(500).json({ error: 'Failed to approve vendor' });
    }
});
// Reject vendor
router.post('/admin/vendors/:id/reject', auth_1.adminAuthMiddleware, validateVendorAction, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const adminId = req.admin.id;
        // Get vendor details for email
        const [vendor] = await database_1.default.query('SELECT name, email FROM vendors WHERE id = ?', [id]);
        // Update vendor status (removed rejected_by and admin_notes columns that don't exist)
        await database_1.default.query('UPDATE vendors SET status = \'rejected\' WHERE id = ?', [id]);
        // Send rejection email
        if (vendor) {
            await emailService_1.default.sendVendorRejectionEmail(vendor.email, vendor.name, notes || 'Application rejected');
        }
        console.log(`Admin ${adminId} rejected vendor ${id}`);
        res.json({ message: 'Vendor rejected successfully' });
    }
    catch (error) {
        console.error('Error rejecting vendor:', error);
        res.status(500).json({ error: 'Failed to reject vendor' });
    }
});
// Suspend vendor
router.post('/admin/vendors/:id/suspend', auth_1.adminAuthMiddleware, validateVendorAction, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const adminId = req.admin.id;
        await database_1.default.query(`
      UPDATE vendors 
      SET status = 'suspended'
      WHERE id = ?
    `, [id]);
        res.json({ message: 'Vendor suspended successfully' });
    }
    catch (error) {
        console.error('Error suspending vendor:', error);
        res.status(500).json({ error: 'Failed to suspend vendor' });
    }
});
exports.default = router;
//# sourceMappingURL=adminVendors.js.map