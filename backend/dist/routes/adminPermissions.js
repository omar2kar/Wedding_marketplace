"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../database"));
const router = express_1.default.Router();
// Input validation middleware for admin creation
const validateAdminData = (req, res, next) => {
    const { name, email, password, role } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Name is required' });
        return;
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ error: 'Valid email is required' });
        return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
    }
    if (!role || !['admin', 'super_admin'].includes(role)) {
        res.status(400).json({ error: 'Role must be admin or super_admin' });
        return;
    }
    next();
};
// Get all admins
router.get('/admin/permissions/admins', auth_1.adminAuthMiddleware, async (_req, res) => {
    try {
        const admins = await database_1.default.query(`
      SELECT 
        id, name, email, role, is_active,
        created_at, last_login, 
        (SELECT name FROM admins a2 WHERE a2.id = admins.created_by) as created_by_name
      FROM admins 
      ORDER BY created_at DESC
    `);
        return res.json({ admins });
    }
    catch (error) {
        console.error('Error fetching admins:', error);
        return res.status(500).json({ error: 'Failed to fetch admins' });
    }
});
// Create new admin
router.post('/admin/permissions/admins', auth_1.adminAuthMiddleware, validateAdminData, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const createdBy = req.admin.id;
        // Check if email already exists
        const [existingAdmin] = await database_1.default.query('SELECT id FROM admins WHERE email = ?', [email]);
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Insert new admin
        const result = await database_1.default.query(`
      INSERT INTO admins (name, email, password, role, created_by, created_at, is_active)
      VALUES (?, ?, ?, ?, ?, NOW(), TRUE)
    `, [name, email, hashedPassword, role, createdBy]);
        // Log the action
        await database_1.default.query(`
      INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id, description, created_at)
      VALUES (?, 'create', 'admin', ?, ?, NOW())
    `, [createdBy, result.insertId, `Created new admin: ${name} (${email})`]);
        console.log(`Admin ${createdBy} created new admin: ${name} (${email})`);
        return res.json({ message: 'Admin created successfully' });
    }
    catch (error) {
        console.error('Error creating admin:', error);
        return res.status(500).json({ error: 'Failed to create admin' });
    }
});
// Update admin
router.put('/admin/permissions/admins/:id', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, is_active } = req.body;
        const adminId = req.admin.id;
        if (!name || !role) {
            return res.status(400).json({ error: 'Name and role are required' });
        }
        if (!['admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        // Get current admin info for logging
        const [currentAdmin] = await database_1.default.query('SELECT name, email FROM admins WHERE id = ?', [id]);
        if (!currentAdmin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        // Update admin
        await database_1.default.query(`
      UPDATE admins 
      SET name = ?, role = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, role, is_active, id]);
        // Log the action
        await database_1.default.query(`
      INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id, description, created_at)
      VALUES (?, 'update', 'admin', ?, ?, NOW())
    `, [adminId, id, `Updated admin: ${currentAdmin.name} - Role: ${role}, Active: ${is_active}`]);
        console.log(`Admin ${adminId} updated admin ${id}`);
        return res.json({ message: 'Admin updated successfully' });
    }
    catch (error) {
        console.error('Error updating admin:', error);
        return res.status(500).json({ error: 'Failed to update admin' });
    }
});
// Delete admin
router.delete('/admin/permissions/admins/:id', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin.id;
        if (parseInt(id) === adminId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        // Get admin info for logging
        const [adminToDelete] = await database_1.default.query('SELECT name, email FROM admins WHERE id = ?', [id]);
        if (!adminToDelete) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        // Soft delete admin
        await database_1.default.query('UPDATE admins SET is_active = FALSE, deleted_at = NOW() WHERE id = ?', [id]);
        // Log the action
        await database_1.default.query(`
      INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id, description, created_at)
      VALUES (?, 'delete', 'admin', ?, ?, NOW())
    `, [adminId, id, `Deleted admin: ${adminToDelete.name} (${adminToDelete.email})`]);
        console.log(`Admin ${adminId} deleted admin ${id}`);
        return res.json({ message: 'Admin deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting admin:', error);
        return res.status(500).json({ error: 'Failed to delete admin' });
    }
});
// Get admin activity log
router.get('/admin/permissions/activity-log', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 50, admin_id, action_type, target_type } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let whereConditions = [];
        let params = [];
        if (admin_id) {
            whereConditions.push('admin_id = ?');
            params.push(admin_id);
        }
        if (action_type) {
            whereConditions.push('action_type = ?');
            params.push(action_type);
        }
        if (target_type) {
            whereConditions.push('target_type = ?');
            params.push(target_type);
        }
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const activities = await database_1.default.query(`
      SELECT 
        aal.*,
        a.name as admin_name,
        a.email as admin_email
      FROM admin_activity_log aal
      LEFT JOIN admins a ON aal.admin_id = a.id
      ${whereClause}
      ORDER BY aal.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
        // Get total count for pagination
        const [countResult] = await database_1.default.query(`
      SELECT COUNT(*) as total
      FROM admin_activity_log aal
      ${whereClause}
    `, params);
        return res.json({
            activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching activity log:', error);
        return res.status(500).json({ error: 'Failed to fetch activity log' });
    }
});
// Get admin permissions overview
router.get('/admin/permissions/overview', auth_1.adminAuthMiddleware, async (_req, res) => {
    try {
        const [stats] = await database_1.default.query(`
      SELECT 
        COUNT(*) as total_admins,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_admins,
        SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as regular_admins
      FROM admins
    `);
        const [recentActivity] = await database_1.default.query(`
      SELECT COUNT(*) as recent_activities
      FROM admin_activity_log 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
        return res.json({
            stats: {
                ...stats,
                recent_activities: recentActivity.recent_activities
            }
        });
    }
    catch (error) {
        console.error('Error fetching permissions overview:', error);
        return res.status(500).json({ error: 'Failed to fetch permissions overview' });
    }
});
exports.default = router;
//# sourceMappingURL=adminPermissions.js.map