import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default {
  async query(sql: string, params?: any[]) {
    try {
      const [results] = await pool.execute(sql, params);
      return results as any;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },
  
  async getConnection() {
    return await pool.getConnection();
  }
};
