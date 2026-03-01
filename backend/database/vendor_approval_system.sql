-- تعديل جدول البائعين لإضافة نظام الموافقة
ALTER TABLE vendors 
ADD COLUMN status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
ADD COLUMN admin_notes TEXT,
ADD COLUMN approved_by INT,
ADD COLUMN approved_at TIMESTAMP NULL,
ADD CONSTRAINT fk_vendors_approved_by FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL;

-- تحديث البائعين الموجودين ليصبحوا مقبولين (للبيانات التجريبية)
UPDATE vendors SET status = 'approved' WHERE id IN (1, 2, 3);

-- إضافة فهرس للبحث السريع حسب الحالة
ALTER TABLE vendors ADD INDEX idx_status (status);

SELECT 'Vendor approval system added successfully!' as message;
