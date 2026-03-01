-- Fix reviews visibility issue
USE wedding_marketplace;

-- Check if the old column exists and rename it
ALTER TABLE reviews 
DROP COLUMN IF EXISTS is_visible_to_vendor_only;

-- Add the correct column if it doesn't exist
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_visible_to_vendor BOOLEAN DEFAULT TRUE;

-- Update all existing reviews to be visible to vendors
UPDATE reviews SET is_visible_to_vendor = TRUE WHERE is_visible_to_vendor IS NULL;

-- Insert some test reviews if none exist
INSERT INTO reviews (client_id, vendor_id, service_id, booking_id, rating, comment, has_purchased, is_visible_to_vendor)
SELECT 1, 1, 1, 1, 5, 'خدمة ممتازة وفريق محترف! أنصح بالتعامل معهم بشدة', true, true
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE vendor_id = 1);

INSERT INTO reviews (client_id, vendor_id, service_id, booking_id, rating, comment, has_purchased, is_visible_to_vendor)
SELECT 2, 1, 2, 2, 4, 'تصوير جيد جداً ولكن التسليم تأخر قليلاً', true, true
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE vendor_id = 1 AND client_id = 2);

-- Update vendor ratings
UPDATE vendors v
SET rating = (SELECT AVG(rating) FROM reviews WHERE vendor_id = v.id AND is_visible_to_vendor = TRUE),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE vendor_id = v.id AND is_visible_to_vendor = TRUE)
WHERE id IN (SELECT DISTINCT vendor_id FROM reviews WHERE is_visible_to_vendor = TRUE);
