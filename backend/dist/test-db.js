"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function testDatabase() {
    try {
        console.log('Testing database connection...');
        console.log('DB Config:', {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            database: process.env.DB_NAME || 'wedding_marketplace'
        });
        // Test basic connection
        await database_1.default.query('SELECT 1 as test');
        console.log('✓ Database connection successful');
        // Check if tables exist
        const tables = await database_1.default.query("SELECT table_name FROM information_schema.tables WHERE table_schema = ?", [process.env.DB_NAME || 'wedding_marketplace']);
        console.log('\nExisting tables:');
        tables.forEach((table) => {
            console.log('  -', table.table_name || table.TABLE_NAME);
        });
        // Check reviews table structure
        const reviewsStructure = await database_1.default.query("DESCRIBE reviews");
        console.log('\nReviews table structure:');
        reviewsStructure.forEach((col) => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        // Check if there are any reviews
        const reviewCount = await database_1.default.query('SELECT COUNT(*) as count FROM reviews');
        console.log(`\n✓ Total reviews in database: ${reviewCount[0].count}`);
        // Check vendors table
        const vendors = await database_1.default.query('SELECT id, email, name FROM vendors LIMIT 5');
        console.log('\nVendors in database:');
        vendors.forEach((vendor) => {
            console.log(`  - ID: ${vendor.id}, Email: ${vendor.email}, Name: ${vendor.name}`);
        });
        // Check clients table  
        const clients = await database_1.default.query('SELECT id, email, name FROM clients LIMIT 5');
        console.log('\nClients in database:');
        clients.forEach((client) => {
            console.log(`  - ID: ${client.id}, Email: ${client.email}, Name: ${client.name}`);
        });
        // Check services table
        const services = await database_1.default.query('SELECT id, vendor_id, name FROM services LIMIT 5');
        console.log('\nServices in database:');
        services.forEach((service) => {
            console.log(`  - ID: ${service.id}, Vendor: ${service.vendor_id}, Name: ${service.name}`);
        });
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Database test failed:', error);
        process.exit(1);
    }
}
testDatabase();
//# sourceMappingURL=test-db.js.map