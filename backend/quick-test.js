const express = require('express');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wedding_marketplace'
};

async function quickTest() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Testing API Query...');
        
        let query = `
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
            ORDER BY v.rating DESC, v.created_at DESC
            LIMIT 10
        `;

        const [vendors] = await connection.execute(query);
        console.log('\n📊 Raw query results:');
        vendors.forEach((vendor, index) => {
            console.log(`Vendor ${index + 1}:`, {
                id: vendor.id,
                business_name: vendor.business_name,
                owner_name: vendor.owner_name,
                service_count: vendor.service_count,
                min_price: vendor.min_price,
                max_price: vendor.max_price
            });
        });

        // Process data like API does
        const processedVendors = vendors.map(row => ({
            id: row.id,
            businessName: row.business_name || 'بائع غير محدد',
            ownerName: row.owner_name || 'غير محدد',
            phone: row.phone || '',
            email: row.email || '',
            city: 'غير محدد',
            vendorCategory: row.vendor_category || 'غير محدد',
            description: 'لا يوجد وصف متاح',
            rating: row.rating ? Number(row.rating) : 0,
            reviewCount: Number(row.total_reviews) || 0,
            isVerified: false,
            createdAt: row.created_at,
            serviceCount: Number(row.service_count) || 0,
            minPrice: row.min_price ? Number(row.min_price) : 0,
            maxPrice: row.max_price ? Number(row.max_price) : 0,
            serviceCategories: row.service_categories ? row.service_categories.split(',') : [],
            profileImage: null
        }));

        console.log('\n🔄 Processed vendor data (what Frontend should get):');
        processedVendors.forEach((vendor, index) => {
            console.log(`Processed Vendor ${index + 1}:`, {
                id: vendor.id,
                businessName: vendor.businessName,
                ownerName: vendor.ownerName,
                serviceCount: vendor.serviceCount,
                minPrice: vendor.minPrice,
                maxPrice: vendor.maxPrice
            });
        });

        console.log('\n✅ Total vendors to display:', processedVendors.length);

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

quickTest();
