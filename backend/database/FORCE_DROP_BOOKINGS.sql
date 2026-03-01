-- ═══════════════════════════════════════════════════════════════
-- حذف قوي لجداول الحجوزات - يحذف كل الـ foreign keys أولاً
-- ═══════════════════════════════════════════════════════════════

USE wedding_marketplace;

-- تعطيل فحص Foreign Keys
SET FOREIGN_KEY_CHECKS = 0;

-- حذف جميع الجداول المرتبطة بالحجوزات
DROP TABLE IF EXISTS booking_history;
DROP TABLE IF EXISTS booking_payments;
DROP TABLE IF EXISTS booking_services;
DROP TABLE IF EXISTS booking_reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS service_availability;

-- إعادة تفعيل Foreign Keys
SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ تم حذف جميع جداول الحجوزات بنجاح!' as status;
