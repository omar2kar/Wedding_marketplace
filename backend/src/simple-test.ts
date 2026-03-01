import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  let connection;
  try {
    console.log('Attempting to connect to MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wedding_marketplace'
    });
    
    console.log('✓ Connected to MySQL');
    
    // Test if database exists
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('\nAvailable databases:');
    (databases as any[]).forEach((db: any) => {
      console.log('  -', db.Database);
    });
    
    // Check current database
    const [currentDb] = await connection.query('SELECT DATABASE() as db');
    console.log('\nCurrent database:', (currentDb as any[])[0].db);
    
    // Check tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nTables in wedding_marketplace:');
    (tables as any[]).forEach((table: any) => {
      const key = Object.keys(table)[0];
      console.log('  -', table[key]);
    });
    
    // Insert a test review directly
    console.log('\nInserting test review...');
    const [result] = await connection.execute(
      `INSERT INTO reviews (client_id, vendor_id, service_id, booking_id, rating, comment, has_purchased, created_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?, NOW())`,
      [1, 1, 1, 5, 'Test review from simple-test script', 1]
    );
    
    console.log('✓ Review inserted with ID:', (result as any).insertId);
    
    // Fetch all reviews
    const [reviews] = await connection.query('SELECT id, rating, comment FROM reviews ORDER BY id DESC LIMIT 5');
    console.log('\nLatest reviews:');
    (reviews as any[]).forEach((review: any) => {
      console.log(`  - ID ${review.id}: ${review.rating} stars - ${review.comment}`);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Check your MySQL username and password.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Make sure MySQL/XAMPP is running.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('Database does not exist. Create it first.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Connection closed');
    }
  }
}

testConnection();
