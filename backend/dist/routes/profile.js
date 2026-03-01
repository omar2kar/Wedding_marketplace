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
// Input validation for profile updates
const validateProfileInput = (req, res, next) => {
    const { name, email, phone } = req.body;
    if (email && (!email.includes('@') || email.length < 5)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
    }
    if (name && name.length < 2) {
        res.status(400).json({ error: 'Name must be at least 2 characters' });
        return;
    }
    if (phone && phone.length > 20) {
        res.status(400).json({ error: 'Phone number too long' });
        return;
    }
    next();
    return;
};
// Get Client Profile
router.get('/client/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const clients = await database_1.default.query('SELECT id, name, email, phone, role, avatar_url, is_verified, created_at, last_login_at FROM clients WHERE id = ?', [userId]);
        if (clients.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const client = clients[0];
        return res.json({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            role: client.role,
            avatar_url: client.avatar_url,
            is_verified: client.is_verified,
            created_at: client.created_at,
            last_login_at: client.last_login_at
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Update Client Profile
router.put('/client/profile', auth_1.authMiddleware, validateProfileInput, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, phone, avatar_url } = req.body;
        // Check if email is already taken by another user
        if (email) {
            const existingUsers = await database_1.default.query('SELECT id FROM clients WHERE email = ? AND id != ?', [email, userId]);
            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }
        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        if (avatar_url !== undefined) {
            updateFields.push('avatar_url = ?');
            updateValues.push(avatar_url);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updateFields.push('updated_at = NOW()');
        updateValues.push(userId);
        await database_1.default.query(`UPDATE clients SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        // Return updated profile
        const updatedClients = await database_1.default.query('SELECT id, name, email, phone, role, avatar_url, is_verified, created_at, last_login_at FROM clients WHERE id = ?', [userId]);
        return res.json({
            message: 'Profile updated successfully',
            user: updatedClients[0]
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});
// Get Vendor Profile
router.get('/vendor/profile', auth_1.vendorAuthMiddleware, async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const vendors = await database_1.default.query('SELECT id, name, email, phone, business_name, category, avatar_url, rating, total_reviews, created_at, last_login_at FROM vendors WHERE id = ?', [vendorId]);
        if (vendors.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        const vendor = vendors[0];
        return res.json({
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            business_name: vendor.business_name,
            category: vendor.category,
            avatar_url: vendor.avatar_url,
            rating: vendor.rating,
            total_reviews: vendor.total_reviews,
            created_at: vendor.created_at,
            last_login_at: vendor.last_login_at
        });
    }
    catch (error) {
        console.error('Get vendor profile error:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Update Vendor Profile
router.put('/vendor/profile', auth_1.vendorAuthMiddleware, validateProfileInput, async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const { name, email, phone, business_name, category, avatar_url } = req.body;
        // Check if email is already taken by another vendor
        if (email) {
            const existingVendors = await database_1.default.query('SELECT id FROM vendors WHERE email = ? AND id != ?', [email, vendorId]);
            if (existingVendors.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }
        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        if (business_name !== undefined) {
            updateFields.push('business_name = ?');
            updateValues.push(business_name);
        }
        if (category) {
            updateFields.push('category = ?');
            updateValues.push(category);
        }
        if (avatar_url !== undefined) {
            updateFields.push('avatar_url = ?');
            updateValues.push(avatar_url);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updateFields.push('updated_at = NOW()');
        updateValues.push(vendorId);
        await database_1.default.query(`UPDATE vendors SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        // Return updated profile
        const updatedVendors = await database_1.default.query('SELECT id, name, email, phone, business_name, category, avatar_url, rating, total_reviews, created_at, last_login_at FROM vendors WHERE id = ?', [vendorId]);
        return res.json({
            message: 'Profile updated successfully',
            vendor: updatedVendors[0]
        });
    }
    catch (error) {
        console.error('Update vendor profile error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});
// Get Admin Profile
router.get('/admin/profile', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const adminId = req.admin.id;
        const admins = await database_1.default.query('SELECT id, name, email, role, avatar_url, is_active, created_at, last_login_at FROM admins WHERE id = ?', [adminId]);
        if (admins.length === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        const admin = admins[0];
        return res.json({
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            avatar_url: admin.avatar_url,
            is_active: admin.is_active,
            created_at: admin.created_at,
            last_login_at: admin.last_login_at
        });
    }
    catch (error) {
        console.error('Get admin profile error:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Update Admin Profile
router.put('/admin/profile', auth_1.adminAuthMiddleware, validateProfileInput, async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { name, email, avatar_url } = req.body;
        // Check if email is already taken by another admin
        if (email) {
            const existingAdmins = await database_1.default.query('SELECT id FROM admins WHERE email = ? AND id != ?', [email, adminId]);
            if (existingAdmins.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }
        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (avatar_url !== undefined) {
            updateFields.push('avatar_url = ?');
            updateValues.push(avatar_url);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updateFields.push('updated_at = NOW()');
        updateValues.push(adminId);
        await database_1.default.query(`UPDATE admins SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        // Return updated profile
        const updatedAdmins = await database_1.default.query('SELECT id, name, email, role, avatar_url, is_active, created_at, last_login_at FROM admins WHERE id = ?', [adminId]);
        return res.json({
            message: 'Profile updated successfully',
            admin: updatedAdmins[0]
        });
    }
    catch (error) {
        console.error('Update admin profile error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});
// Change Password (for all user types) - requires authentication middleware
router.put('/client/change-password', auth_1.authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
        // Get current password from database
        const users = await database_1.default.query('SELECT password FROM clients WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify current password
        const validPassword = await bcrypt_1.default.compare(currentPassword, users[0].password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        // Hash new password
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 12);
        // Update password
        await database_1.default.query('UPDATE clients SET password = ?, updated_at = NOW() WHERE id = ?', [hashedNewPassword, userId]);
        return res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ error: 'Failed to change password' });
    }
});
// Change Password for Vendors
router.put('/vendor/change-password', auth_1.vendorAuthMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.vendor.id;
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
        // Get current password from database
        const users = await database_1.default.query('SELECT password FROM vendors WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        // Verify current password
        const validPassword = await bcrypt_1.default.compare(currentPassword, users[0].password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        // Hash new password
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 12);
        // Update password
        await database_1.default.query('UPDATE vendors SET password = ?, updated_at = NOW() WHERE id = ?', [hashedNewPassword, userId]);
        return res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change vendor password error:', error);
        return res.status(500).json({ error: 'Failed to change password' });
    }
});
// Change Password for Admins
router.put('/admin/change-password', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.admin.id;
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
        // Get current password from database
        const admins = await database_1.default.query('SELECT password FROM admins WHERE id = ?', [adminId]);
        if (admins.length === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        // Verify current password
        const validPassword = await bcrypt_1.default.compare(currentPassword, admins[0].password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        // Hash new password
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 12);
        // Update password
        await database_1.default.query('UPDATE admins SET password = ?, updated_at = NOW() WHERE id = ?', [hashedNewPassword, adminId]);
        return res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change admin password error:', error);
        return res.status(500).json({ error: 'Failed to change password' });
    }
});
exports.default = router;
//# sourceMappingURL=profile.js.map