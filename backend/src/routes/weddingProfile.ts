import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace'
};

// Get client's wedding profile
router.get('/client/:clientId', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const clientId = parseInt(req.params.clientId);
    
    const query = `
      SELECT * FROM client_wedding_profiles 
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const [rows] = await connection.execute(query, [clientId]);
    
    if ((rows as any[]).length === 0) {
      await connection.end();
      return res.json(null);
    }
    
    const profile = (rows as any[])[0];
    const weddingProfile = {
      id: profile.id,
      clientId: profile.client_id,
      weddingDate: profile.wedding_date,
      venueLocation: profile.venue_location,
      guestCount: profile.guest_count,
      budgetMin: parseFloat(profile.budget_min) || 0,
      budgetMax: parseFloat(profile.budget_max) || 0,
      preferredStyle: profile.preferred_style,
      colorTheme: profile.color_theme,
      specialRequirements: profile.special_requirements,
      servicesNeeded: profile.services_needed ? JSON.parse(profile.services_needed) : [],
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
    
    await connection.end();
    res.json(weddingProfile);
  } catch (error) {
    console.error('Error fetching wedding profile:', error);
    res.status(500).json({ error: 'Failed to fetch wedding profile' });
  }
});

// Create or update wedding profile
router.post('/save', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const {
      clientId,
      weddingDate,
      venueLocation,
      guestCount,
      budgetMin,
      budgetMax,
      preferredStyle,
      colorTheme,
      specialRequirements,
      servicesNeeded
    } = req.body;
    
    if (!clientId) {
      await connection.end();
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    // Check if profile exists
    const checkQuery = `SELECT id FROM client_wedding_profiles WHERE client_id = ?`;
    const [existing] = await connection.execute(checkQuery, [clientId]);
    
    let query;
    let params;
    
    if ((existing as any[]).length > 0) {
      // Update existing profile
      query = `
        UPDATE client_wedding_profiles 
        SET wedding_date = ?, venue_location = ?, guest_count = ?, 
            budget_min = ?, budget_max = ?, preferred_style = ?, 
            color_theme = ?, special_requirements = ?, services_needed = ?
        WHERE client_id = ?
      `;
      params = [
        weddingDate || null,
        venueLocation || null,
        guestCount || null,
        budgetMin || null,
        budgetMax || null,
        preferredStyle || null,
        colorTheme || null,
        specialRequirements || null,
        servicesNeeded ? JSON.stringify(servicesNeeded) : null,
        clientId
      ];
    } else {
      // Create new profile
      query = `
        INSERT INTO client_wedding_profiles 
        (client_id, wedding_date, venue_location, guest_count, budget_min, 
         budget_max, preferred_style, color_theme, special_requirements, services_needed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        clientId,
        weddingDate || null,
        venueLocation || null,
        guestCount || null,
        budgetMin || null,
        budgetMax || null,
        preferredStyle || null,
        colorTheme || null,
        specialRequirements || null,
        servicesNeeded ? JSON.stringify(servicesNeeded) : null
      ];
    }
    
    await connection.execute(query, params);
    await connection.end();
    
    res.json({ message: 'Wedding profile saved successfully' });
  } catch (error) {
    console.error('Error saving wedding profile:', error);
    res.status(500).json({ error: 'Failed to save wedding profile' });
  }
});

// Get filtered services based on wedding profile
router.get('/recommendations/:clientId', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const clientId = parseInt(req.params.clientId);
    
    // 1. Get client's wedding profile
    const [profileRows] = await connection.execute(
      `SELECT * FROM client_wedding_profiles WHERE client_id = ? ORDER BY created_at DESC LIMIT 1`,
      [clientId]
    );
    
    if ((profileRows as any[]).length === 0) {
      return res.json({ recommendations: [], message: 'No wedding profile found. Save your profile first.' });
    }
    
    const profile = (profileRows as any[])[0];
    const budgetMin = parseFloat(profile.budget_min) || 0;
    const budgetMax = parseFloat(profile.budget_max) || 999999;
    const servicesNeeded: string[] = profile.services_needed ? JSON.parse(profile.services_needed) : [];
    
    // 2. Get already booked service categories for this client
    const [bookedRows] = await connection.execute(
      `SELECT DISTINCT vs.category 
       FROM bookings b 
       JOIN vendor_services vs ON b.service_id = vs.id 
       WHERE b.client_id = ? AND b.status IN ('pending', 'confirmed')`,
      [clientId]
    ) as any;
    const bookedCategories = new Set(bookedRows.map((r: any) => r.category));
    
    // 3. Get incomplete tasks to know what client still needs
    const [taskRows] = await connection.execute(
      `SELECT category FROM wedding_tasks WHERE client_id = ? AND is_completed = 0 AND category IS NOT NULL`,
      [clientId]
    ) as any;
    const neededFromTasks = new Set(taskRows.map((r: any) => r.category));
    
    // 4. Get all active vendors with their services
    const [vendorRows] = await connection.execute(
      `SELECT 
          v.id as vendor_id, v.business_name, v.name as vendor_name, v.category as vendor_category,
          v.rating, v.total_reviews, v.is_verified, v.profile_image, v.city,
          vs.id as service_id, vs.name as service_name, vs.description as service_description,
          vs.price, vs.category as service_category,
          (SELECT file_path FROM service_images si WHERE si.service_id = vs.id ORDER BY si.is_primary DESC LIMIT 1) as service_image
       FROM vendors v
       JOIN vendor_services vs ON vs.vendor_id = v.id
       WHERE vs.is_active = 1 AND (v.status = 'approved' OR v.status IS NULL)
       ORDER BY v.rating DESC`
    );
    
    // 5. SCORING ALGORITHM - Calculate a score for each vendor/service
    const scored = (vendorRows as any[]).map(row => {
      let score = 0;
      let reasons: string[] = [];
      const price = parseFloat(row.price) || 0;
      const rating = parseFloat(row.rating) || 0;
      const reviews = parseInt(row.total_reviews) || 0;
      const category = row.service_category || row.vendor_category;
      
      // A) Category Match (0-30 points)
      // Is this a category the client selected they need?
      if (servicesNeeded.includes(category)) {
        score += 25;
        reasons.push('Matches your needed services');
      }
      // Is this related to an incomplete task?
      if (neededFromTasks.has(category)) {
        score += 5;
        reasons.push('Related to your checklist');
      }
      
      // B) NOT already booked (0-20 points)
      // Prioritize categories client hasn't booked yet
      if (!bookedCategories.has(category)) {
        score += 20;
        reasons.push('You haven\'t booked this yet');
      } else {
        score -= 10; // Deprioritize already-booked categories
      }
      
      // C) Budget Fit (0-25 points)
      if (price >= budgetMin && price <= budgetMax) {
        score += 15;
        // Bonus: closer to budget middle = better value perception
        const budgetMid = (budgetMin + budgetMax) / 2;
        const budgetRange = budgetMax - budgetMin;
        if (budgetRange > 0) {
          const distanceFromMid = Math.abs(price - budgetMid) / budgetRange;
          score += Math.round((1 - distanceFromMid) * 10); // 0-10 bonus
        }
        reasons.push('Within your budget');
      } else if (price < budgetMin) {
        score += 5; // Cheaper is still okay
        reasons.push('Below your budget');
      }
      // Over budget = no bonus
      
      // D) Rating & Popularity (0-15 points)
      if (rating >= 4.5) {
        score += 15;
        reasons.push('Highly rated');
      } else if (rating >= 4.0) {
        score += 10;
        reasons.push('Well rated');
      } else if (rating >= 3.0) {
        score += 5;
      }
      
      // E) Review count trust (0-5 points)
      if (reviews >= 10) score += 5;
      else if (reviews >= 5) score += 3;
      else if (reviews >= 1) score += 1;
      
      // F) Verified vendor bonus (0-5 points)
      if (row.is_verified) {
        score += 5;
        reasons.push('Verified vendor');
      }
      
      return {
        vendorId: row.vendor_id,
        businessName: row.business_name || row.vendor_name,
        vendorCategory: row.vendor_category,
        profileImage: row.profile_image,
        city: row.city,
        rating,
        totalReviews: reviews,
        isVerified: Boolean(row.is_verified),
        serviceId: row.service_id,
        serviceName: row.service_name,
        serviceDescription: row.service_description,
        serviceCategory: category,
        serviceImage: row.service_image,
        price,
        score,
        reasons: [...new Set(reasons)], // unique reasons
        matchType: score >= 50 ? 'excellent' : score >= 30 ? 'good' : 'fair'
      };
    });
    
    // 6. Sort by score descending, take top results
    scored.sort((a, b) => b.score - a.score);
    
    // 7. Group by category for better UX
    const categoryGroups: Record<string, any[]> = {};
    for (const item of scored) {
      if (!categoryGroups[item.serviceCategory]) {
        categoryGroups[item.serviceCategory] = [];
      }
      if (categoryGroups[item.serviceCategory].length < 3) { // max 3 per category
        categoryGroups[item.serviceCategory].push(item);
      }
    }
    
    // 8. Build response with category-wise recommendations
    const neededCategories = servicesNeeded.length > 0 ? servicesNeeded : [...new Set(scored.map(s => s.serviceCategory))];
    const grouped = neededCategories.map(cat => ({
      category: cat,
      isBooked: bookedCategories.has(cat),
      vendors: categoryGroups[cat] || []
    })).filter(g => g.vendors.length > 0);
    
    // Sort: unbooked categories first
    grouped.sort((a, b) => {
      if (a.isBooked && !b.isBooked) return 1;
      if (!a.isBooked && b.isBooked) return -1;
      return 0;
    });
    
    res.json({
      recommendations: grouped,
      topPicks: scored.slice(0, 6), // top 6 overall
      stats: {
        totalFound: scored.length,
        categoriesNeeded: servicesNeeded.length,
        categoriesBooked: bookedCategories.size,
        budgetRange: `€${budgetMin} - €${budgetMax}`
      }
    });
    
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  } finally {
    if (connection) await connection.end();
  }
});

// ═══════════════════════════════════════
// WEDDING TASKS
// ═══════════════════════════════════════

// Get all tasks for a client
router.get('/tasks/:clientId', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const clientId = parseInt(req.params.clientId);

    const [tasks] = await connection.execute(
      `SELECT * FROM wedding_tasks WHERE client_id = ? ORDER BY sort_order ASC, due_date ASC, created_at ASC`,
      [clientId]
    );

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  } finally {
    if (connection) await connection.end();
  }
});

// Add a new task
router.post('/tasks', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { clientId, title, description, category, dueDate, priority } = req.body;

    if (!clientId || !title) {
      return res.status(400).json({ error: 'clientId and title are required' });
    }

    const [result]: any = await connection.execute(
      `INSERT INTO wedding_tasks (client_id, title, description, category, due_date, priority) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clientId, title, description || null, category || null, dueDate || null, priority || 'medium']
    );

    res.status(201).json({ success: true, id: result.insertId, message: 'Task added' });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add task' });
  } finally {
    if (connection) await connection.end();
  }
});

// Toggle task completion
router.put('/tasks/:taskId/toggle', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const taskId = parseInt(req.params.taskId);

    await connection.execute(
      `UPDATE wedding_tasks SET is_completed = NOT is_completed, updated_at = NOW() WHERE id = ?`,
      [taskId]
    );

    res.json({ success: true, message: 'Task toggled' });
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ error: 'Failed to toggle task' });
  } finally {
    if (connection) await connection.end();
  }
});

// Update a task
router.put('/tasks/:taskId', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const taskId = parseInt(req.params.taskId);
    const { title, description, category, dueDate, priority } = req.body;

    await connection.execute(
      `UPDATE wedding_tasks SET title = ?, description = ?, category = ?, due_date = ?, priority = ?, updated_at = NOW() WHERE id = ?`,
      [title, description || null, category || null, dueDate || null, priority || 'medium', taskId]
    );

    res.json({ success: true, message: 'Task updated' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  } finally {
    if (connection) await connection.end();
  }
});

// Delete a task
router.delete('/tasks/:taskId', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const taskId = parseInt(req.params.taskId);

    await connection.execute(`DELETE FROM wedding_tasks WHERE id = ?`, [taskId]);

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  } finally {
    if (connection) await connection.end();
  }
});

// Add default tasks for new wedding profile
router.post('/tasks/defaults', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { clientId } = req.body;

    if (!clientId) return res.status(400).json({ error: 'clientId required' });

    // Check if tasks already exist
    const [existing]: any = await connection.execute(
      `SELECT COUNT(*) as count FROM wedding_tasks WHERE client_id = ?`, [clientId]
    );
    if (existing[0].count > 0) {
      return res.json({ message: 'Tasks already exist', skipped: true });
    }

    const defaultTasks = [
      { title: 'Set wedding budget', category: 'Planning', priority: 'high', order: 1 },
      { title: 'Choose wedding date', category: 'Planning', priority: 'high', order: 2 },
      { title: 'Book venue', category: 'Venues', priority: 'high', order: 3 },
      { title: 'Hire photographer', category: 'Photography', priority: 'high', order: 4 },
      { title: 'Hire videographer', category: 'Videography', priority: 'medium', order: 5 },
      { title: 'Book florist', category: 'Floristry', priority: 'medium', order: 6 },
      { title: 'Book catering / cake', category: 'Cake & Sweets', priority: 'medium', order: 7 },
      { title: 'Book entertainment / music', category: 'Entertainment', priority: 'medium', order: 8 },
      { title: 'Book makeup & hair stylist', category: 'Beauty', priority: 'medium', order: 9 },
      { title: 'Send invitations', category: 'Planning', priority: 'medium', order: 10 },
      { title: 'Plan honeymoon', category: 'Planning', priority: 'low', order: 11 },
      { title: 'Arrange transportation', category: 'Car Rental', priority: 'low', order: 12 },
    ];

    for (const task of defaultTasks) {
      await connection.execute(
        `INSERT INTO wedding_tasks (client_id, title, category, priority, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [clientId, task.title, task.category, task.priority, task.order]
      );
    }

    res.status(201).json({ success: true, message: 'Default tasks created', count: defaultTasks.length });
  } catch (error) {
    console.error('Error creating default tasks:', error);
    res.status(500).json({ error: 'Failed to create default tasks' });
  } finally {
    if (connection) await connection.end();
  }
});

// ═══════════════════════════════════════
// BOOKED VENDORS for wedding profile
// ═══════════════════════════════════════

router.get('/booked-vendors/:clientId', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const clientId = parseInt(req.params.clientId);

    const [vendors] = await connection.execute(
      `SELECT 
          b.id as booking_id, b.status as booking_status, b.event_date,
          b.total_amount, b.created_at as booked_at,
          v.id as vendor_id, v.business_name, v.name as vendor_name,
          v.category, v.phone, v.email, v.profile_image, v.rating,
          vs.name as service_name, vs.price as service_price
       FROM bookings b
       JOIN vendors v ON b.vendor_id = v.id
       LEFT JOIN vendor_services vs ON b.service_id = vs.id
       WHERE b.client_id = ? AND b.status IN ('pending', 'confirmed')
       ORDER BY b.event_date ASC`,
      [clientId]
    );

    res.json(vendors);
  } catch (error) {
    console.error('Error fetching booked vendors:', error);
    res.status(500).json({ error: 'Failed to fetch booked vendors' });
  } finally {
    if (connection) await connection.end();
  }
});

// ═══════════════════════════════════════
// VENDOR: View client wedding profile (if they have a booking)
// ═══════════════════════════════════════

router.get('/vendor-view/:vendorId/:clientId', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const vendorId = parseInt(req.params.vendorId);
    const clientId = parseInt(req.params.clientId);

    // Verify vendor has a booking with this client
    const [bookings] = await connection.execute(
      `SELECT id FROM bookings WHERE vendor_id = ? AND client_id = ? LIMIT 1`,
      [vendorId, clientId]
    );

    if ((bookings as any[]).length === 0) {
      return res.status(403).json({ error: 'No booking exists between you and this client' });
    }

    // Get client info
    const [clients] = await connection.execute(
      `SELECT id, name, email, phone FROM clients WHERE id = ?`,
      [clientId]
    );

    // Get wedding profile
    const [profiles] = await connection.execute(
      `SELECT * FROM client_wedding_profiles WHERE client_id = ? ORDER BY created_at DESC LIMIT 1`,
      [clientId]
    );

    // Get tasks summary
    const [taskStats] = await connection.execute(
      `SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_tasks
       FROM wedding_tasks WHERE client_id = ?`,
      [clientId]
    );

    // Get all vendors booked by this client
    const [bookedVendors] = await connection.execute(
      `SELECT 
          v.business_name, v.category, b.status as booking_status, b.total_amount
       FROM bookings b
       JOIN vendors v ON b.vendor_id = v.id
       WHERE b.client_id = ? AND b.status IN ('pending', 'confirmed')
       ORDER BY b.created_at DESC`,
      [clientId]
    );

    const client = (clients as any[])[0] || null;
    const profile = (profiles as any[])[0] || null;
    const stats = (taskStats as any[])[0] || { total_tasks: 0, completed_tasks: 0 };

    res.json({
      client: client ? {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone
      } : null,
      weddingProfile: profile ? {
        weddingDate: profile.wedding_date,
        venueLocation: profile.venue_location,
        guestCount: profile.guest_count,
        budgetMin: parseFloat(profile.budget_min) || 0,
        budgetMax: parseFloat(profile.budget_max) || 0,
        preferredStyle: profile.preferred_style,
        colorTheme: profile.color_theme,
        specialRequirements: profile.special_requirements,
        servicesNeeded: profile.services_needed ? JSON.parse(profile.services_needed) : []
      } : null,
      taskProgress: {
        total: parseInt(stats.total_tasks) || 0,
        completed: parseInt(stats.completed_tasks) || 0
      },
      bookedVendors: (bookedVendors as any[]).map(v => ({
        businessName: v.business_name,
        category: v.category,
        status: v.booking_status,
        amount: parseFloat(v.total_amount) || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching client wedding profile for vendor:', error);
    res.status(500).json({ error: 'Failed to fetch client profile' });
  } finally {
    if (connection) await connection.end();
  }
});

export default router;