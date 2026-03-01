-- ═══════════════════════════════════════════════════════════════
-- حذف جداول الحجوزات - الحل النهائي
-- يحذف الـ foreign key من reviews أولاً
-- ═══════════════════════════════════════════════════════════════

USE wedding_marketplace;

-- تعطيل فحص Foreign Keys
SET FOREIGN_KEY_CHECKS = 0;

-- حذف الـ foreign key من جدول reviews
ALTER TABLE reviews DROP FOREIGN KEY IF EXISTS reviews_ibfk_4;

-- الآن يمكننا حذف bookings
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS service_availability;

-- إعادة تفعيل Foreign Keys
SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ تم حذف جداول الحجوزات بنجاح!' as status;
