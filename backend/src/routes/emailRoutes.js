/**
 * ═══════════════════════════════════════════════════════════════
 * Email Routes - مسارات البريد الإلكتروني
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};

/**
 * إرسال بريد إلكتروني (Admin only)
 * POST /api/email/send
 */
router.post('/send', async (req, res) => {
    try {
        const { recipient, subject, body, templateType } = req.body;
        
        if (!recipient || !subject || !body) {
            return res.status(400).json({
                success: false,
                error: 'Recipient, subject, and body are required'
            });
        }
        
        const result = await emailService.sendEmail(recipient, subject, body, templateType);
        
        res.json({
            success: true,
            message: 'Email sent successfully',
            result
        });
        
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send email',
            details: error.message
        });
    }
});

/**
 * إرسال بريد باستخدام قالب
 * POST /api/email/send-template
 */
router.post('/send-template', async (req, res) => {
    try {
        const { recipient, templateType, variables } = req.body;
        
        if (!recipient || !templateType || !variables) {
            return res.status(400).json({
                success: false,
                error: 'Recipient, templateType, and variables are required'
            });
        }
        
        const result = await emailService.sendTemplatedEmail(recipient, templateType, variables);
        
        res.json({
            success: true,
            message: 'Template email sent successfully',
            result
        });
        
    } catch (error) {
        console.error('Error sending template email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send template email',
            details: error.message
        });
    }
});

/**
 * الحصول على سجل البريد الإلكتروني
 * GET /api/email/log
 */
router.get('/log', async (req, res) => {
    try {
        const { recipient, status, startDate, endDate, limit } = req.query;
        
        const logs = await emailService.getEmailLog({
            recipient,
            status,
            startDate,
            endDate,
            limit: parseInt(limit) || 100
        });
        
        res.json({
            success: true,
            count: logs.length,
            logs
        });
        
    } catch (error) {
        console.error('Error fetching email log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch email log',
            details: error.message
        });
    }
});

/**
 * الحصول على جميع قوالب البريد
 * GET /api/email/templates
 */
router.get('/templates', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const [templates] = await connection.execute(
            'SELECT * FROM email_templates ORDER BY template_type'
        );
        
        res.json({
            success: true,
            count: templates.length,
            templates
        });
        
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch templates',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * تحديث قالب بريد
 * PUT /api/email/templates/:templateType
 */
router.put('/templates/:templateType', async (req, res) => {
    let connection;
    try {
        const { templateType } = req.params;
        const { subject, body, is_active } = req.body;
        
        connection = await mysql.createConnection(dbConfig);
        
        await connection.execute(
            `UPDATE email_templates 
             SET subject = ?, body = ?, is_active = ?, updated_at = NOW()
             WHERE template_type = ?`,
            [subject, body, is_active, templateType]
        );
        
        res.json({
            success: true,
            message: 'Template updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update template',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * إحصائيات البريد الإلكتروني
 * GET /api/email/stats
 */
router.get('/stats', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // إحصائيات عامة
        const [totalStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_emails,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN status = 'logged' THEN 1 ELSE 0 END) as logged_count
            FROM email_log
        `);
        
        // إحصائيات آخر 30 يوم
        const [recentStats] = await connection.execute(`
            SELECT 
                DATE(sent_at) as date,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM email_log
            WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(sent_at)
            ORDER BY date DESC
        `);
        
        res.json({
            success: true,
            stats: {
                total: totalStats[0],
                recent: recentStats
            }
        });
        
    } catch (error) {
        console.error('Error fetching email stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch email stats',
            details: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;
