-- Complete admin panel database schema additions
-- Run this after the main setup-database.sql

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id),
  FOREIGN KEY (updated_by) REFERENCES admins(id)
);

-- Admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action_type ENUM('create', 'update', 'delete', 'approve', 'reject', 'suspend', 'activate') NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INT,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- Email log table
CREATE TABLE IF NOT EXISTS email_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  status ENUM('sent', 'failed', 'logged') DEFAULT 'logged',
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_type VARCHAR(100) UNIQUE NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id),
  FOREIGN KEY (updated_by) REFERENCES admins(id)
);

-- Platform content management table
CREATE TABLE IF NOT EXISTS platform_content (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content_type VARCHAR(50) NOT NULL,
  section VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id),
  FOREIGN KEY (updated_by) REFERENCES admins(id)
);

-- Add commission_rate to service_categories if not exists
ALTER TABLE service_categories 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS updated_by INT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add foreign key for service_categories if not exists
-- ALTER TABLE service_categories ADD FOREIGN KEY (updated_by) REFERENCES admins(id);

-- Insert default system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, description, category) VALUES
('site_name', 'Wedding Marketplace', 'Name of the website', 'general'),
('site_description', 'Find the perfect vendors for your special day', 'Site description for SEO', 'general'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode', 'general'),
('registration_enabled', 'true', 'Allow new vendor registrations', 'vendors'),
('auto_approve_services', 'false', 'Automatically approve new services', 'services'),
('default_commission_rate', '10.00', 'Default commission rate for new categories', 'financial'),
('max_images_per_service', '10', 'Maximum images allowed per service', 'services'),
('review_moderation', 'true', 'Enable review moderation', 'reviews');

-- Insert default email templates
INSERT IGNORE INTO email_templates (template_type, subject, body) VALUES
('vendor_approval', 'Welcome to Wedding Marketplace!', 
'<h2>Congratulations {{vendor_name}}!</h2>
<p>Your vendor application for <strong>{{business_name}}</strong> has been approved.</p>
<p>You can now log in to your vendor dashboard and start managing your services.</p>
<p><a href="{{login_url}}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a></p>
<p>Welcome to our wedding marketplace!</p>'),

('vendor_rejection', 'Update on Your Vendor Application', 
'<h2>Dear {{vendor_name}},</h2>
<p>Thank you for your interest in joining our wedding marketplace.</p>
<p>Unfortunately, we are unable to approve your vendor application at this time.</p>
<p><strong>Reason:</strong> {{reason}}</p>
<p>You are welcome to reapply in the future with updated information.</p>
<p>Best regards,<br>Wedding Marketplace Team</p>'),

('service_approval', 'Your Service is Now Live!', 
'<h2>Great news {{vendor_name}}!</h2>
<p>Your service <strong>{{service_name}}</strong> has been approved and is now live on our platform.</p>
<p>Customers can now discover and book your service.</p>
<p>Good luck with your bookings!</p>'),

('service_rejection', 'Service Review Update', 
'<h2>Dear {{vendor_name}},</h2>
<p>Your service <strong>{{service_name}}</strong> requires some updates before it can be approved.</p>
<p><strong>Feedback:</strong> {{reason}}</p>
<p>Please update your service and resubmit for review.</p>');

-- Insert default platform content
INSERT IGNORE INTO platform_content (content_type, section, title, content) VALUES
('homepage', 'hero', 'Find Your Perfect Wedding Vendors', 
'Discover amazing vendors for your special day. From photographers to caterers, we have everything you need.'),
('homepage', 'features', 'Why Choose Us', 
'Verified vendors, secure payments, and excellent customer service.'),
('vendor', 'guidelines', 'Vendor Guidelines', 
'Please ensure all services meet our quality standards and provide accurate descriptions.'),
('legal', 'terms', 'Terms of Service', 
'By using our platform, you agree to our terms and conditions.'),
('legal', 'privacy', 'Privacy Policy', 
'We respect your privacy and protect your personal information.');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_email_log_recipient ON email_log(recipient);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_platform_content_type ON platform_content(content_type);

-- Add review_reports table if not exists (for review moderation)
CREATE TABLE IF NOT EXISTS review_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  review_id INT NOT NULL,
  reported_by INT NOT NULL,
  reason VARCHAR(500) NOT NULL,
  description TEXT,
  status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
  resolved_by INT,
  resolved_at TIMESTAMP NULL,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id),
  FOREIGN KEY (reported_by) REFERENCES clients(id),
  FOREIGN KEY (resolved_by) REFERENCES admins(id)
);

-- Update reviews table to support moderation
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'hidden', 'deleted') DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS moderated_by INT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add foreign key for reviews moderation
-- ALTER TABLE reviews ADD FOREIGN KEY (moderated_by) REFERENCES admins(id);

-- Insert sample review reports for testing
INSERT IGNORE INTO review_reports (review_id, reported_by, reason, description) VALUES
(1, 1, 'Inappropriate content', 'This review contains offensive language'),
(2, 2, 'Fake review', 'This appears to be a fake review');

-- Update commission rates for existing categories
UPDATE service_categories SET commission_rate = 12.0 WHERE category = 'Photography';
UPDATE service_categories SET commission_rate = 8.0 WHERE category = 'Catering';
UPDATE service_categories SET commission_rate = 15.0 WHERE category = 'Venues';
UPDATE service_categories SET commission_rate = 10.0 WHERE category = 'Music';
UPDATE service_categories SET commission_rate = 10.0 WHERE category = 'Flowers';

-- Grant admin permissions (if needed)
-- UPDATE admins SET role = 'super_admin' WHERE email = 'admin@example.com';

COMMIT;
