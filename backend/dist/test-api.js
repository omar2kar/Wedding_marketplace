"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function testAPI() {
    console.log('Testing database and API...');
    try {
        // Test database connection
        const testQuery = await database_1.default.query('SELECT 1 as test');
        console.log('✓ Database connected');
        // Check if vendor exists
        const vendors = await database_1.default.query("SELECT id, email, name FROM vendors WHERE email = 'vendor@test.com'");
        if (vendors.length > 0) {
            console.log('✓ Vendor found:', vendors[0]);
        }
        else {
            console.log('✗ No vendor with email vendor@test.com');
            console.log('Creating test vendor...');
            // Create vendor with bcrypt hash for "password123"
            await database_1.default.query(`INSERT INTO vendors (name, email, password, business_name, category) 
         VALUES (?, ?, ?, ?, ?)`, [
                'Test Vendor',
                'vendor@test.com',
                '$2b$10$YE5ZvMSLxCqG0CjY2i3Xze0GKhHCd8H0bJXBKWQXoOvXuFqHZ6nXO',
                'Test Business',
                'Photography'
            ]);
            console.log('✓ Test vendor created');
        }
        // Test login with fetch
        console.log('\nTesting login endpoint...');
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:5000/api/vendor/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'vendor@test.com',
                password: 'password123'
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log('✓ Login successful!');
            console.log('Token:', data.token?.substring(0, 20) + '...');
        }
        else {
            console.log('✗ Login failed:', data.error);
        }
    }
    catch (error) {
        console.error('✗ Error:', error.message);
    }
    process.exit(0);
}
testAPI();
//# sourceMappingURL=test-api.js.map