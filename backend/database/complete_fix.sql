-- إصلاح شامل لنظام التقييمات
USE wedding_marketplace;

-- 1. التأكد من وجود العمود is_visible_to_vendor
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_visible_to_vendor BOOLEAN DEFAULT TRUE AFTER has_purchased;

-- 2. تحديث جميع التقييمات الموجودة لتكون مرئية للبائعين
UPDATE reviews 
SET is_visible_to_vendor = TRUE 
WHERE is_visible_to_vendor IS NULL;

-- 3. التأكد من أن جميع التقييمات لها vendor_id صحيح
UPDATE reviews r
JOIN services s ON r.service_id = s.id
SET r.vendor_id = s.vendor_id
WHERE r.vendor_id IS NULL OR r.vendor_id = 0;

-- 4. تحديث تقييمات البائعين
UPDATE vendors v
SET rating = (
    SELECT AVG(rating) 
    FROM reviews 
    WHERE vendor_id = v.id 
    AND is_visible_to_vendor = TRUE
),
total_reviews = (
    SELECT COUNT(*) 
    FROM reviews 
    WHERE vendor_id = v.id 
    AND is_visible_to_vendor = TRUE
)
WHERE id IN (SELECT DISTINCT vendor_id FROM reviews);

-- 5. إضافة فهرس لتحسين الأداء
ALTER TABLE reviews ADD INDEX IF NOT EXISTS idx_visible_reviews (vendor_id, is_visible_to_vendor);

-- عرض حالة التقييمات
SELECT 
    v.id as vendor_id,
    v.name as vendor_name,
    v.rating,
    v.total_reviews,
    COUNT(r.id) as actual_reviews
FROM vendors v
LEFT JOIN reviews r ON v.id = r.vendor_id AND r.is_visible_to_vendor = TRUE
GROUP BY v.id, v.name, v.rating, v.total_reviews;
