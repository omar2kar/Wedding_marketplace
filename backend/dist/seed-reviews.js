"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function seedReviews() {
    try {
        console.log('Starting to seed reviews...');
        // Insert test reviews for vendor 1
        const reviews = [
            {
                client_id: 1,
                vendor_id: 1,
                service_id: 1,
                rating: 5,
                comment: 'خدمة ممتازة وفريق محترف جداً! الصور كانت رائعة وتم التسليم في الوقت المحدد. أنصح بشدة بالتعامل معهم.',
                has_purchased: true,
                vendor_reply: 'شكراً لثقتكم الغالية، سعداء جداً بخدمتكم ونتطلع للتعامل معكم مرة أخرى'
            },
            {
                client_id: 2,
                vendor_id: 1,
                service_id: 1,
                rating: 4,
                comment: 'جودة التصوير عالية والفريق متعاون. كان هناك تأخير بسيط في التسليم لكن النتيجة النهائية كانت مرضية.',
                has_purchased: true,
                vendor_reply: 'نعتذر عن التأخير ونسعى دائماً لتحسين خدماتنا. شكراً لتفهمكم'
            },
            {
                client_id: 3,
                vendor_id: 1,
                service_id: 2,
                rating: 5,
                comment: 'أفضل استوديو تصوير! احترافية عالية وأسعار مناسبة. الصور خرجت أجمل مما توقعت.',
                has_purchased: true,
                vendor_reply: 'يسعدنا أن نكون جزءاً من ذكرياتكم الجميلة، شكراً لكم'
            },
            {
                client_id: 1,
                vendor_id: 1,
                service_id: 2,
                rating: 5,
                comment: 'تعامل راقي واحترافية في العمل. أعجبني جداً الإبداع في التصوير والمونتاج.',
                has_purchased: true,
                vendor_reply: null
            },
            {
                client_id: 2,
                vendor_id: 1,
                service_id: 1,
                rating: 4,
                comment: 'خدمة جيدة بشكل عام. الموظفون ودودون ومحترفون. سأتعامل معهم مرة أخرى بالتأكيد.',
                has_purchased: true,
                vendor_reply: 'نشكركم على ثقتكم ونتطلع لخدمتكم مجدداً'
            }
        ];
        // Check if reviews already exist
        const existingReviews = await database_1.default.query('SELECT COUNT(*) as count FROM reviews WHERE vendor_id = 1');
        if (existingReviews[0].count > 0) {
            console.log(`Found ${existingReviews[0].count} existing reviews for vendor 1. Skipping seed.`);
            return;
        }
        // Insert reviews
        for (const review of reviews) {
            await database_1.default.query(`INSERT INTO reviews (client_id, vendor_id, service_id, booking_id, rating, comment, has_purchased, created_at, vendor_reply, reply_date)
         VALUES (?, ?, ?, NULL, ?, ?, ?, NOW(), ?, ?)`, [
                review.client_id,
                review.vendor_id,
                review.service_id,
                review.rating,
                review.comment,
                review.has_purchased ? 1 : 0,
                review.vendor_reply,
                review.vendor_reply ? new Date() : null
            ]);
            console.log(`Added review from client ${review.client_id} for service ${review.service_id}`);
        }
        // Update vendor rating
        await database_1.default.query(`UPDATE vendors v
       SET rating = (SELECT AVG(rating) FROM reviews WHERE vendor_id = v.id),
           total_reviews = (SELECT COUNT(*) FROM reviews WHERE vendor_id = v.id)
       WHERE v.id = 1`);
        console.log('Successfully seeded reviews!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding reviews:', error);
        process.exit(1);
    }
}
seedReviews();
//# sourceMappingURL=seed-reviews.js.map