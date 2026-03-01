"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
exports.default = {
    async query(sql, params) {
        try {
            const [results] = await pool.execute(sql, params);
            return results;
        }
        catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    },
    async getConnection() {
        return await pool.getConnection();
    }
};
//# sourceMappingURL=database.js.map