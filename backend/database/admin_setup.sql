-- إنشاء جدول الإدمين
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin') DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- إضافة إدمين افتراضي للاختبار
-- كلمة المرور: admin123
INSERT IGNORE INTO admins (name, email, password, role) 
VALUES ('Admin User', 'admin@wedding-marketplace.com', '$2b$10$YE5ZvMSLxCqG0CjY2i3Xze0GKhHCd8H0bJXBKWQXoOvXuFqHZ6nXO', 'super_admin');

SELECT 'Admin table created successfully!' as message;
