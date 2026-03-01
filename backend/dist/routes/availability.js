"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promise_1 = __importDefault(require("mysql2/promise"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};
// Get availability for a service
router.get('/service/:serviceId', async (req, res) => {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        const serviceId = parseInt(req.params.serviceId);
        const query = `
      SELECT date, status 
      FROM service_availability 
      WHERE service_id = ? 
      ORDER BY date ASC
    `;
        const [rows] = await connection.execute(query, [serviceId]);
        await connection.end();
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});
// Get availability for all vendor services
router.get('/vendor', auth_1.vendorAuthMiddleware, async (req, res) => {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        const vendorId = req.vendor.id;
        const query = `
      SELECT sa.date, sa.status, sa.service_id, vs.name as service_name
      FROM service_availability sa
      JOIN vendor_services vs ON sa.service_id = vs.id
      WHERE vs.vendor_id = ?
      ORDER BY sa.date ASC
    `;
        const [rows] = await connection.execute(query, [vendorId]);
        await connection.end();
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching vendor availability:', error);
        res.status(500).json({ error: 'Failed to fetch vendor availability' });
    }
});
// Update availability for a service
router.post('/service/:serviceId', auth_1.vendorAuthMiddleware, async (req, res) => {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        const serviceId = parseInt(req.params.serviceId);
        const { date, status } = req.body;
        const vendorId = req.vendor.id;
        // Verify service belongs to vendor
        const serviceQuery = `
      SELECT id FROM vendor_services 
      WHERE id = ? AND vendor_id = ?
    `;
        const [serviceRows] = await connection.execute(serviceQuery, [serviceId, vendorId]);
        if (serviceRows.length === 0) {
            await connection.end();
            return res.status(403).json({ error: 'Service not found or access denied' });
        }
        // Insert or update availability
        const query = `
      INSERT INTO service_availability (service_id, date, status) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;
        await connection.execute(query, [serviceId, date, status]);
        await connection.end();
        res.json({ success: true, message: 'Availability updated successfully' });
    }
    catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ error: 'Failed to update availability' });
    }
});
// Bulk update availability for multiple dates
router.post('/service/:serviceId/bulk', auth_1.vendorAuthMiddleware, async (req, res) => {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        const serviceId = parseInt(req.params.serviceId);
        const { dates, status } = req.body;
        const vendorId = req.vendor.id;
        // Verify service belongs to vendor
        const serviceQuery = `
      SELECT id FROM vendor_services 
      WHERE id = ? AND vendor_id = ?
    `;
        const [serviceRows] = await connection.execute(serviceQuery, [serviceId, vendorId]);
        if (serviceRows.length === 0) {
            await connection.end();
            return res.status(403).json({ error: 'Service not found or access denied' });
        }
        // Prepare bulk insert/update
        const values = dates.map((date) => [serviceId, date, status]);
        for (const [sId, date, stat] of values) {
            const query = `
        INSERT INTO service_availability (service_id, date, status) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `;
            await connection.execute(query, [sId, date, stat]);
        }
        await connection.end();
        res.json({ success: true, message: `Updated availability for ${dates.length} dates` });
    }
    catch (error) {
        console.error('Error bulk updating availability:', error);
        res.status(500).json({ error: 'Failed to bulk update availability' });
    }
});
// Delete availability for a specific date
router.delete('/service/:serviceId/:date', auth_1.vendorAuthMiddleware, async (req, res) => {
    try {
        const connection = await promise_1.default.createConnection(dbConfig);
        const serviceId = parseInt(req.params.serviceId);
        const date = req.params.date;
        const vendorId = req.vendor.id;
        // Verify service belongs to vendor
        const serviceQuery = `
      SELECT id FROM vendor_services 
      WHERE id = ? AND vendor_id = ?
    `;
        const [serviceRows] = await connection.execute(serviceQuery, [serviceId, vendorId]);
        if (serviceRows.length === 0) {
            await connection.end();
            return res.status(403).json({ error: 'Service not found or access denied' });
        }
        const query = `
      DELETE FROM service_availability 
      WHERE service_id = ? AND date = ?
    `;
        await connection.execute(query, [serviceId, date]);
        await connection.end();
        res.json({ success: true, message: 'Availability deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting availability:', error);
        res.status(500).json({ error: 'Failed to delete availability' });
    }
});
exports.default = router;
//# sourceMappingURL=availability.js.map