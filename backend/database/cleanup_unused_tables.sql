-- ═══════════════════════════════════════════════════════════════
-- تنظيف الجداول غير المستخدمة - Wedding Marketplace
-- ═══════════════════════════════════════════════════════════════
-- هذا السكريبت يحذف الجداول التي تم إنشاؤها لكن لم يتم استخدامها
-- ═══════════════════════════════════════════════════════════════

USE wedding_marketplace;

-- ═══════════════════════════════════════════════════════════════
-- 1. تعطيل فحص Foreign Keys مؤقتاً
-- ═══════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

-- ═══════════════════════════════════════════════════════════════
-- 2. حذف الجداول غير المستخدمة
-- ═══════════════════════════════════════════════════════════════

-- حذف الجداول التابعة أولاً
DROP TABLE IF EXISTS planner_projects;

-- حذف الجداول الرئيسية
DROP TABLE IF EXISTS wedding_planners;
DROP TABLE IF EXISTS wedding_profiles;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS comparisons;
DROP TABLE IF EXISTS search_history;
DROP TABLE IF EXISTS vendor_analytics;

-- ═══════════════════════════════════════════════════════════════
-- 3. إعادة تفعيل فحص Foreign Keys
-- ═══════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════
-- 4. التحقق من الجداول المتبقية
-- ═══════════════════════════════════════════════════════════════

SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size_MB'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'wedding_marketplace'
ORDER BY TABLE_NAME;

-- ═══════════════════════════════════════════════════════════════
-- تم تنظيف الجداول غير المستخدمة بنجاح
-- ═══════════════════════════════════════════════════════════════

SELECT 'Cleanup completed successfully!' AS status;
