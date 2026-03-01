-- ═══════════════════════════════════════════════════════════════
-- إضافة Indexes لتحسين الأداء - Wedding Marketplace
-- ═══════════════════════════════════════════════════════════════

USE wedding_marketplace;

-- ═══════════════════════════════════════════════════════════════
-- 1. Indexes لجدول clients
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- ═══════════════════════════════════════════════════════════════
-- 2. Indexes لجدول vendors
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON vendors(created_at);
CREATE INDEX IF NOT EXISTS idx_vendors_status_category ON vendors(status, category);

-- ═══════════════════════════════════════════════════════════════
-- 3. Indexes لجدول vendor_services
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_id ON vendor_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_services_category ON vendor_services(category);
CREATE INDEX IF NOT EXISTS idx_vendor_services_is_active ON vendor_services(is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_services_price ON vendor_services(price);
CREATE INDEX IF NOT EXISTS idx_vendor_services_created_at ON vendor_services(created_at);
CREATE INDEX IF NOT EXISTS idx_vendor_services_active_category ON vendor_services(is_active, category);
CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_active ON vendor_services(vendor_id, is_active);

-- ═══════════════════════════════════════════════════════════════
-- 4. Indexes لجدول service_images
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_service_images_service_id ON service_images(service_id);
CREATE INDEX IF NOT EXISTS idx_service_images_is_primary ON service_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_service_images_display_order ON service_images(display_order);
CREATE INDEX IF NOT EXISTS idx_service_images_service_primary ON service_images(service_id, is_primary);

-- ═══════════════════════════════════════════════════════════════
-- 5. Indexes لجدول bookings
-- ═══════════════════════════════════════════════════════════════

-- ملاحظة: بعض الأعمدة قد لا تكون موجودة في الهيكل القديم
-- سيتم تجاهل الأخطاء إذا كان العمود غير موجود

CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);

-- الفهارس التالية تتطلب أعمدة من الهيكل الجديد
-- إذا حصلت على خطأ، قم بتشغيل booking_system.sql أولاً
-- CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_client_status ON bookings(client_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_status ON bookings(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_date ON bookings(vendor_id, event_date);

-- ═══════════════════════════════════════════════════════════════
-- 6. Indexes لجدول reviews (أو service_reviews)
-- ═══════════════════════════════════════════════════════════════

-- ملاحظة: الجدول قد يكون باسم reviews أو service_reviews
-- حاول تنفيذ النسختين، إحداهما ستنجح حسب اسم الجدول لديك

-- محاولة 1: إذا كان اسم الجدول reviews
-- CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);
-- CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
-- CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
-- CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
-- CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
-- CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON reviews(is_verified);
-- CREATE INDEX IF NOT EXISTS idx_reviews_service_rating ON reviews(service_id, rating);
-- CREATE INDEX IF NOT EXISTS idx_reviews_vendor_rating ON reviews(vendor_id, rating);

-- محاولة 2: إذا كان اسم الجدول service_reviews
CREATE INDEX IF NOT EXISTS idx_service_reviews_client_id ON service_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_is_verified ON service_reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_service_reviews_helpful_count ON service_reviews(helpful_count);
CREATE INDEX IF NOT EXISTS idx_service_reviews_updated_at ON service_reviews(updated_at);

-- الفهارس التالية تتطلب أعمدة غير موجودة في الهيكل الحالي
-- CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
-- CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
-- CREATE INDEX IF NOT EXISTS idx_reviews_vendor_status ON reviews(vendor_id, status);

-- ═══════════════════════════════════════════════════════════════
-- 7. Indexes لجدول client_favorites
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON client_favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_favorites_service_id ON client_favorites(service_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON client_favorites(created_at);

-- ═══════════════════════════════════════════════════════════════
-- 8. Indexes لجدول conversations
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- ═══════════════════════════════════════════════════════════════
-- 9. Indexes لجدول messages
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

-- ═══════════════════════════════════════════════════════════════
-- 10. Indexes لجدول service_packages
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_packages_service_id ON service_packages(service_id);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_is_popular ON service_packages(is_popular);
CREATE INDEX IF NOT EXISTS idx_packages_price ON service_packages(price);
CREATE INDEX IF NOT EXISTS idx_packages_display_order ON service_packages(display_order);
CREATE INDEX IF NOT EXISTS idx_packages_service_active ON service_packages(service_id, is_active);

-- ═══════════════════════════════════════════════════════════════
-- 11. Indexes لجدول service_availability
-- ═══════════════════════════════════════════════════════════════

-- ملاحظة: هذا الجدول يتطلب booking_system.sql
-- إذا لم يكن موجودًا، سيتم تجاهل هذه الفهارس

-- CREATE INDEX IF NOT EXISTS idx_availability_service_id ON service_availability(service_id);
-- CREATE INDEX IF NOT EXISTS idx_availability_date ON service_availability(date);
-- CREATE INDEX IF NOT EXISTS idx_availability_is_available ON service_availability(is_available);
-- CREATE INDEX IF NOT EXISTS idx_availability_service_date ON service_availability(service_id, date);
-- CREATE INDEX IF NOT EXISTS idx_availability_date_available ON service_availability(date, is_available);

-- ═══════════════════════════════════════════════════════════════
-- 12. Indexes لجدول booking_history
-- ═══════════════════════════════════════════════════════════════

-- ملاحظة: هذا الجدول يتطلب booking_system.sql
-- إذا لم يكن موجودًا، سيتم تجاهل هذه الفهارس

-- CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);
-- CREATE INDEX IF NOT EXISTS idx_booking_history_changed_by_type ON booking_history(changed_by_type);
-- CREATE INDEX IF NOT EXISTS idx_booking_history_created_at ON booking_history(created_at);

-- ═══════════════════════════════════════════════════════════════
-- 13. Indexes لجدول admins
-- ═══════════════════════════════════════════════════════════════

-- ملاحظة: هذا الجدول يتطلب admin_features_complete.sql
-- إذا لم يكن موجودًا، سيتم تجاهل هذه الفهارس

-- CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
-- CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
-- CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
-- CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at);

-- ═══════════════════════════════════════════════════════════════
-- 14. عرض جميع الـ Indexes المضافة
-- ═══════════════════════════════════════════════════════════════

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'wedding_marketplace'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ═══════════════════════════════════════════════════════════════
-- تم إضافة Indexes بنجاح لتحسين الأداء
-- ═══════════════════════════════════════════════════════════════

SELECT 'Performance indexes added successfully!' AS status;
