import mysql from 'mysql2/promise';

// SSL مطلوب للاتصال بـ Aiven (production)، معطّل محلياً (XAMPP)
const useSSL = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace',
  ssl: useSSL ? { rejectUnauthorized: true } : undefined,
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
