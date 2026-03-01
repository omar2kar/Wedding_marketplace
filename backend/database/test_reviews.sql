-- إدراج بيانات تجريبية للتقييمات
-- تأكد من وجود البائعين والعملاء والخدمات أولاً

-- إدراج تقييمات تجريبية للبائع رقم 1
INSERT INTO reviews (client_id, vendor_id, service_id, booking_id, rating, comment, has_purchased, created_at, vendor_reply, reply_date) VALUES
(1, 1, 1, NULL, 5, 'خدمة ممتازة وفريق محترف جداً! الصور كانت رائعة وتم التسليم في الوقت المحدد. أنصح بشدة بالتعامل معهم.', 1, NOW() - INTERVAL 7 DAY, 'شكراً لثقتكم الغالية، سعداء جداً بخدمتكم ونتطلع للتعامل معكم مرة أخرى', NOW() - INTERVAL 6 DAY),
(2, 1, 1, NULL, 4, 'جودة التصوير عالية والفريق متعاون. كان هناك تأخير بسيط في التسليم لكن النتيجة النهائية كانت مرضية.', 1, NOW() - INTERVAL 14 DAY, 'نعتذر عن التأخير ونسعى دائماً لتحسين خدماتنا. شكراً لتفهمكم', NOW() - INTERVAL 13 DAY),
(3, 1, 2, NULL, 5, 'أفضل استوديو تصوير! احترافية عالية وأسعار مناسبة. الصور خرجت أجمل مما توقعت.', 1, NOW() - INTERVAL 21 DAY, 'يسعدنا أن نكون جزءاً من ذكرياتكم الجميلة، شكراً لكم', NOW() - INTERVAL 20 DAY),
(4, 1, 2, NULL, 5, 'تعامل راقي واحترافية في العمل. أعجبني جداً الإبداع في التصوير والمونتاج.', 1, NOW() - INTERVAL 30 DAY, NULL, NULL),
(5, 1, 1, NULL, 4, 'خدمة جيدة بشكل عام. الموظفون ودودون ومحترفون. سأتعامل معهم مرة أخرى بالتأكيد.', 1, NOW() - INTERVAL 45 DAY, 'نشكركم على ثقتكم ونتطلع لخدمتكم مجدداً', NOW() - INTERVAL 44 DAY),
(1, 1, 3, NULL, 5, 'تصوير احترافي للمنتجات! النتائج فاقت توقعاتي. شكراً لكم على الجهد الرائع.', 1, NOW() - INTERVAL 60 DAY, NULL, NULL);

-- إدراج تقييمات للبائع رقم 2 (إن وجد)
INSERT INTO reviews (client_id, vendor_id, service_id, booking_id, rating, comment, has_purchased, created_at, vendor_reply, reply_date) VALUES
(2, 2, 4, NULL, 5, 'قاعة رائعة ونظيفة! الديكور جميل والخدمة ممتازة. كان حفل زفافي مثالياً.', 1, NOW() - INTERVAL 10 DAY, 'تهانينا على زواجكم، سعداء بأن نكون جزءاً من يومكم المميز', NOW() - INTERVAL 9 DAY),
(3, 2, 4, NULL, 4, 'المكان جميل والموقع ممتاز. الطاقم متعاون جداً. فقط الصوت كان يحتاج لتحسين.', 1, NOW() - INTERVAL 25 DAY, 'شكراً لملاحظاتكم القيمة، سنعمل على تحسين نظام الصوت', NOW() - INTERVAL 24 DAY);

-- تحديث عدد التقييمات ومتوسط التقييم للبائعين
UPDATE vendors v
SET rating = (SELECT AVG(rating) FROM reviews WHERE vendor_id = v.id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE vendor_id = v.id)
WHERE v.id IN (1, 2);
