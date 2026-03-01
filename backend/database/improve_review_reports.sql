-- ═══════════════════════════════════════════════════════════════
-- تحسين نظام تقارير التقييمات - Wedding Marketplace
-- ═══════════════════════════════════════════════════════════════

USE wedding_marketplace;

-- تعطيل فحص Foreign Keys مؤقتاً للأمان
SET FOREIGN_KEY_CHECKS = 0;

-- ═══════════════════════════════════════════════════════════════
-- 1. التأكد من وجود جدول review_reports مع التحسينات
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS review_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    reported_by_id INT NOT NULL,
    reported_by_type ENUM('client', 'vendor', 'admin') DEFAULT 'client',
    reason VARCHAR(500) NOT NULL,
    category ENUM('spam', 'offensive', 'fake', 'inappropriate', 'misleading', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    admin_notes TEXT,
    action_taken ENUM('none', 'warning_sent', 'review_hidden', 'review_deleted', 'user_suspended') DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_review_id (review_id),
    INDEX idx_reported_by (reported_by_id),
    INDEX idx_resolved_by (resolved_by),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_status_priority (status, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إضافة Foreign Keys بشكل آمن (إذا كانت الجداول موجودة)
-- حذف القيود القديمة إذا كانت موجودة، ثم إعادة إضافتها
ALTER TABLE review_reports DROP FOREIGN KEY IF EXISTS fk_review_reports_review;
ALTER TABLE review_reports 
    ADD CONSTRAINT fk_review_reports_review 
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE;

-- تجاهل الخطأ إذا كان جدول clients غير موجود
-- ALTER TABLE review_reports DROP FOREIGN KEY IF EXISTS fk_review_reports_client;
-- ALTER TABLE review_reports 
--     ADD CONSTRAINT fk_review_reports_client 
--     FOREIGN KEY (reported_by_id) REFERENCES clients(id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 2. إضافة جدول لسجل إجراءات التقارير
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS review_report_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    admin_id INT,
    action_type ENUM('status_change', 'priority_change', 'note_added', 'investigation_started', 'resolved', 'dismissed') NOT NULL,
    previous_value VARCHAR(255),
    new_value VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_report_id (report_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إضافة Foreign Key للتقارير
ALTER TABLE review_report_actions DROP FOREIGN KEY IF EXISTS fk_report_actions_report;
ALTER TABLE review_report_actions 
    ADD CONSTRAINT fk_report_actions_report 
    FOREIGN KEY (report_id) REFERENCES review_reports(id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 3. إضافة View للتقارير مع التفاصيل الكاملة
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW review_reports_detailed AS
SELECT 
    rr.*,
    r.comment as review_comment,
    r.rating as review_rating,
    r.created_at as review_created_at,
    c.name as reporter_name,
    c.email as reporter_email,
    v.business_name as vendor_name,
    vs.name as service_name,
    DATEDIFF(NOW(), rr.created_at) as days_open,
    CASE 
        WHEN rr.status = 'pending' AND DATEDIFF(NOW(), rr.created_at) > 7 THEN 'overdue'
        WHEN rr.status = 'pending' AND DATEDIFF(NOW(), rr.created_at) > 3 THEN 'urgent'
        ELSE 'normal'
    END as urgency_status
FROM review_reports rr
LEFT JOIN reviews r ON rr.review_id = r.id
LEFT JOIN clients c ON rr.reported_by_id = c.id
LEFT JOIN vendors v ON r.vendor_id = v.id
LEFT JOIN vendor_services vs ON r.service_id = vs.id;

-- ═══════════════════════════════════════════════════════════════
-- 4. إضافة Trigger لتحديث أولوية التقرير تلقائياً
-- ═══════════════════════════════════════════════════════════════

-- حذف الـ Trigger القديم إذا كان موجوداً
DROP TRIGGER IF EXISTS update_report_priority;

DELIMITER $$

CREATE TRIGGER update_report_priority
BEFORE UPDATE ON review_reports
FOR EACH ROW
BEGIN
    -- إذا كان التقرير معلق لأكثر من 7 أيام، رفع الأولوية
    IF NEW.status = 'pending' AND DATEDIFF(NOW(), NEW.created_at) > 7 THEN
        SET NEW.priority = 'urgent';
    END IF;
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════
-- 5. Stored Procedure لمعالجة التقرير
-- ═══════════════════════════════════════════════════════════════

-- حذف الـ Procedure القديم إذا كان موجوداً
DROP PROCEDURE IF EXISTS process_review_report;

DELIMITER $$

CREATE PROCEDURE process_review_report(
    IN p_report_id INT,
    IN p_admin_id INT,
    IN p_action VARCHAR(50),
    IN p_admin_notes TEXT,
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE v_review_id INT;
    DECLARE v_old_status VARCHAR(50);
    
    -- الحصول على معلومات التقرير
    SELECT review_id, status INTO v_review_id, v_old_status
    FROM review_reports
    WHERE id = p_report_id;
    
    IF v_review_id IS NULL THEN
        SET p_status = 'error_report_not_found';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Report not found';
    END IF;
    
    -- تحديث التقرير
    UPDATE review_reports
    SET 
        status = 'resolved',
        resolved_by = p_admin_id,
        resolved_at = NOW(),
        admin_notes = CONCAT(IFNULL(admin_notes, ''), '\n', p_admin_notes),
        action_taken = p_action
    WHERE id = p_report_id;
    
    -- تنفيذ الإجراء المطلوب
    IF p_action = 'review_hidden' THEN
        UPDATE reviews SET status = 'hidden' WHERE id = v_review_id;
    ELSEIF p_action = 'review_deleted' THEN
        UPDATE reviews SET status = 'deleted' WHERE id = v_review_id;
    END IF;
    
    -- تسجيل الإجراء
    INSERT INTO review_report_actions (report_id, admin_id, action_type, previous_value, new_value, notes)
    VALUES (p_report_id, p_admin_id, 'resolved', v_old_status, 'resolved', p_admin_notes);
    
    -- تسجيل في سجل نشاط المسؤولين (إذا كان الجدول موجوداً)
    -- يمكن إلغاء التعليق عندما يتم إنشاء جدول admin_activity_log
    -- INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id, description)
    -- VALUES (p_admin_id, 'update', 'review_report', p_report_id, CONCAT('Processed report with action: ', p_action));
    
    SET p_status = 'success';
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════
-- 6. Function لحساب عدد التقارير النشطة للمراجعة
-- ═══════════════════════════════════════════════════════════════

-- حذف الـ Function القديمة إذا كانت موجودة
DROP FUNCTION IF EXISTS get_pending_reports_count;

DELIMITER $$

CREATE FUNCTION get_pending_reports_count(p_review_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE report_count INT;
    
    SELECT COUNT(*) INTO report_count
    FROM review_reports
    WHERE review_id = p_review_id AND status IN ('pending', 'investigating');
    
    RETURN report_count;
END$$

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════
-- 7. إضافة بيانات تجريبية
-- ═══════════════════════════════════════════════════════════════

-- تنظيف البيانات القديمة (اختياري - قم بإلغاء التعليق إذا أردت)
-- TRUNCATE TABLE review_reports;

-- إضافة تقارير تجريبية (إذا كانت هناك تقييمات)
-- هذا الاستعلام سيضيف تقرير واحد فقط لأول تقييم موجود
INSERT INTO review_reports (review_id, reported_by_id, reason, category, description, priority)
SELECT 
    r.id,
    1, -- client_id = 1
    'محتوى غير لائق',
    'inappropriate',
    'هذا التقييم يحتوي على لغة غير لائقة ويجب مراجعته',
    'medium'
FROM reviews r
WHERE NOT EXISTS (SELECT 1 FROM review_reports WHERE review_id = r.id)
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════
-- 8. إحصائيات التقارير
-- ═══════════════════════════════════════════════════════════════

SELECT 
    status,
    COUNT(*) as count,
    AVG(DATEDIFF(IFNULL(resolved_at, NOW()), created_at)) as avg_resolution_days
FROM review_reports
GROUP BY status;

-- ═══════════════════════════════════════════════════════════════
-- إعادة تفعيل فحص Foreign Keys
-- ═══════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════
-- تم تحسين نظام تقارير التقييمات بنجاح
-- ═══════════════════════════════════════════════════════════════

SELECT 'Review reports system improved successfully!' AS status;
