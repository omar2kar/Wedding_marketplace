/**
 * ═══════════════════════════════════════════════════════════════
 * Review Report Routes - مسارات تقارير التقييمات
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};

/**
 * إنشاء تقرير جديد للتقييم
 * POST /api/review-reports
 */
router.post('/', async (req, res) => {
    let connection;
    try {
        const { 
            review_id, 
            reported_by_id, 
            reported_by_type = 'client',
            reason, 
            category, 
            description 
        } = req.body;
        
        if (!review_id || !reported_by_id || !reason || !category) {
            return res.status(400).json({
                success: false,
                error: 'review_id, reported_by_id, reason, and category are required'
            });
        }
        
        connection = await mysql.createConnection(dbConfig);
        
        // التحقق من وجود التقييم
        const [reviews] = await connection.execute(
            'SELECT id FROM reviews WHERE id = ?',
            [review_id]
        );
        
        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }
        
        // إنشاء التقرير
        const [result] = await connection.execute(
            `INSERT INTO review_reports 
             (review_id, reported_by_id, reported_by_type, reason, category, description, status, priority, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', 'medium', NOW())`,
            [review_id, reported_by_id, reported_by_type, reason, category, description]
        );
        
        res.json({
            success: true,
            message: 'Report submitted successfully',
            report_id: result.insertId
        });
        
    } catch (error) {
        console.error('Error creating review report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create report',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * الحصول على جميع التقارير (Admin)
 * GET /api/review-reports
 */
router.get('/', async (req, res) => {
    let connection;
    try {
        const { status, priority, category, limit = 50, offset = 0 } = req.query;
        
        connection = await mysql.createConnection(dbConfig);
        
        let query = 'SELECT * FROM review_reports_detailed WHERE 1=1';
        const params = [];
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        if (priority) {
            query += ' AND priority = ?';
            params.push(priority);
        }
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [reports] = await connection.execute(query, params);
        
        // الحصول على العدد الإجمالي
        const [countResult] = await connection.execute(
            'SELECT COUNT(*) as total FROM review_reports WHERE 1=1' +
            (status ? ' AND status = ?' : '') +
            (priority ? ' AND priority = ?' : '') +
            (category ? ' AND category = ?' : ''),
            params.slice(0, -2)
        );
        
        res.json({
            success: true,
            count: reports.length,
            total: countResult[0].total,
            reports
        });
        
    } catch (error) {
        console.error('Error fetching review reports:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * الحصول على تقرير واحد
 * GET /api/review-reports/:id
 */
router.get('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        
        connection = await mysql.createConnection(dbConfig);
        
        const [reports] = await connection.execute(
            'SELECT * FROM review_reports_detailed WHERE id = ?',
            [id]
        );
        
        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }
        
        // الحصول على سجل الإجراءات
        const [actions] = await connection.execute(
            `SELECT rra.*, a.name as admin_name
             FROM review_report_actions rra
             LEFT JOIN admins a ON rra.admin_id = a.id
             WHERE rra.report_id = ?
             ORDER BY rra.created_at DESC`,
            [id]
        );
        
        res.json({
            success: true,
            report: reports[0],
            actions
        });
        
    } catch (error) {
        console.error('Error fetching review report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch report',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * تحديث حالة التقرير (Admin)
 * PUT /api/review-reports/:id/status
 */
router.put('/:id/status', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { status, admin_id, notes } = req.body;
        
        if (!status || !admin_id) {
            return res.status(400).json({
                success: false,
                error: 'status and admin_id are required'
            });
        }
        
        connection = await mysql.createConnection(dbConfig);
        
        // الحصول على الحالة القديمة
        const [oldReport] = await connection.execute(
            'SELECT status FROM review_reports WHERE id = ?',
            [id]
        );
        
        if (oldReport.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }
        
        // تحديث الحالة
        await connection.execute(
            'UPDATE review_reports SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );
        
        // تسجيل الإجراء
        await connection.execute(
            `INSERT INTO review_report_actions 
             (report_id, admin_id, action_type, previous_value, new_value, notes, created_at)
             VALUES (?, ?, 'status_change', ?, ?, ?, NOW())`,
            [id, admin_id, oldReport[0].status, status, notes || '']
        );
        
        res.json({
            success: true,
            message: 'Report status updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update report status',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * تحديث أولوية التقرير (Admin)
 * PUT /api/review-reports/:id/priority
 */
router.put('/:id/priority', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { priority, admin_id, notes } = req.body;
        
        if (!priority || !admin_id) {
            return res.status(400).json({
                success: false,
                error: 'priority and admin_id are required'
            });
        }
        
        connection = await mysql.createConnection(dbConfig);
        
        // الحصول على الأولوية القديمة
        const [oldReport] = await connection.execute(
            'SELECT priority FROM review_reports WHERE id = ?',
            [id]
        );
        
        if (oldReport.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }
        
        // تحديث الأولوية
        await connection.execute(
            'UPDATE review_reports SET priority = ?, updated_at = NOW() WHERE id = ?',
            [priority, id]
        );
        
        // تسجيل الإجراء
        await connection.execute(
            `INSERT INTO review_report_actions 
             (report_id, admin_id, action_type, previous_value, new_value, notes, created_at)
             VALUES (?, ?, 'priority_change', ?, ?, ?, NOW())`,
            [id, admin_id, oldReport[0].priority, priority, notes || '']
        );
        
        res.json({
            success: true,
            message: 'Report priority updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating report priority:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update report priority',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * معالجة التقرير (Admin)
 * POST /api/review-reports/:id/process
 */
router.post('/:id/process', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { admin_id, action, admin_notes } = req.body;
        
        if (!admin_id || !action || !admin_notes) {
            return res.status(400).json({
                success: false,
                error: 'admin_id, action, and admin_notes are required'
            });
        }
        
        connection = await mysql.createConnection(dbConfig);
        
        // استخدام stored procedure
        await connection.execute(
            'CALL process_review_report(?, ?, ?, ?, @status)',
            [id, admin_id, action, admin_notes]
        );
        
        res.json({
            success: true,
            message: 'Report processed successfully'
        });
        
    } catch (error) {
        console.error('Error processing report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process report',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * إحصائيات التقارير (Admin)
 * GET /api/review-reports/stats
 */
router.get('/admin/stats', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // إحصائيات عامة
        const [statusStats] = await connection.execute(`
            SELECT 
                status,
                COUNT(*) as count,
                AVG(DATEDIFF(IFNULL(resolved_at, NOW()), created_at)) as avg_days
            FROM review_reports
            GROUP BY status
        `);
        
        const [priorityStats] = await connection.execute(`
            SELECT priority, COUNT(*) as count
            FROM review_reports
            WHERE status IN ('pending', 'investigating')
            GROUP BY priority
        `);
        
        const [categoryStats] = await connection.execute(`
            SELECT category, COUNT(*) as count
            FROM review_reports
            GROUP BY category
            ORDER BY count DESC
        `);
        
        const [recentReports] = await connection.execute(`
            SELECT COUNT(*) as count
            FROM review_reports
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);
        
        res.json({
            success: true,
            stats: {
                by_status: statusStats,
                by_priority: priorityStats,
                by_category: categoryStats,
                recent_7_days: recentReports[0].count
            }
        });
        
    } catch (error) {
        console.error('Error fetching report stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;
