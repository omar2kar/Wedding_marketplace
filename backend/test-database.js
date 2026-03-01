const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wedding_marketplace'
};

async function testDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        
        // Test 1: Check vendors table
        console.log('\n📋 Testing vendors table:');
        const [vendors] = await connection.execute('SELECT * FROM vendors LIMIT 5');
        console.log('Total vendors in database:', vendors.length);
        console.log('Sample vendor data:', vendors[0] || 'No vendors found');
        
        // Test 2: Check vendor_services table
        console.log('\n📋 Testing vendor_services table:');
        const [services] = await connection.execute('SELECT * FROM vendor_services LIMIT 5');
        console.log('Total services in database:', services.length);
        console.log('Sample service data:', services[0] || 'No services found');
        
        // Test 3: Check join between vendors and services
        console.log('\n📋 Testing vendors with services:');
        const [vendorsWithServices] = await connection.execute(`
            SELECT 
                v.id,
                v.business_name,
                v.name as owner_name,
                COUNT(vs.id) as service_count
            FROM vendors v
            LEFT JOIN vendor_services vs ON v.id = vs.vendor_id AND vs.is_active = 1
            GROUP BY v.id, v.business_name, v.name
            LIMIT 10
        `);
        console.log('Vendors with services:', vendorsWithServices);
        
        // Test 4: Check specific query used in API
        console.log('\n📋 Testing actual API query:');
        const [apiResult] = await connection.execute(`
            SELECT 
                v.id,
                v.business_name,
                v.name as owner_name,
                v.phone,
                v.email,
                v.category as vendor_category,
                v.rating,
                v.total_reviews,
                v.created_at,
                COUNT(CASE WHEN vs.is_active = 1 THEN vs.id END) as service_count,
                MIN(CASE WHEN vs.is_active = 1 THEN vs.price END) as min_price,
                MAX(CASE WHEN vs.is_active = 1 THEN vs.price END) as max_price,
                GROUP_CONCAT(DISTINCT CASE WHEN vs.is_active = 1 THEN vs.category END) as service_categories
            FROM vendors v
            LEFT JOIN vendor_services vs ON v.id = vs.vendor_id
            WHERE 1=1
            GROUP BY v.id, v.business_name, v.name, v.phone, v.email, v.category, v.rating, v.total_reviews, v.created_at
            HAVING COUNT(CASE WHEN vs.is_active = 1 THEN vs.id END) > 0
            LIMIT 10
        `);
        console.log('API query results:', apiResult);
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

testDatabase();
