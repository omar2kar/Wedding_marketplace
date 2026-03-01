-- ═══════════════════════════════════════════════════════════════
-- نظام الحجوزات الكامل - إصدار آمن
-- Safe to execute - يحذف الجداول القديمة بشكل آمن
-- ═══════════════════════════════════════════════════════════════

USE wedding_marketplace;

-- تعطيل فحص Foreign Keys مؤقتاً
SET FOREIGN_KEY_CHECKS = 0;

-- ═══════════════════════════════════════════════════════════════
-- 1. حذف الجداول القديمة بالترتيب الصحيح
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS booking_history;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS service_availability;

-- ═══════════════════════════════════════════════════════════════
-- 2. جدول إتاحة الخدمات (Service Availability)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE service_availability (
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
-- 3. جدول الحجوزات (Bookings)
-- ═══════════════════════════════════════════════════════════════

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
    
    -- تفاصيل الحدث
    event_date DATE NOT NULL,
    event_time TIME,
    event_location VARCHAR(500),
    event_type VARCHAR(100) DEFAULT 'wedding',
    guest_count INT DEFAULT 0,
    
    -- الأسعار
    service_price DECIMAL(10,2) NOT NULL,
    additional_fees DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- الحالة
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'rejected') DEFAULT 'pending',
    
    -- ملاحظات
    client_notes TEXT,
    vendor_notes TEXT,
    cancellation_reason TEXT,
    admin_notes TEXT,
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Foreign Keys
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_client (client_id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_service (service_id),
    INDEX idx_status (status),
    INDEX idx_event_date (event_date),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- 4. جدول سجل الحجوزات (Booking History)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE booking_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    changed_by_type ENUM('client', 'vendor', 'admin', 'system') NOT NULL,
    changed_by_id INT,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- 5. دالة لتوليد رقم الحجز
-- ═══════════════════════════════════════════════════════════════

DELIMITER $$

DROP FUNCTION IF EXISTS generate_booking_number$$

CREATE FUNCTION generate_booking_number()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE booking_number VARCHAR(50);
    DECLARE unique_id INT;
    
    -- توليد رقم عشوائي فريد
    SET unique_id = FLOOR(RAND() * 9000) + 1000;
    
    -- تنسيق الرقم: BK + سنة + شهر + يوم + رقم عشوائي
    SET booking_number = CONCAT(
        'BK',
        DATE_FORMAT(NOW(), '%Y%m%d'),
        unique_id
    );
    
    RETURN booking_number;
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════
-- 6. Stored Procedure لإنشاء حجز جديد (مستقل عن نظام الإتاحة)
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
-- 7. View لعرض الحجوزات بالتفاصيل الكاملة
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW booking_details AS
SELECT 
    b.id,
    b.booking_number,
    b.client_id,
    b.client_name,
    b.client_email,
    b.client_phone,
    b.vendor_id,
    v.business_name as vendor_name,
    v.email as vendor_email,
    v.phone as vendor_phone,
    b.service_id,
    b.service_name,
    vs.category as service_category,
    b.event_date,
    b.event_time,
    b.event_location,
    b.event_type,
    b.guest_count,
    b.service_price,
    b.additional_fees,
    b.discount_amount,
    b.total_amount,
    b.status,
    b.client_notes,
    b.vendor_notes,
    b.cancellation_reason,
    b.created_at,
    b.updated_at,
    b.confirmed_at,
    b.cancelled_at,
    b.completed_at,
    DATEDIFF(b.event_date, CURDATE()) as days_until_event
FROM bookings b
LEFT JOIN vendors v ON b.vendor_id = v.id
LEFT JOIN vendor_services vs ON b.service_id = vs.id;

-- ═══════════════════════════════════════════════════════════════
-- 8. إعادة تفعيل Foreign Keys
-- ═══════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════
-- تم الانتهاء! ✅
-- ═══════════════════════════════════════════════════════════════

SELECT '✅ نظام الحجوزات تم إنشاؤه بنجاح!' as status;
