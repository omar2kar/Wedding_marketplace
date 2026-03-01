"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Email service for sending notifications
// Simplified version - logs emails to console and database
const database_1 = __importDefault(require("../database"));
class EmailService {
    constructor() {
        // Simplified email service - logs instead of sending actual emails
        console.log('Email service initialized in logging mode');
    }
    // Get email template from database
    async getTemplate(templateType) {
        try {
            const [template] = await database_1.default.query('SELECT subject, body FROM email_templates WHERE template_type = ? AND is_active = TRUE', [templateType]);
            return template || null;
        }
        catch (error) {
            console.error('Error fetching email template:', error);
            return null;
        }
    }
    // Replace placeholders in template
    replacePlaceholders(template, data) {
        let result = template;
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), data[key] || '');
        });
        return result;
    }
    // Send vendor approval email
    async sendVendorApprovalEmail(vendorEmail, vendorName, businessName) {
        try {
            let template = await this.getTemplate('vendor_approval');
            if (!template) {
                // Fallback template
                template = {
                    subject: 'Your vendor application has been approved!',
                    body: `
            <h2>Congratulations {{vendor_name}}!</h2>
            <p>Your vendor application for <strong>{{business_name}}</strong> has been approved.</p>
            <p>You can now log in to your vendor dashboard and start managing your services.</p>
            <p>Welcome to our wedding marketplace!</p>
          `
                };
            }
            const emailData = {
                vendor_name: vendorName,
                business_name: businessName,
                login_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/login`
            };
            const subject = this.replacePlaceholders(template.subject, emailData);
            const htmlBody = this.replacePlaceholders(template.body, emailData);
            await this.sendEmail({
                to: vendorEmail,
                subject,
                html: htmlBody,
                text: htmlBody.replace(/<[^>]*>/g, '') // Strip HTML for text version
            });
            return true;
        }
        catch (error) {
            console.error('Error sending vendor approval email:', error);
            return false;
        }
    }
    // Send vendor rejection email
    async sendVendorRejectionEmail(vendorEmail, vendorName, reason) {
        try {
            let template = await this.getTemplate('vendor_rejection');
            if (!template) {
                // Fallback template
                template = {
                    subject: 'Update on your vendor application',
                    body: `
            <h2>Dear {{vendor_name}},</h2>
            <p>Thank you for your interest in joining our wedding marketplace.</p>
            <p>Unfortunately, we are unable to approve your vendor application at this time.</p>
            <p><strong>Reason:</strong> {{reason}}</p>
            <p>You are welcome to reapply in the future with updated information.</p>
            <p>Best regards,<br>Wedding Marketplace Team</p>
          `
                };
            }
            const emailData = {
                vendor_name: vendorName,
                reason: reason || 'Please review your application details and try again.'
            };
            const subject = this.replacePlaceholders(template.subject, emailData);
            const htmlBody = this.replacePlaceholders(template.body, emailData);
            await this.sendEmail({
                to: vendorEmail,
                subject,
                html: htmlBody,
                text: htmlBody.replace(/<[^>]*>/g, '')
            });
            return true;
        }
        catch (error) {
            console.error('Error sending vendor rejection email:', error);
            return false;
        }
    }
    // Send service approval notification
    async sendServiceApprovalEmail(vendorEmail, vendorName, serviceName) {
        try {
            let template = await this.getTemplate('service_approval');
            if (!template) {
                template = {
                    subject: 'Your service has been approved!',
                    body: `
            <h2>Great news {{vendor_name}}!</h2>
            <p>Your service <strong>{{service_name}}</strong> has been approved and is now live on our platform.</p>
            <p>Customers can now book your service.</p>
          `
                };
            }
            const emailData = {
                vendor_name: vendorName,
                service_name: serviceName
            };
            const subject = this.replacePlaceholders(template.subject, emailData);
            const htmlBody = this.replacePlaceholders(template.body, emailData);
            await this.sendEmail({
                to: vendorEmail,
                subject,
                html: htmlBody,
                text: htmlBody.replace(/<[^>]*>/g, '')
            });
            return true;
        }
        catch (error) {
            console.error('Error sending service approval email:', error);
            return false;
        }
    }
    // Generic email sender (logging mode)
    async sendEmail(emailData) {
        // Log email instead of sending (for development)
        console.log('📧 Email would be sent:');
        console.log(`To: ${emailData.to}`);
        console.log(`Subject: ${emailData.subject}`);
        console.log(`Body: ${emailData.html}`);
        // Save to database for audit trail
        try {
            await database_1.default.query(`
        INSERT INTO email_log (recipient, subject, body, status, sent_at)
        VALUES (?, ?, ?, 'logged', NOW())
      `, [emailData.to, emailData.subject, emailData.html]);
        }
        catch (error) {
            console.error('Error logging email:', error);
        }
    }
    // Test email connection (always returns true in logging mode)
    async testConnection() {
        console.log('Email service running in logging mode - connection test passed');
        return true;
    }
}
exports.default = new EmailService();
//# sourceMappingURL=emailService.js.map