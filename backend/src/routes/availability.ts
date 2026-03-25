import express from 'express';
import mysql from 'mysql2/promise';
import { vendorAuthMiddleware } from '../middleware/auth';

const router = express.Router();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace'
};

// Helper: convert DB row (is_available boolean) to frontend format (status string)
function toStatus(row: any): string {
  if (row.current_bookings > 0) return 'booked';
  return row.is_available ? 'available' : 'blocked';
}

// Helper: convert frontend status to DB is_available
function toIsAvailable(status: string): boolean {
  return status === 'available';
}

// Get availability for a service
router.get('/service/:serviceId', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const serviceId = parseInt(req.params.serviceId);

    const [rows] = await connection.execute(
      `SELECT id, service_id, date, is_available, max_bookings, current_bookings, notes
       FROM service_availability 
       WHERE service_id = ? 
       ORDER BY date ASC`,
      [serviceId]
    );

    const result = (rows as any[]).map(row => ({
      id: row.id,
      service_id: row.service_id,
      date: row.date,
      status: toStatus(row),
      notes: row.notes
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  } finally {
    if (connection) await connection.end();
  }
});

// Get availability for all vendor services
router.get('/vendor', vendorAuthMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const vendorId = req.vendor!.id;

    const [rows] = await connection.execute(
      `SELECT sa.id, sa.service_id, sa.date, sa.is_available, sa.current_bookings, sa.notes,
              vs.name as service_name
       FROM service_availability sa
       JOIN vendor_services vs ON sa.service_id = vs.id
       WHERE vs.vendor_id = ?
       ORDER BY sa.date ASC`,
      [vendorId]
    );

    const result = (rows as any[]).map(row => ({
      id: row.id,
      service_id: row.service_id,
      date: row.date,
      status: toStatus(row),
      service_name: row.service_name,
      notes: row.notes
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching vendor availability:', error);
    res.status(500).json({ error: 'Failed to fetch vendor availability' });
  } finally {
    if (connection) await connection.end();
  }
});

// Set availability for a service (single date)
router.post('/service/:serviceId', vendorAuthMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const serviceId = parseInt(req.params.serviceId);
    const { date, status } = req.body;
    const vendorId = req.vendor!.id;

    // Verify service belongs to vendor
    const [serviceRows] = await connection.execute(
      `SELECT id FROM vendor_services WHERE id = ? AND vendor_id = ?`,
      [serviceId, vendorId]
    );

    if ((serviceRows as any[]).length === 0) {
      return res.status(403).json({ error: 'Service not found or access denied' });
    }

    const isAvailable = toIsAvailable(status);

    await connection.execute(
      `INSERT INTO service_availability (service_id, date, is_available) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)`,
      [serviceId, date, isAvailable ? 1 : 0]
    );

    res.json({ success: true, message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  } finally {
    if (connection) await connection.end();
  }
});

// Bulk update availability
router.post('/service/:serviceId/bulk', vendorAuthMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const serviceId = parseInt(req.params.serviceId);
    const { dates, status } = req.body;
    const vendorId = req.vendor!.id;

    const [serviceRows] = await connection.execute(
      `SELECT id FROM vendor_services WHERE id = ? AND vendor_id = ?`,
      [serviceId, vendorId]
    );

    if ((serviceRows as any[]).length === 0) {
      return res.status(403).json({ error: 'Service not found or access denied' });
    }

    const isAvailable = toIsAvailable(status);

    for (const date of dates) {
      await connection.execute(
        `INSERT INTO service_availability (service_id, date, is_available) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)`,
        [serviceId, date, isAvailable ? 1 : 0]
      );
    }

    res.json({ success: true, message: `Updated availability for ${dates.length} dates` });
  } catch (error) {
    console.error('Error bulk updating availability:', error);
    res.status(500).json({ error: 'Failed to bulk update availability' });
  } finally {
    if (connection) await connection.end();
  }
});

// Delete availability for a specific date
router.delete('/service/:serviceId/:date', vendorAuthMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const serviceId = parseInt(req.params.serviceId);
    const date = req.params.date;
    const vendorId = req.vendor!.id;

    const [serviceRows] = await connection.execute(
      `SELECT id FROM vendor_services WHERE id = ? AND vendor_id = ?`,
      [serviceId, vendorId]
    );

    if ((serviceRows as any[]).length === 0) {
      return res.status(403).json({ error: 'Service not found or access denied' });
    }

    await connection.execute(
      `DELETE FROM service_availability WHERE service_id = ? AND date = ?`,
      [serviceId, date]
    );

    res.json({ success: true, message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ error: 'Failed to delete availability' });
  } finally {
    if (connection) await connection.end();
  }
});

export default router;