import express from 'express';
import { adminAuthMiddleware } from '../middleware/auth';
import db from '../database';

const router = express.Router();

// Input validation for client actions
const validateClientAction = (req: any, res: any, next: any): void => {
  const { id } = req.params;
  const { notes } = req.body;
  
  if (!id || isNaN(parseInt(id))) {
    res.status(400).json({ error: 'Valid client ID is required' });
    return;
  }
  
  if (notes && typeof notes !== 'string') {
    res.status(400).json({ error: 'Notes must be a string' });
    return;
  }
  
  if (notes && notes.length > 500) {
    res.status(400).json({ error: 'Notes cannot exceed 500 characters' });
    return;
  }
  
  next();
};

// Get all clients with filters
router.get('/admin/clients', adminAuthMiddleware, async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = `
      SELECT 
        id, name, email, phone, created_at, updated_at,
        (SELECT COUNT(*) FROM bookings WHERE client_id = clients.id) as total_bookings,
        (SELECT COUNT(*) FROM reviews WHERE client_id = clients.id) as total_reviews
      FROM clients
    `;
    
    const conditions = [];
    const params = [];
    
    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const clients = await db.query(query, params);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client details with bookings and reviews
router.get('/admin/clients/:id', adminAuthMiddleware, validateClientAction, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get client basic info
    const clients = await db.query(
      'SELECT * FROM clients WHERE id = ?',
      [id]
    );
    
    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Get client bookings
    const bookings = await db.query(`
      SELECT 
        b.*, 
        v.name as vendor_name, 
        v.business_name,
        s.title as service_title,
        s.category
      FROM bookings b
      LEFT JOIN vendors v ON b.vendor_id = v.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.client_id = ?
      ORDER BY b.created_at DESC
    `, [id]);
    
    // Get client reviews
    const reviews = await db.query(`
      SELECT 
        r.*,
        v.name as vendor_name,
        v.business_name,
        s.title as service_title
      FROM reviews r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.client_id = ?
      ORDER BY r.created_at DESC
    `, [id]);
    
    const client = clients[0];
    res.json({
      ...client,
      bookings,
      reviews
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});

// Suspend/Activate client
router.post('/admin/clients/:id/toggle-status', adminAuthMiddleware, validateClientAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'suspend' or 'activate'
    const adminId = req.admin!.id;
    
    if (!['suspend', 'activate'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "suspend" or "activate"' });
    }
    
    // Check if client exists
    const clients = await db.query('SELECT * FROM clients WHERE id = ?', [id]);
    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const newStatus = action === 'suspend' ? 'suspended' : 'active';
    
    // Update client status (assuming we add a status column)
    await db.query(`
      UPDATE clients 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `, [newStatus, id]);
    
    // Log the action (you could create an admin_actions table for this)
    console.info(`Admin ${adminId} ${action}ed client ${id}. Notes: ${notes || 'None'}`);
    
    res.json({ 
      message: `Client ${action}ed successfully`,
      action,
      clientId: id
    });
  } catch (error) {
    console.error(`Error ${req.body.action}ing client:`, error);
    res.status(500).json({ error: `Failed to ${req.body.action} client` });
  }
});

// Delete client (soft delete by marking as deleted)
router.delete('/admin/clients/:id', adminAuthMiddleware, validateClientAction, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.admin!.id;
    
    // Check if client exists
    const clients = await db.query('SELECT * FROM clients WHERE id = ?', [id]);
    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Soft delete - mark as deleted instead of actually deleting
    await db.query(`
      UPDATE clients 
      SET status = 'deleted', updated_at = NOW()
      WHERE id = ?
    `, [id]);
    
    // Log the action
    console.info(`Admin ${adminId} deleted client ${id}. Notes: ${notes || 'None'}`);
    
    res.json({ 
      message: 'Client deleted successfully',
      clientId: id
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Get client statistics
router.get('/admin/clients/stats/overview', adminAuthMiddleware, async (req, res) => {
  try {
    const [
      totalClients,
      activeClients,
      suspendedClients,
      clientsThisMonth,
      topClients
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM clients WHERE status != "deleted"'),
      db.query('SELECT COUNT(*) as count FROM clients WHERE status = "active"'),
      db.query('SELECT COUNT(*) as count FROM clients WHERE status = "suspended"'),
      db.query('SELECT COUNT(*) as count FROM clients WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'),
      db.query(`
        SELECT 
          c.id, c.name, c.email,
          COUNT(b.id) as total_bookings,
          SUM(b.total_amount) as total_spent
        FROM clients c
        LEFT JOIN bookings b ON c.id = b.client_id
        WHERE c.status = 'active'
        GROUP BY c.id
        ORDER BY total_bookings DESC, total_spent DESC
        LIMIT 10
      `)
    ]);
    
    res.json({
      totalClients: totalClients[0].count,
      activeClients: activeClients[0].count,
      suspendedClients: suspendedClients[0].count,
      clientsThisMonth: clientsThisMonth[0].count,
      topClients
    });
  } catch (error) {
    console.error('Error fetching client statistics:', error);
    res.status(500).json({ error: 'Failed to fetch client statistics' });
  }
});

export default router;
