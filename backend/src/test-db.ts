import db from './database';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    console.log('DB Config:', {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'wedding_marketplace'
    });

    // Test basic connection
    await db.query('SELECT 1 as test');
    console.log('✓ Database connection successful');

    // Check if tables exist
    const tables = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [process.env.DB_NAME || 'wedding_marketplace']
    );
    console.log('\nExisting tables:');
    tables.forEach((table: any) => {
      console.log('  -', table.table_name || table.TABLE_NAME);
    });

    // Check reviews table structure
    const reviewsStructure = await db.query(
      "DESCRIBE reviews"
    );
    console.log('\nReviews table structure:');
    reviewsStructure.forEach((col: any) => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check if there are any reviews
    const reviewCount = await db.query('SELECT COUNT(*) as count FROM reviews');
    console.log(`\n✓ Total reviews in database: ${reviewCount[0].count}`);

    // Check vendors table
    const vendors = await db.query('SELECT id, email, name FROM vendors LIMIT 5');
    console.log('\nVendors in database:');
    vendors.forEach((vendor: any) => {
      console.log(`  - ID: ${vendor.id}, Email: ${vendor.email}, Name: ${vendor.name}`);
    });

    // Check clients table  
    const clients = await db.query('SELECT id, email, name FROM clients LIMIT 5');
    console.log('\nClients in database:');
    clients.forEach((client: any) => {
      console.log(`  - ID: ${client.id}, Email: ${client.email}, Name: ${client.name}`);
    });

    // Check services table
    const services = await db.query('SELECT id, vendor_id, name FROM services LIMIT 5');
    console.log('\nServices in database:');
    services.forEach((service: any) => {
      console.log(`  - ID: ${service.id}, Vendor: ${service.vendor_id}, Name: ${service.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();
