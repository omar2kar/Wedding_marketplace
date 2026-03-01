const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wedding_marketplace'
};

// Middleware to verify client authentication
const authenticateClient = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // For now, mock the authentication - in production, verify JWT token
    req.clientId = parseInt(req.headers['client-id']) || 1;
    next();
};

// Middleware to verify vendor authentication
const authenticateVendor = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // For now, mock the authentication - in production, verify JWT token
    req.vendorId = parseInt(req.headers['vendor-id']) || 1;
    next();
};

/**
 * Start a new conversation or get existing one
 * POST /api/messages/conversation
 * Body: { clientId, vendorId }
 */
router.post('/conversation', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { clientId, vendorId } = req.body;

        // Check if conversation already exists
        const [existing] = await connection.execute(
            'SELECT * FROM conversations WHERE client_id = ? AND vendor_id = ?',
            [clientId, vendorId]
        );

        if (existing.length > 0) {
            return res.json({
                success: true,
                conversation: existing[0],
                isNew: false
            });
        }

        // Create new conversation
        const [result] = await connection.execute(
            `INSERT INTO conversations (client_id, vendor_id, status, created_at) 
             VALUES (?, ?, 'active', NOW())`,
            [clientId, vendorId]
        );

        const [newConversation] = await connection.execute(
            'SELECT * FROM conversations WHERE id = ?',
            [result.insertId]
        );

        res.json({
            success: true,
            conversation: newConversation[0],
            isNew: true
        });

    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create conversation'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get conversations for a client
 * GET /api/messages/client/:clientId/conversations
 */
router.get('/client/:clientId/conversations', authenticateClient, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { clientId } = req.params;

        const [conversations] = await connection.execute(
            `SELECT 
                c.*,
                v.business_name as vendor_name,
                v.category as vendor_category,
                v.profile_image as vendor_image,
                (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
             FROM conversations c
             INNER JOIN vendors v ON c.vendor_id = v.id
             WHERE c.client_id = ?
             ORDER BY c.last_message_at DESC`,
            [clientId]
        );

        res.json({
            success: true,
            conversations
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch conversations'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get conversations for a vendor
 * GET /api/messages/vendor/:vendorId/conversations
 */
router.get('/vendor/:vendorId/conversations', authenticateVendor, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { vendorId } = req.params;

        const [conversations] = await connection.execute(
            `SELECT 
                c.*,
                cl.name as client_name,
                cl.email as client_email,
                cl.phone as client_phone,
                (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
             FROM conversations c
             INNER JOIN clients cl ON c.client_id = cl.id
             WHERE c.vendor_id = ?
             ORDER BY c.last_message_at DESC`,
            [vendorId]
        );

        res.json({
            success: true,
            conversations
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch conversations'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get messages in a conversation
 * GET /api/messages/conversation/:conversationId/messages
 */
router.get('/conversation/:conversationId/messages', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { conversationId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const [messages] = await connection.execute(
            `SELECT 
                m.*,
                CASE 
                    WHEN m.sender_type = 'client' THEN (SELECT name FROM clients WHERE id = m.sender_id)
                    WHEN m.sender_type = 'vendor' THEN (SELECT business_name FROM vendors WHERE id = m.sender_id)
                END as sender_name
             FROM messages m
             WHERE m.conversation_id = ?
             ORDER BY m.created_at DESC
             LIMIT ? OFFSET ?`,
            [conversationId, parseInt(limit), parseInt(offset)]
        );

        // Mark messages as read based on who's requesting
        const userType = req.headers['user-type']; // 'client' or 'vendor'
        if (userType) {
            await connection.execute(
                `UPDATE messages 
                 SET is_read = TRUE 
                 WHERE conversation_id = ? AND sender_type != ? AND is_read = FALSE`,
                [conversationId, userType]
            );

            // Update unread count in conversation
            const unreadColumn = userType === 'client' ? 'client_unread_count' : 'vendor_unread_count';
            await connection.execute(
                `UPDATE conversations SET ${unreadColumn} = 0 WHERE id = ?`,
                [conversationId]
            );
        }

        res.json({
            success: true,
            messages: messages.reverse() // Return in chronological order
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Send a message
 * POST /api/messages/send
 * Body: { conversationId, senderType, senderId, message, attachmentUrl }
 */
router.post('/send', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { conversationId, senderType, senderId, message, attachmentUrl } = req.body;

        // Validate conversation exists
        const [conversation] = await connection.execute(
            'SELECT * FROM conversations WHERE id = ?',
            [conversationId]
        );

        if (conversation.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        // Insert message
        const [result] = await connection.execute(
            `INSERT INTO messages (conversation_id, sender_type, sender_id, message, attachment_url, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [conversationId, senderType, senderId, message, attachmentUrl || null]
        );

        // Update conversation last message time and unread counts
        const unreadColumn = senderType === 'client' ? 'vendor_unread_count' : 'client_unread_count';
        await connection.execute(
            `UPDATE conversations 
             SET last_message_at = NOW(), 
                 ${unreadColumn} = ${unreadColumn} + 1
             WHERE id = ?`,
            [conversationId]
        );

        // Get the created message with sender name
        const [newMessage] = await connection.execute(
            `SELECT 
                m.*,
                CASE 
                    WHEN m.sender_type = 'client' THEN (SELECT name FROM clients WHERE id = m.sender_id)
                    WHEN m.sender_type = 'vendor' THEN (SELECT business_name FROM vendors WHERE id = m.sender_id)
                END as sender_name
             FROM messages m
             WHERE m.id = ?`,
            [result.insertId]
        );

        // Create notification for recipient
        const recipientType = senderType === 'client' ? 'vendor' : 'client';
        const recipientId = senderType === 'client' ? conversation[0].vendor_id : conversation[0].client_id;
        
        await connection.execute(
            `INSERT INTO notifications (user_type, user_id, title, message, type, action_url, created_at)
             VALUES (?, ?, ?, ?, 'message', ?, NOW())`,
            [
                recipientType,
                recipientId,
                'رسالة جديدة',
                `لديك رسالة جديدة من ${newMessage[0].sender_name}`,
                `/messages/${conversationId}`
            ]
        );

        res.json({
            success: true,
            message: newMessage[0]
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Mark messages as read
 * PUT /api/messages/conversation/:conversationId/read
 */
router.put('/conversation/:conversationId/read', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { conversationId } = req.params;
        const { userType } = req.body; // 'client' or 'vendor'

        // Mark all messages from the other party as read
        await connection.execute(
            `UPDATE messages 
             SET is_read = TRUE, read_at = NOW()
             WHERE conversation_id = ? AND sender_type != ? AND is_read = FALSE`,
            [conversationId, userType]
        );

        // Reset unread count
        const unreadColumn = userType === 'client' ? 'client_unread_count' : 'vendor_unread_count';
        await connection.execute(
            `UPDATE conversations SET ${unreadColumn} = 0 WHERE id = ?`,
            [conversationId]
        );

        res.json({
            success: true,
            message: 'Messages marked as read'
        });

    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark messages as read'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Get unread message count
 * GET /api/messages/:userType/:userId/unread-count
 */
router.get('/:userType/:userId/unread-count', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { userType, userId } = req.params;

        let query;
        if (userType === 'client') {
            query = `
                SELECT SUM(client_unread_count) as total_unread
                FROM conversations
                WHERE client_id = ?
            `;
        } else {
            query = `
                SELECT SUM(vendor_unread_count) as total_unread
                FROM conversations
                WHERE vendor_id = ?
            `;
        }

        const [result] = await connection.execute(query, [userId]);

        res.json({
            success: true,
            unreadCount: result[0].total_unread || 0
        });

    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get unread count'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * Block/unblock conversation
 * PUT /api/messages/conversation/:conversationId/block
 */
router.put('/conversation/:conversationId/block', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const { conversationId } = req.params;
        const { block } = req.body; // true to block, false to unblock

        await connection.execute(
            `UPDATE conversations 
             SET status = ?
             WHERE id = ?`,
            [block ? 'blocked' : 'active', conversationId]
        );

        res.json({
            success: true,
            message: block ? 'Conversation blocked' : 'Conversation unblocked'
        });

    } catch (error) {
        console.error('Error blocking conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update conversation status'
        });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;
