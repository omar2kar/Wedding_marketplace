const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};

// Generate unique booking number
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

        // Validation
        if (!clientId || !serviceId || !eventDate) {
            return res.status(400).json({ success: false, error: 'Missing required fields: clientId, serviceId, eventDate' });
        }

        connection = await mysql.createConnection(dbConfig);

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

        // Check if bookings table has extended columns
        let insertQuery;
        let insertParams;

        try {
            // Try extended bookings table first
            insertQuery = `
                INSERT INTO bookings (
                    booking_number, client_id, client_name, client_email, client_phone,
                    vendor_id, service_id, service_name,
                    event_date, event_time, event_location, guest_count,
                    service_price, total_amount, client_notes, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `;
            insertParams = [
                bookingNumber,
                clientId,
                client.name || '',
                client.email || '',
                client.phone || '',
                service.vendor_id,
                serviceId,
                service.name || '',
                eventDate,
                eventTime || null,
                eventLocation || null,
                guestCount || null,
                totalAmount,
                totalAmount,
                clientNotes || null
            ];

            await connection.execute(insertQuery, insertParams);
        } catch (extendedError) {
            console.log('Extended bookings table not available, trying basic table:', extendedError.message);
            
            // Fallback to basic bookings table
            insertQuery = `
                INSERT INTO bookings (
                    client_id, vendor_id, service_id,
                    event_date, status, total_amount, notes
                ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
            `;
            insertParams = [
                clientId,
                service.vendor_id,
                serviceId,
                eventDate,
                totalAmount,
                clientNotes || null
            ];

            await connection.execute(insertQuery, insertParams);
        }

        // Get the inserted booking ID
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
 * Get bookings for a client
 * GET /api/bookings/client/:clientId
 */
router.get('/client/:clientId', async (req, res) => {
    let connection;
    try {
        const { clientId } = req.params;
        connection = await mysql.createConnection(dbConfig);

        const [bookings] = await connection.execute(
            `SELECT b.*, v.business_name, v.name as vendor_name
             FROM bookings b
             LEFT JOIN vendors v ON b.vendor_id = v.id
             WHERE b.client_id = ?
             ORDER BY b.created_at DESC`,
            [clientId]
        );

        res.json({ success: true, bookings });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get bookings for a vendor
 * GET /api/bookings/vendor/:vendorId
 */
router.get('/vendor/:vendorId', async (req, res) => {
    let connection;
    try {
        const { vendorId } = req.params;
        connection = await mysql.createConnection(dbConfig);

        const [bookings] = await connection.execute(
            `SELECT b.*, c.name as client_name, c.email as client_email, c.phone as client_phone
             FROM bookings b
             LEFT JOIN clients c ON b.client_id = c.id
             WHERE b.vendor_id = ?
             ORDER BY b.created_at DESC`,
            [vendorId]
        );

        res.json({ success: true, bookings });

    } catch (error) {
        console.error('Error fetching vendor bookings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Update booking status
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

        let updateQuery = 'UPDATE bookings SET status = ?';
        let params = [status];

        // Try to update extended fields
        try {
            if (status === 'confirmed') {
                updateQuery += ', confirmed_at = NOW()';
            } else if (status === 'cancelled' || status === 'rejected') {
                updateQuery += ', cancelled_at = NOW()';
                if (cancellationReason) {
                    updateQuery += ', cancellation_reason = ?';
                    params.push(cancellationReason);
                }
            } else if (status === 'completed') {
                updateQuery += ', completed_at = NOW()';
            }
            if (vendorNotes) {
                updateQuery += ', vendor_notes = ?';
                params.push(vendorNotes);
            }
        } catch (e) {
            // Extended columns may not exist
        }

        updateQuery += ', updated_at = NOW() WHERE id = ?';
        params.push(id);

        await connection.execute(updateQuery, params);

        res.json({ success: true, message: `Booking ${status} successfully` });

    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, error: 'Failed to update booking' });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;