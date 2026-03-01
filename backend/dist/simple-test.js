"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function testConnection() {
    let connection;
    try {
        console.log('Attempting to connect to MySQL...');
        connection = await promise_1.default.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'wedding_marketplace'
        });
        console.log('✓ Connected to MySQL');
        // Test if database exists
        const [databases] = await connection.query('SHOW DATABASES');
        console.log('\nAvailable databases:');
        databases.forEach((db) => {
            console.log('  -', db.Database);
        });
        // Check current database
        const [currentDb] = await connection.query('SELECT DATABASE() as db');
        console.log('\nCurrent database:', currentDb[0].db);
        // Check tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('\nTables in wedding_marketplace:');
        tables.forEach((table) => {
            const key = Object.keys(table)[0];
            console.log('  -', table[key]);
        });
        // Insert a test review directly
        console.log('\nInserting test review...');
        const [result] = await connection.execute(`INSERT INTO reviews (client_id, vendor_id, service_id, booking_id, rating, comment, has_purchased, created_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?, NOW())`, [1, 1, 1, 5, 'Test review from simple-test script', 1]);
        console.log('✓ Review inserted with ID:', result.insertId);
        // Fetch all reviews
        const [reviews] = await connection.query('SELECT id, rating, comment FROM reviews ORDER BY id DESC LIMIT 5');
        console.log('\nLatest reviews:');
        reviews.forEach((review) => {
            console.log(`  - ID ${review.id}: ${review.rating} stars - ${review.comment}`);
        });
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Check your MySQL username and password.');
        }
        else if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Make sure MySQL/XAMPP is running.');
        }
        else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('Database does not exist. Create it first.');
        }
    }
    finally {
        if (connection) {
            await connection.end();
            console.log('\n✓ Connection closed');
        }
    }
}
testConnection();
//# sourceMappingURL=simple-test.js.map