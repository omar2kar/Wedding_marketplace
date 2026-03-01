/**
 * ═══════════════════════════════════════════════════════════════
 * Email Service - خدمة البريد الإلكتروني
 * ═══════════════════════════════════════════════════════════════
 * وظائف إرسال البريد الإلكتروني وإدارة القوالب
 */

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};

/**
 * الحصول على قالب بريد إلكتروني
 */
async function getEmailTemplate(templateType) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const [templates] = await connection.execute(
            'SELECT * FROM email_templates WHERE template_type = ? AND is_active = TRUE',
            [templateType]
        );
        
        if (templates.length === 0) {
            throw new Error(`Template not found: ${templateType}`);
        }
        
        return templates[0];
    } catch (error) {
        console.error('Error fetching email template:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * استبدال المتغيرات في قالب البريد الإلكتروني
 */
function replaceTemplateVariables(template, variables) {
    let subject = template.subject;
    let body = template.body;
    
    // استبدال المتغيرات في الموضوع
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
    }
    
    return { subject, body };
}

/**
 * إرسال بريد إلكتروني (مع تسجيل فقط في الوقت الحالي)
 */
async function sendEmail(recipient, subject, body, templateType = null) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        console.log('═══════════════════════════════════════════════');
        console.log('📧 Email to send:');
        console.log('To:', recipient);
        console.log('Subject:', subject);
        console.log('Template:', templateType || 'custom');
        console.log('═══════════════════════════════════════════════');
        
        // تسجيل البريد في قاعدة البيانات
        await connection.execute(
            `INSERT INTO email_log (recipient, subject, body, status, sent_at) 
             VALUES (?, ?, ?, 'logged', NOW())`,
            [recipient, subject, body]
        );
        
        // في بيئة الإنتاج، يتم إرسال البريد الفعلي هنا
        // يمكن استخدام nodemailer أو أي خدمة SMTP
        
        return { success: true, message: 'Email logged successfully' };
        
    } catch (error) {
        console.error('Error logging email:', error);
        
        // تسجيل الخطأ
        try {
            await connection.execute(
                `INSERT INTO email_log (recipient, subject, body, status, error_message, sent_at) 
                 VALUES (?, ?, ?, 'failed', ?, NOW())`,
                [recipient, subject, body, error.message]
            );
        } catch (logError) {
            console.error('Error logging failed email:', logError);
        }
        
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * إرسال بريد باستخدام قالب
 */
async function sendTemplatedEmail(recipient, templateType, variables) {
    try {
        // الحصول على القالب
        const template = await getEmailTemplate(templateType);
        
        // استبدال المتغيرات
        const { subject, body } = replaceTemplateVariables(template, variables);
        
        // إرسال البريد
        return await sendEmail(recipient, subject, body, templateType);
        
    } catch (error) {
        console.error('Error sending templated email:', error);
        throw error;
    }
}

/**
 * إرسال بريد موافقة المورد
 */
async function sendVendorApprovalEmail(vendorEmail, vendorName, businessName) {
    return await sendTemplatedEmail(vendorEmail, 'vendor_approval', {
        vendor_name: vendorName,
        business_name: businessName,
        login_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/login`
    });
}

/**
 * إرسال بريد رفض المورد
 */
async function sendVendorRejectionEmail(vendorEmail, vendorName, reason) {
    return await sendTemplatedEmail(vendorEmail, 'vendor_rejection', {
        vendor_name: vendorName,
        reason: reason || 'لم يتم تحديد السبب'
    });
}

/**
 * إرسال بريد موافقة الخدمة
 */
async function sendServiceApprovalEmail(vendorEmail, vendorName, serviceName) {
    return await sendTemplatedEmail(vendorEmail, 'service_approval', {
        vendor_name: vendorName,
        service_name: serviceName
    });
}

/**
 * إرسال بريد رفض الخدمة
 */
async function sendServiceRejectionEmail(vendorEmail, vendorName, serviceName, reason) {
    return await sendTemplatedEmail(vendorEmail, 'service_rejection', {
        vendor_name: vendorName,
        service_name: serviceName,
        reason: reason || 'لم يتم تحديد السبب'
    });
}

/**
 * إرسال بريد تأكيد الحجز للعميل
 */
async function sendBookingConfirmationEmail(clientEmail, clientName, bookingDetails) {
    const subject = 'تأكيد حجز خدمة - Wedding Marketplace';
    const body = `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2>مرحباً ${clientName}،</h2>
            <p>تم تأكيد حجزك بنجاح!</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>تفاصيل الحجز:</h3>
                <p><strong>رقم الحجز:</strong> ${bookingDetails.booking_number}</p>
                <p><strong>الخدمة:</strong> ${bookingDetails.service_name}</p>
                <p><strong>المورد:</strong> ${bookingDetails.vendor_name}</p>
                <p><strong>تاريخ الحدث:</strong> ${bookingDetails.event_date}</p>
                <p><strong>المبلغ الإجمالي:</strong> ${bookingDetails.total_amount} ريال</p>
            </div>
            <p>يمكنك متابعة حجزك من خلال لوحة التحكم الخاصة بك.</p>
            <p>شكراً لاستخدامك خدماتنا!</p>
        </div>
    `;
    
    return await sendEmail(clientEmail, subject, body, 'booking_confirmation');
}

/**
 * إرسال بريد إشعار حجز جديد للمورد
 */
async function sendNewBookingNotificationEmail(vendorEmail, vendorName, bookingDetails) {
    const subject = 'حجز جديد - Wedding Marketplace';
    const body = `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2>مرحباً ${vendorName}،</h2>
            <p>لديك حجز جديد!</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>تفاصيل الحجز:</h3>
                <p><strong>رقم الحجز:</strong> ${bookingDetails.booking_number}</p>
                <p><strong>العميل:</strong> ${bookingDetails.client_name}</p>
                <p><strong>الخدمة:</strong> ${bookingDetails.service_name}</p>
                <p><strong>تاريخ الحدث:</strong> ${bookingDetails.event_date}</p>
                <p><strong>المبلغ:</strong> ${bookingDetails.total_amount} ريال</p>
            </div>
            <p>يرجى مراجعة الحجز والرد على العميل في أقرب وقت.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/bookings" 
               style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
                عرض الحجز
            </a>
        </div>
    `;
    
    return await sendEmail(vendorEmail, subject, body, 'new_booking');
}

/**
 * إرسال بريد تذكير للعميل
 */
async function sendEventReminderEmail(clientEmail, clientName, bookingDetails, daysUntilEvent) {
    const subject = `تذكير بالحدث - ${daysUntilEvent} أيام متبقية`;
    const body = `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2>مرحباً ${clientName}،</h2>
            <p>هذا تذكير بأن حدثك قادم قريباً!</p>
            <div style="background: #fffbeb; border-right: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p><strong>تبقى ${daysUntilEvent} أيام على موعد الحدث</strong></p>
                <p><strong>التاريخ:</strong> ${bookingDetails.event_date}</p>
                <p><strong>الخدمة:</strong> ${bookingDetails.service_name}</p>
                <p><strong>المورد:</strong> ${bookingDetails.vendor_name}</p>
            </div>
            <p>نتمنى لك حدثاً سعيداً وناجحاً!</p>
        </div>
    `;
    
    return await sendEmail(clientEmail, subject, body, 'event_reminder');
}

/**
 * الحصول على سجل البريد الإلكتروني
 */
async function getEmailLog(filters = {}) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        let query = 'SELECT * FROM email_log WHERE 1=1';
        const params = [];
        
        if (filters.recipient) {
            query += ' AND recipient = ?';
            params.push(filters.recipient);
        }
        
        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        
        if (filters.startDate) {
            query += ' AND sent_at >= ?';
            params.push(filters.startDate);
        }
        
        if (filters.endDate) {
            query += ' AND sent_at <= ?';
            params.push(filters.endDate);
        }
        
        query += ' ORDER BY sent_at DESC LIMIT ?';
        params.push(filters.limit || 100);
        
        const [logs] = await connection.execute(query, params);
        return logs;
        
    } catch (error) {
        console.error('Error fetching email log:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

module.exports = {
    sendEmail,
    sendTemplatedEmail,
    sendVendorApprovalEmail,
    sendVendorRejectionEmail,
    sendServiceApprovalEmail,
    sendServiceRejectionEmail,
    sendBookingConfirmationEmail,
    sendNewBookingNotificationEmail,
    sendEventReminderEmail,
    getEmailTemplate,
    getEmailLog
};
