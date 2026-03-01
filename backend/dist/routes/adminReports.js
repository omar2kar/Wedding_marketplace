"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../database"));
const router = express_1.default.Router();
// Get comprehensive reports and analytics
router.get('/admin/reports', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // Set default date range if not provided
        const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];
        // Get total revenue and bookings
        const [revenueStats] = await database_1.default.query(`
      SELECT 
        COUNT(*) as totalBookings,
        COALESCE(SUM(total_amount), 0) as totalRevenue,
        COALESCE(AVG(total_amount), 0) as averageBookingValue
      FROM bookings 
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND status NOT IN ('cancelled', 'refunded')
    `, [start, end]);
        // Get top vendors by performance
        const topVendors = await database_1.default.query(`
      SELECT 
        v.id, v.name, v.business_name,
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM vendors v
      LEFT JOIN bookings b ON v.id = b.vendor_id 
        AND DATE(b.created_at) BETWEEN ? AND ?
        AND b.status NOT IN ('cancelled', 'refunded')
      WHERE v.status = 'approved'
      GROUP BY v.id
      ORDER BY total_revenue DESC, total_bookings DESC
      LIMIT 10
    `, [start, end]);
        // Get top clients by spending
        const topClients = await database_1.default.query(`
      SELECT 
        c.id, c.name, c.email,
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_spent
      FROM clients c
      LEFT JOIN bookings b ON c.id = b.client_id 
        AND DATE(b.created_at) BETWEEN ? AND ?
        AND b.status NOT IN ('cancelled', 'refunded')
      GROUP BY c.id
      HAVING total_bookings > 0
      ORDER BY total_spent DESC, total_bookings DESC
      LIMIT 10
    `, [start, end]);
        // Get monthly statistics
        const monthlyStats = await database_1.default.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as bookings,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM bookings 
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `, [start, end]);
        // Get category performance (assuming services table has category)
        const categoryStats = await database_1.default.query(`
      SELECT 
        COALESCE(s.category, v.category, 'Other') as category,
        COUNT(b.id) as bookings,
        COALESCE(SUM(b.total_amount), 0) as revenue
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN vendors v ON b.vendor_id = v.id
      WHERE DATE(b.created_at) BETWEEN ? AND ?
        AND b.status NOT IN ('cancelled', 'refunded')
      GROUP BY COALESCE(s.category, v.category, 'Other')
      ORDER BY revenue DESC
    `, [start, end]);
        res.json({
            totalRevenue: revenueStats.totalRevenue || 0,
            totalBookings: revenueStats.totalBookings || 0,
            averageBookingValue: revenueStats.averageBookingValue || 0,
            topVendors: topVendors.map((vendor) => ({
                ...vendor,
                total_revenue: vendor.total_revenue || 0,
                total_bookings: vendor.total_bookings || 0
            })),
            topClients: topClients.map((client) => ({
                ...client,
                total_spent: client.total_spent || 0,
                total_bookings: client.total_bookings || 0
            })),
            monthlyStats: monthlyStats.map((stat) => ({
                month: stat.month,
                bookings: stat.bookings || 0,
                revenue: stat.revenue || 0
            })),
            categoryStats: categoryStats.map((cat) => ({
                category: cat.category || 'Other',
                bookings: cat.bookings || 0,
                revenue: cat.revenue || 0
            }))
        });
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});
// Get vendor performance details
router.get('/admin/reports/vendor/:id', auth_1.adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];
        // Get vendor basic info
        const [vendor] = await database_1.default.query('SELECT * FROM vendors WHERE id = ?', [id]);
        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        // Get vendor performance stats
        const [stats] = await database_1.default.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_booking_value,
        COUNT(DISTINCT client_id) as unique_clients
      FROM bookings 
      WHERE vendor_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
        AND status NOT IN ('cancelled', 'refunded')
    `, [id, start, end]);
        // Get monthly performance
        const monthlyPerformance = await database_1.default.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as bookings,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM bookings 
      WHERE vendor_id = ?
        AND DATE(created_at) BETWEEN ? AND ?
        AND status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `, [id, start, end]);
        // Get reviews summary
        const [reviewStats] = await database_1.default.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as average_rating
      FROM reviews 
      WHERE vendor_id = ?
        AND DATE(created_at) BETWEEN ? AND ?
    `, [id, start, end]);
        res.json({
            vendor: {
                ...vendor,
                stats: {
                    ...stats,
                    total_revenue: stats.total_revenue || 0,
                    total_bookings: stats.total_bookings || 0,
                    average_booking_value: stats.average_booking_value || 0,
                    unique_clients: stats.unique_clients || 0
                },
                reviews: {
                    total_reviews: reviewStats.total_reviews || 0,
                    average_rating: parseFloat(reviewStats.average_rating || 0).toFixed(1)
                }
            },
            monthlyPerformance: monthlyPerformance.map((month) => ({
                month: month.month,
                bookings: month.bookings || 0,
                revenue: month.revenue || 0
            }))
        });
    }
    catch (error) {
        console.error('Error fetching vendor performance:', error);
        return res.status(500).json({ error: 'Failed to fetch vendor performance' });
    }
});
// Get system overview stats
router.get('/admin/reports/overview', auth_1.adminAuthMiddleware, async (_req, res) => {
    try {
        const [totalStats, recentActivity, statusBreakdown] = await Promise.all([
            // Overall platform stats
            database_1.default.query(`
        SELECT 
          (SELECT COUNT(*) FROM vendors WHERE status = 'approved') as active_vendors,
          (SELECT COUNT(*) FROM vendors WHERE status = 'pending') as pending_vendors,
          (SELECT COUNT(*) FROM clients) as total_clients,
          (SELECT COUNT(*) FROM services WHERE is_active = TRUE) as active_services,
          (SELECT COUNT(*) FROM bookings) as total_bookings,
          (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status NOT IN ('cancelled', 'refunded')) as total_revenue
      `),
            // Recent activity (last 30 days)
            database_1.default.query(`
        SELECT 
          (SELECT COUNT(*) FROM vendors WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)) as new_vendors,
          (SELECT COUNT(*) FROM clients WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)) as new_clients,
          (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)) as new_bookings,
          (SELECT COUNT(*) FROM reviews WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)) as new_reviews
      `),
            // Booking status breakdown
            database_1.default.query(`
        SELECT 
          status,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as total_amount
        FROM bookings 
        GROUP BY status
      `)
        ]);
        res.json({
            overview: totalStats[0],
            recent: recentActivity[0],
            bookingStatus: statusBreakdown
        });
    }
    catch (error) {
        console.error('Error fetching overview stats:', error);
        res.status(500).json({ error: 'Failed to fetch overview statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=adminReports.js.map