-- ═══════════════════════════════════════════════════════════════
-- نظام الحجز المحسّن - Wedding Marketplace
-- ═══════════════════════════════════════════════════════════════

USE wedding_marketplace;

-- ═══════════════════════════════════════════════════════════════
-- 1. جدول إتاحة الخدمات (Service Availability)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS service_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    max_bookings INT DEFAULT 1,
    current_bookings INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_service_date (service_id, date),
    INDEX idx_service_date (service_id, date),
    INDEX idx_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- 2. تحديث جدول الحجوزات (Enhanced Bookings)
-- ═══════════════════════════════════════════════════════════════

-- حذف الجدول القديم إذا كان موجود
DROP TABLE IF EXISTS bookings;

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- معلومات العميل
    client_id INT NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    
    -- معلومات البائع والخدمة
    vendor_id INT NOT NULL,
    service_id INT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    
    -- معلومات الحجز
    event_date DATE NOT NULL,
    event_time TIME,
    event_location VARCHAR(500),
    event_type VARCHAR(100),
    guest_count INT,
    
    -- السعر
    service_price DECIMAL(10, 2) NOT NULL,
    additional_fees DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- الحالة
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'rejected') DEFAULT 'pending',
    
    -- ملاحظات
    client_notes TEXT,
    vendor_notes TEXT,
    cancellation_reason TEXT,
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Foreign Keys
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
    FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_client (client_id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_service (service_id),
    INDEX idx_status (status),
    INDEX idx_event_date (event_date),
    INDEX idx_booking_number (booking_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- 3. جدول سجل تغييرات الحجز (Booking History)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS booking_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    changed_by_type ENUM('client', 'vendor', 'system') NOT NULL,
    changed_by_id INT,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- 4. إضافة حقول جديدة لجدول vendor_services
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE vendor_services 
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requires_availability BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_advance_booking_days INT DEFAULT 365,
ADD COLUMN IF NOT EXISTS min_advance_booking_days INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_accept_bookings BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS booking_instructions TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 5. Trigger لتحديث عدد الحجوزات (معطل مؤقتاً - سيتم إعادة تفعيله مع نظام الإتاحة)
-- ═══════════════════════════════════════════════════════════════

-- ملاحظة: تم تعطيل الـ triggers المرتبطة بنظام الإتاحة
-- لأن نظام الحجز الآن مستقل ولا يعتمد على جدول service_availability
-- سيتم إعادة تفعيلها لاحقاً عند إضافة نظام الإتاحة

/*
DELIMITER $$

DROP TRIGGER IF EXISTS after_booking_insert$$
DROP TRIGGER IF EXISTS after_booking_update$$

CREATE TRIGGER after_booking_insert
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status IN ('pending', 'confirmed') THEN
        UPDATE service_availability 
        SET current_bookings = current_bookings + 1
        WHERE service_id = NEW.service_id 
        AND date = NEW.event_date;
    END IF;
END$$

CREATE TRIGGER after_booking_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status IN ('cancelled', 'rejected') THEN
        UPDATE service_availability 
        SET current_bookings = GREATEST(current_bookings - 1, 0)
        WHERE service_id = NEW.service_id 
        AND date = NEW.event_date;
    END IF;
    
    IF OLD.status IN ('cancelled', 'rejected') AND NEW.status IN ('pending', 'confirmed') THEN
        UPDATE service_availability 
        SET current_bookings = current_bookings + 1
        WHERE service_id = NEW.service_id 
        AND date = NEW.event_date;
    END IF;
END$$

DELIMITER ;
*/

-- ═══════════════════════════════════════════════════════════════
-- 6. بيانات تجريبية للإتاحة
-- ═══════════════════════════════════════════════════════════════

-- إضافة إتاحة للأيام القادمة (30 يوم)
INSERT INTO service_availability (service_id, date, is_available, max_bookings)
SELECT 
    vs.id,
    DATE_ADD(CURDATE(), INTERVAL seq DAY),
    TRUE,
    1
FROM vendor_services vs
CROSS JOIN (
    SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION 
    SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION 
    SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION 
    SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
) AS days
WHERE vs.is_active = TRUE
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════
-- 7. Views مفيدة
-- ═══════════════════════════════════════════════════════════════

-- View للحجوزات مع تفاصيل كاملة
CREATE OR REPLACE VIEW bookings_detailed AS
SELECT 
    b.*,
    c.name AS client_full_name,
    c.email AS client_email_verified,
    v.business_name AS vendor_business_name,
    v.category AS vendor_category,
    vs.name AS service_full_name,
    vs.category AS service_category
FROM bookings b
LEFT JOIN clients c ON b.client_id = c.id
LEFT JOIN vendors v ON b.vendor_id = v.id
LEFT JOIN vendor_services vs ON b.service_id = vs.id;

-- View للإتاحة مع تفاصيل الخدمة
CREATE OR REPLACE VIEW availability_with_service AS
SELECT 
    sa.*,
    vs.name AS service_name,
    vs.price AS service_price,
    v.business_name AS vendor_name
FROM service_availability sa
LEFT JOIN vendor_services vs ON sa.service_id = vs.id
LEFT JOIN vendors v ON vs.vendor_id = v.id;

-- ═══════════════════════════════════════════════════════════════
-- 8. Function لتوليد رقم حجز فريد
-- ═══════════════════════════════════════════════════════════════

DELIMITER $$

CREATE FUNCTION generate_booking_number()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE booking_num VARCHAR(50);
    DECLARE done INT DEFAULT FALSE;
    
    REPEAT
        SET booking_num = CONCAT(
            'BK',
            DATE_FORMAT(NOW(), '%Y%m%d'),
            LPAD(FLOOR(RAND() * 10000), 4, '0')
        );
        
        SELECT COUNT(*) INTO done FROM bookings WHERE booking_number = booking_num;
    UNTIL done = 0 END REPEAT;
    
    RETURN booking_num;
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════
-- 9. Stored Procedure لإنشاء حجز جديد (مستقل عن نظام الإتاحة)
-- ═══════════════════════════════════════════════════════════════

DELIMITER $$

DROP PROCEDURE IF EXISTS create_booking$$

CREATE PROCEDURE create_booking(
    IN p_client_id INT,
    IN p_service_id INT,
    IN p_event_date DATE,
    IN p_event_time TIME,
    IN p_event_location VARCHAR(500),
    IN p_guest_count INT,
    IN p_client_notes TEXT,
    OUT p_booking_id INT,
    OUT p_booking_number VARCHAR(50),
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_vendor_id INT;
    DECLARE v_service_name VARCHAR(255);
    DECLARE v_service_price DECIMAL(10, 2);
    DECLARE v_client_name VARCHAR(255);
    DECLARE v_client_email VARCHAR(255);
    DECLARE v_auto_accept BOOLEAN DEFAULT FALSE;
    
    -- التحقق من وجود الخدمة
    SELECT vs.vendor_id, vs.name, vs.price, COALESCE(vs.auto_accept_bookings, FALSE)
    INTO v_vendor_id, v_service_name, v_service_price, v_auto_accept
    FROM vendor_services vs
    WHERE vs.id = p_service_id AND vs.is_active = TRUE;
    
    IF v_vendor_id IS NULL THEN
        SET p_status = 'error_service_not_found';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Service not found or inactive';
    END IF;
    
    -- التحقق من بيانات العميل
    SELECT name, email INTO v_client_name, v_client_email
    FROM clients WHERE id = p_client_id;
    
    IF v_client_name IS NULL THEN
        SET p_status = 'error_client_not_found';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Client not found';
    END IF;
    
    -- ملاحظة: تم إلغاء التحقق من الإتاحة مؤقتاً
    -- يمكن للعملاء الحجز في أي تاريخ، والبائع يوافق أو يرفض
    
    -- إنشاء الحجز
    SET p_booking_number = generate_booking_number();
    
    INSERT INTO bookings (
        booking_number, client_id, client_name, client_email,
        vendor_id, service_id, service_name, event_date, event_time,
        event_location, guest_count, service_price, total_amount,
        status, client_notes
    ) VALUES (
        p_booking_number, p_client_id, v_client_name, v_client_email,
        v_vendor_id, p_service_id, v_service_name, p_event_date, p_event_time,
        p_event_location, p_guest_count, v_service_price, v_service_price,
        'pending', p_client_notes
    );
    
    SET p_booking_id = LAST_INSERT_ID();
    SET p_status = 'success';
    
    -- تسجيل في السجل
    INSERT INTO booking_history (booking_id, changed_by_type, changed_by_id, new_status, change_description)
    VALUES (p_booking_id, 'client', p_client_id, 'pending', 'Booking created - awaiting vendor approval');
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════
-- تم إنشاء نظام الحجز بنجاح
-- ═══════════════════════════════════════════════════════════════

SELECT 'Booking system setup completed successfully!' AS status;
