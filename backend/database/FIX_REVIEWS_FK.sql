-- ═══════════════════════════════════════════════════════════════
-- إصلاح العلاقة بين reviews و bookings
-- ═══════════════════════════════════════════════════════════════

USE wedding_marketplace;

-- الخطوة 1: اجعل عمود booking_id يقبل NULL
ALTER TABLE reviews MODIFY COLUMN booking_id INT NULL;

-- الخطوة 2: امسح القيم القديمة (لأن جدول bookings تم حذفه وإعادة إنشائه)
UPDATE reviews SET booking_id = NULL WHERE booking_id IS NOT NULL;

-- الخطوة 3: أضف الـ foreign key الجديد
ALTER TABLE reviews 
ADD CONSTRAINT reviews_booking_fk 
FOREIGN KEY (booking_id) 
REFERENCES bookings(id) 
ON DELETE SET NULL;

SELECT '✅ تم إصلاح العلاقة بين reviews و bookings بنجاح!' as status;
