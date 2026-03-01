"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../database"));
const router = express_1.default.Router();
// Input validation middleware for review actions
const validateReviewAction = (req, res, next) => {
    const { notes } = req.body;
    if (notes !== undefined && (typeof notes !== 'string' || notes.trim().length > 500)) {
        res.status(400).json({ error: 'Notes must be a string with maximum 500 characters' });
        return;
    }
    next();
};
// Get all reviews with filtering
router.get('/admin/reviews', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const { search, status, rating, vendor_id, reported_only } = req.query;
        let whereConditions = [];
        let queryParams = [];
        if (search) {
            whereConditions.push('(r.comment LIKE ? OR c.name LIKE ? OR v.business_name LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (status) {
            whereConditions.push('r.status = ?');
            queryParams.push(status);
        }
        if (rating) {
            whereConditions.push('r.rating = ?');
            queryParams.push(rating);
        }
        if (vendor_id) {
            whereConditions.push('r.vendor_id = ?');
            queryParams.push(vendor_id);
        }
        if (reported_only === 'true') {
            whereConditions.push('r.is_reported = TRUE');
        }
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const reviews = await database_1.default.query(`
      SELECT 
        r.*,
        c.name as client_name,
        c.email as client_email,
        v.name as vendor_name,
        v.business_name,
        s.title as service_title,
        (SELECT COUNT(*) FROM review_reports WHERE review_id = r.id) as report_count
      FROM reviews r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      LEFT JOIN services s ON r.service_id = s.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `, queryParams);
        res.json({ reviews });
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
// Get review details with reports
router.get('/admin/reviews/:id', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const [review] = await database_1.default.query(`
      SELECT 
        r.*,
        c.name as client_name,
        c.email as client_email,
        v.name as vendor_name,
        v.business_name,
        s.title as service_title
      FROM reviews r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.id = ?
    `, [id]);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        // Get reports for this review
        const reports = await database_1.default.query(`
      SELECT 
        rr.*,
        c.name as reporter_name,
        c.email as reporter_email
      FROM review_reports rr
      LEFT JOIN clients c ON rr.reported_by = c.id
      WHERE rr.review_id = ?
      ORDER BY rr.created_at DESC
    `, [id]);
        res.json({
            review,
            reports
        });
    }
    catch (error) {
        console.error('Error fetching review details:', error);
        return res.status(500).json({ error: 'Failed to fetch review details' });
    }
});
// Hide/remove review
router.post('/admin/reviews/:id/hide', auth_1.adminAuthMiddleware, validateReviewAction, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const adminId = req.admin.id;
        const [review] = await database_1.default.query('SELECT * FROM reviews WHERE id = ?', [id]);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        await database_1.default.query('UPDATE reviews SET status = ?, admin_notes = ?, moderated_by = ?, moderated_at = NOW() WHERE id = ?', ['hidden', notes || null, adminId, id]);
        console.log(`Admin ${adminId} hid review ${id}`);
        res.json({ message: 'Review hidden successfully' });
    }
    catch (error) {
        console.error('Error hiding review:', error);
        return res.status(500).json({ error: 'Failed to hide review' });
    }
});
// Approve review (make visible again)
router.post('/admin/reviews/:id/approve', auth_1.adminAuthMiddleware, validateReviewAction, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const adminId = req.admin.id;
        const [review] = await database_1.default.query('SELECT * FROM reviews WHERE id = ?', [id]);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        await database_1.default.query('UPDATE reviews SET status = ?, admin_notes = ?, moderated_by = ?, moderated_at = NOW() WHERE id = ?', ['approved', notes || null, adminId, id]);
        console.log(`Admin ${adminId} approved review ${id}`);
        res.json({ message: 'Review approved successfully' });
    }
    catch (error) {
        console.error('Error approving review:', error);
        return res.status(500).json({ error: 'Failed to approve review' });
    }
});
// Delete review permanently
router.delete('/admin/reviews/:id', auth_1.adminAuthMiddleware, validateReviewAction, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const adminId = req.admin.id;
        const [review] = await database_1.default.query('SELECT * FROM reviews WHERE id = ?', [id]);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        // Delete review reports first
        await database_1.default.query('DELETE FROM review_reports WHERE review_id = ?', [id]);
        // Delete the review
        await database_1.default.query('DELETE FROM reviews WHERE id = ?', [id]);
        console.log(`Admin ${adminId} deleted review ${id}: ${notes || 'No reason provided'}`);
        res.json({ message: 'Review deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({ error: 'Failed to delete review' });
    }
});
// Resolve review reports
router.post('/admin/reviews/:id/resolve-reports', auth_1.adminAuthMiddleware, validateReviewAction, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes, action } = req.body; // action: 'dismiss' or 'hide_review'
        const adminId = req.admin.id;
        const [review] = await database_1.default.query('SELECT * FROM reviews WHERE id = ?', [id]);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        if (action === 'hide_review') {
            // Hide the review
            await database_1.default.query('UPDATE reviews SET status = ?, admin_notes = ?, moderated_by = ?, moderated_at = NOW() WHERE id = ?', ['hidden', notes || null, adminId, id]);
        }
        // Mark all reports as resolved
        await database_1.default.query('UPDATE review_reports SET status = ?, resolved_by = ?, resolved_at = NOW(), admin_notes = ? WHERE review_id = ?', ['resolved', adminId, notes || null, id]);
        // Mark review as not reported
        await database_1.default.query('UPDATE reviews SET is_reported = FALSE WHERE id = ?', [id]);
        console.log(`Admin ${adminId} resolved reports for review ${id} with action: ${action}`);
        res.json({ message: 'Review reports resolved successfully' });
    }
    catch (error) {
        console.error('Error resolving review reports:', error);
        return res.status(500).json({ error: 'Failed to resolve review reports' });
    }
});
// Get review statistics
router.get('/admin/reviews/stats', auth_1.adminAuthMiddleware, async (_req, res) => {
    try {
        const [stats] = await database_1.default.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reviews,
        COUNT(CASE WHEN status = 'hidden' THEN 1 END) as hidden_reviews,
        COUNT(CASE WHEN is_reported = TRUE THEN 1 END) as reported_reviews,
        COALESCE(AVG(rating), 0) as average_rating
      FROM reviews
    `);
        const ratingDistribution = await database_1.default.query(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM reviews 
      WHERE status = 'approved'
      GROUP BY rating
      ORDER BY rating DESC
    `);
        res.json({
            stats,
            ratingDistribution
        });
    }
    catch (error) {
        console.error('Error fetching review stats:', error);
        return res.status(500).json({ error: 'Failed to fetch review statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=adminReviews.js.map