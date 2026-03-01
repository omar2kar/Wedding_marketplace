-- ═══════════════════════════════════════════════════════════════
-- إصلاح Stored Procedure - إزالة auto_accept_bookings
-- ═══════════════════════════════════════════════════════════════

USE wedding_marketplace;

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
    
    -- التحقق من وجود الخدمة (بدون auto_accept_bookings)
    SELECT vs.vendor_id, vs.name, vs.price
    INTO v_vendor_id, v_service_name, v_service_price
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

SELECT '✅ تم إصلاح Stored Procedure بنجاح!' as status;
