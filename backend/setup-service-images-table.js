const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace'
};

async function setupServiceImagesTable() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected successfully!');
    
    // Check if table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'service_images'"
    );
    
    if (tables.length > 0) {
      console.log('✓ service_images table already exists');
      
      // Show current structure
      const [columns] = await connection.query('DESCRIBE service_images');
      console.log('\nCurrent table structure:');
      console.table(columns);
      
    } else {
      console.log('Creating service_images table...');
      
      await connection.query(`
        CREATE TABLE service_images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_id INT NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          original_filename VARCHAR(255),
          uploader_id INT,
          upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          display_order INT DEFAULT 0,
          is_primary BOOLEAN DEFAULT FALSE,
          file_size INT,
          mime_type VARCHAR(100),
          INDEX idx_service_id (service_id),
          INDEX idx_uploader_id (uploader_id),
          INDEX idx_display_order (display_order)
        )
      `);
      
      console.log('✓ service_images table created successfully!');
      
      // Show created structure
      const [columns] = await connection.query('DESCRIBE service_images');
      console.log('\nCreated table structure:');
      console.table(columns);
    }
    
    // Count existing records
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM service_images'
    );
    console.log(`\nTotal images in database: ${countResult[0].count}`);
    
  } catch (error) {
    console.error('Error setting up service_images table:');
    console.error(error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n❌ Database access denied. Please check your credentials in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n❌ Database does not exist. Please create the wedding_marketplace database first');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

console.log('='.repeat(60));
console.log('Service Images Table Setup');
console.log('='.repeat(60));
console.log(`Database: ${dbConfig.database}`);
console.log(`Host: ${dbConfig.host}`);
console.log('='.repeat(60));
console.log('');

setupServiceImagesTable()
  .then(() => {
    console.log('\n✓ Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  });
