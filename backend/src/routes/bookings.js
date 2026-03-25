const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};

function generateBookingNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${timestamp}-${random}`;
}

/**
 * Create a new booking
 * POST /api/bookings
 */
router.post('/', async (req, res) => {
    let connection;
    try {
        const { clientId, serviceId, eventDate, eventTime, eventLocation, guestCount, clientNotes } = req.body;

        if (!clientId || !serviceId || !eventDate) {
            return res.status(400).json({ success: false, error: 'Missing required fields: clientId, serviceId, eventDate' });
        }

        connection = await mysql.createConnection(dbConfig);

        // ═══ CHECK AVAILABILITY ═══
        const [availRows] = await connection.execute(
            `SELECT is_available, current_bookings, max_bookings 
             FROM service_availability 
             WHERE service_id = ? AND date = ?`,
            [serviceId, eventDate]
        );

        if (availRows.length > 0) {
            const avail = availRows[0];
            // Blocked by vendor
            if (!avail.is_available) {
                return res.status(409).json({ 
                    success: false, 
                    error: 'This date is not available. The vendor has blocked it.' 
                });
            }
            // Already fully booked
            if (avail.current_bookings >= avail.max_bookings) {
                return res.status(409).json({ 
                    success: false, 
                    error: 'This date is already fully booked.' 
                });
            }
        }

        // Get service details
        const [services] = await connection.execute(
            `SELECT vs.id, vs.name, vs.price, vs.vendor_id 
             FROM vendor_services vs 
             WHERE vs.id = ? AND vs.is_active = 1`,
            [serviceId]
        );

        if (services.length === 0) {
            return res.status(404).json({ success: false, error: 'Service not found or inactive' });
        }

        const service = services[0];

        // Get client details
        const [clients] = await connection.execute(
            `SELECT id, name, email, phone FROM clients WHERE id = ?`,
            [clientId]
        );

        if (clients.length === 0) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }

        const client = clients[0];
        const bookingNumber = generateBookingNumber();
        const totalAmount = Number(service.price);

        // Try extended bookings table first, fallback to basic
        let insertQuery;
        let insertParams;

        try {
            insertQuery = `
                INSERT INTO bookings (
                    booking_number, client_id, client_name, client_email, client_phone,
                    vendor_id, service_id, service_name,
                    event_date, event_time, event_location, guest_count,
                    service_price, total_amount, client_notes, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `;
            insertParams = [
                bookingNumber, clientId, client.name || '', client.email || '', client.phone || '',
                service.vendor_id, serviceId, service.name || '',
                eventDate, eventTime || null, eventLocation || null, guestCount || null,
                totalAmount, totalAmount, clientNotes || null
            ];
            await connection.execute(insertQuery, insertParams);
        } catch (extendedError) {
            // Fallback to basic bookings table
            insertQuery = `
                INSERT INTO bookings (
                    client_id, vendor_id, service_id,
                    event_date, status, total_amount, notes
                ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
            `;
            insertParams = [clientId, service.vendor_id, serviceId, eventDate, totalAmount, clientNotes || null];
            await connection.execute(insertQuery, insertParams);
        }

        // ═══ UPDATE AVAILABILITY — mark date as booked ═══
        try {
            if (availRows.length > 0) {
                // Update existing record
                await connection.execute(
                    `UPDATE service_availability SET current_bookings = current_bookings + 1 WHERE service_id = ? AND date = ?`,
                    [serviceId, eventDate]
                );
            } else {
                // Create new record marked as booked
                await connection.execute(
                    `INSERT INTO service_availability (service_id, date, is_available, current_bookings, max_bookings) 
                     VALUES (?, ?, 1, 1, 1)`,
                    [serviceId, eventDate]
                );
            }
        } catch (availError) {
            console.log('Note: Could not update availability:', availError.message);
        }

        const [result] = await connection.execute('SELECT LAST_INSERT_ID() as id');
        const bookingId = result[0].id;

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: {
                id: bookingId,
                bookingNumber,
                serviceName: service.name,
                servicePrice: totalAmount,
                eventDate,
                eventTime: eventTime || null,
                eventLocation: eventLocation || null,
                status: 'pending',
                vendorId: service.vendor_id,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, error: 'Failed to create booking', details: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * GET /api/bookings/client/:clientId
 */
router.get('/client/:clientId', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [bookings] = await connection.execute(
            `SELECT b.*, v.business_name, v.name as vendor_name
             FROM bookings b LEFT JOIN vendors v ON b.vendor_id = v.id
             WHERE b.client_id = ? ORDER BY b.created_at DESC`,
            [req.params.clientId]
        );
        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * GET /api/bookings/vendor/:vendorId
 */
router.get('/vendor/:vendorId', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [bookings] = await connection.execute(
            `SELECT b.*, c.name as client_name, c.email as client_email, c.phone as client_phone
             FROM bookings b LEFT JOIN clients c ON b.client_id = c.id
             WHERE b.vendor_id = ? ORDER BY b.created_at DESC`,
            [req.params.vendorId]
        );
        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * PUT /api/bookings/:id/status
 */
router.put('/:id/status', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { status, vendorNotes, cancellationReason } = req.body;

        if (!['confirmed', 'cancelled', 'completed', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        connection = await mysql.createConnection(dbConfig);

        // If rejecting/cancelling, free up the availability
        if (status === 'cancelled' || status === 'rejected') {
            try {
                const [bookingRows] = await connection.execute(
                    `SELECT service_id, event_date FROM bookings WHERE id = ?`, [id]
                );
                if (bookingRows.length > 0) {
                    const b = bookingRows[0];
                    await connection.execute(
                        `UPDATE service_availability SET current_bookings = GREATEST(current_bookings - 1, 0) WHERE service_id = ? AND date = ?`,
                        [b.service_id, b.event_date]
                    );
                }
            } catch (e) { /* ignore */ }
        }

        let updateQuery = 'UPDATE bookings SET status = ?';
        let params = [status];

        try {
            if (status === 'confirmed') updateQuery += ', confirmed_at = NOW()';
            else if (status === 'cancelled' || status === 'rejected') {
                updateQuery += ', cancelled_at = NOW()';
                if (cancellationReason) { updateQuery += ', cancellation_reason = ?'; params.push(cancellationReason); }
            }
            else if (status === 'completed') updateQuery += ', completed_at = NOW()';
            if (vendorNotes) { updateQuery += ', vendor_notes = ?'; params.push(vendorNotes); }
        } catch (e) { /* extended columns may not exist */ }

        updateQuery += ', updated_at = NOW() WHERE id = ?';
        params.push(id);
        await connection.execute(updateQuery, params);

        res.json({ success: true, message: `Booking ${status} successfully` });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update booking' });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;