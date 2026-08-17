import express from 'express';
import db from '../database';

const router = express.Router();

/**
 * Safely parse an integer route/body value.
 */
const parseClientId = (value: unknown): number | null => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

/**
 * Safely parse services_needed.
 * Database can contain:
 * - NULL
 * - JSON string
 * - already parsed array
 * - invalid JSON
 */
const parseServices = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch (error) {
    console.warn('⚠️ Invalid services_needed JSON:', value);
    return [];
  }
};

/**
 * Safely convert value to number.
 */
const toNumber = (value: unknown, fallback = 0): number => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

/**
 * Normalize a wedding profile row for frontend.
 */
const formatWeddingProfile = (profile: any) => ({
  id: profile.id,
  clientId: profile.client_id,
  weddingDate: profile.wedding_date,
  venueLocation: profile.venue_location,
  guestCount: profile.guest_count,
  budgetMin: toNumber(profile.budget_min),
  budgetMax: toNumber(profile.budget_max),
  preferredStyle: profile.preferred_style,
  colorTheme: profile.color_theme,
  specialRequirements: profile.special_requirements,
  servicesNeeded: parseServices(profile.services_needed),
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});


/* =========================================================
   WEDDING PROFILE
   ========================================================= */


/**
 * GET /api/wedding-profile/client/:clientId
 */
router.get('/client/:clientId', async (req, res) => {
  try {
    const clientId = parseClientId(req.params.clientId);

    if (!clientId) {
      return res.status(400).json({
        error: 'Invalid client ID'
      });
    }

    const rows = await db.query(
      `
        SELECT *
        FROM client_wedding_profiles
        WHERE client_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [clientId]
    );

    const profiles = Array.isArray(rows) ? rows : [];

    /**
     * New client without a wedding profile.
     * This is a valid state, not an error.
     */
    if (profiles.length === 0) {
      return res.json(null);
    }

    return res.json(formatWeddingProfile(profiles[0]));
  } catch (error: any) {
    console.error('❌ Error fetching wedding profile:', error);

    return res.status(500).json({
      error: 'Failed to fetch wedding profile',
      details: error?.message || String(error),
      code: error?.code || null,
      sqlMessage: error?.sqlMessage || null
    });
  }
});


/**
 * POST /api/wedding-profile/save
 *
 * Create or update wedding profile.
 */
router.post('/save', async (req, res) => {
  try {
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
    } = req.body || {};

    const parsedClientId = parseClientId(clientId);

    if (!parsedClientId) {
      return res.status(400).json({
        error: 'Valid client ID is required'
      });
    }

    const normalizedServices = Array.isArray(servicesNeeded)
      ? servicesNeeded
      : [];

    /**
     * Check existing profile.
     */
    const existing = await db.query(
      `
        SELECT id
        FROM client_wedding_profiles
        WHERE client_id = ?
        LIMIT 1
      `,
      [parsedClientId]
    );

    const existingRows = Array.isArray(existing) ? existing : [];

    const params = [
      weddingDate || null,
      venueLocation || null,
      guestCount === '' || guestCount === undefined
        ? null
        : guestCount,
      budgetMin === '' || budgetMin === undefined
        ? null
        : budgetMin,
      budgetMax === '' || budgetMax === undefined
        ? null
        : budgetMax,
      preferredStyle || null,
      colorTheme || null,
      specialRequirements || null,
      JSON.stringify(normalizedServices)
    ];

    if (existingRows.length > 0) {
      /**
       * UPDATE
       */
      await db.query(
        `
          UPDATE client_wedding_profiles
          SET
            wedding_date = ?,
            venue_location = ?,
            guest_count = ?,
            budget_min = ?,
            budget_max = ?,
            preferred_style = ?,
            color_theme = ?,
            special_requirements = ?,
            services_needed = ?
          WHERE client_id = ?
        `,
        [
          ...params,
          parsedClientId
        ]
      );

      return res.json({
        success: true,
        message: 'Wedding profile updated successfully'
      });
    }

    /**
     * INSERT
     */
    await db.query(
      `
        INSERT INTO client_wedding_profiles
        (
          client_id,
          wedding_date,
          venue_location,
          guest_count,
          budget_min,
          budget_max,
          preferred_style,
          color_theme,
          special_requirements,
          services_needed
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        parsedClientId,
        ...params
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Wedding profile created successfully'
    });
  } catch (error: any) {
    console.error('❌ Error saving wedding profile:', error);

    return res.status(500).json({
      error: 'Failed to save wedding profile',
      details: error?.message || String(error),
      code: error?.code || null,
      sqlMessage: error?.sqlMessage || null
    });
  }
});


/* =========================================================
   RECOMMENDATIONS
   ========================================================= */


/**
 * GET /api/wedding-profile/recommendations/:clientId
 */
router.get('/recommendations/:clientId', async (req, res) => {
  try {
    const clientId = parseClientId(req.params.clientId);

    if (!clientId) {
      return res.status(400).json({
        error: 'Invalid client ID'
      });
    }

    /**
     * 1. Get wedding profile
     */
    const profileRows = await db.query(
      `
        SELECT *
        FROM client_wedding_profiles
        WHERE client_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [clientId]
    );

    const profiles = Array.isArray(profileRows)
      ? profileRows
      : [];

    if (profiles.length === 0) {
      return res.json({
        recommendations: [],
        topPicks: [],
        stats: {
          totalFound: 0,
          categoriesNeeded: 0,
          categoriesBooked: 0,
          budgetRange: '€0 - €0'
        },
        message: 'No wedding profile found. Save your profile first.'
      });
    }

    const profile = profiles[0];

    const budgetMin = toNumber(profile.budget_min, 0);
    const budgetMax = toNumber(profile.budget_max, 999999);

    const servicesNeeded = parseServices(
      profile.services_needed
    );

    /**
     * 2. Get booked categories
     */
    const bookedRowsResult = await db.query(
      `
        SELECT DISTINCT vs.category
        FROM bookings b
        JOIN vendor_services vs
          ON b.service_id = vs.id
        WHERE
          b.client_id = ?
          AND b.status IN ('pending', 'confirmed')
      `,
      [clientId]
    );

    const bookedRows = Array.isArray(bookedRowsResult)
      ? bookedRowsResult
      : [];

    const bookedCategories = new Set(
      bookedRows
        .map((row: any) => row.category)
        .filter(Boolean)
    );

    /**
     * 3. Incomplete wedding tasks
     */
    const taskRowsResult = await db.query(
      `
        SELECT category
        FROM wedding_tasks
        WHERE
          client_id = ?
          AND is_completed = 0
          AND category IS NOT NULL
      `,
      [clientId]
    );

    const taskRows = Array.isArray(taskRowsResult)
      ? taskRowsResult
      : [];

    const neededFromTasks = new Set(
      taskRows
        .map((row: any) => row.category)
        .filter(Boolean)
    );

    /**
     * 4. Get active vendors/services
     */
    const vendorRowsResult = await db.query(
      `
        SELECT
          v.id AS vendor_id,
          v.business_name,
          v.name AS vendor_name,
          v.category AS vendor_category,
          v.rating,
          v.total_reviews,
          v.is_verified,
          v.profile_image,
          v.city,

          vs.id AS service_id,
          vs.name AS service_name,
          vs.description AS service_description,
          vs.price,
          vs.category AS service_category,

          (
            SELECT file_path
            FROM service_images si
            WHERE si.service_id = vs.id
            ORDER BY si.is_primary DESC
            LIMIT 1
          ) AS service_image

        FROM vendors v
        JOIN vendor_services vs
          ON vs.vendor_id = v.id

        WHERE
          vs.is_active = 1
          AND (v.status = 'approved' OR v.status IS NULL)

        ORDER BY v.rating DESC
      `
    );

    const vendorRows = Array.isArray(vendorRowsResult)
      ? vendorRowsResult
      : [];

    /**
     * 5. Scoring
     */
    const scored = vendorRows.map((row: any) => {
      let score = 0;
      const reasons: string[] = [];

      const price = toNumber(row.price, 0);
      const rating = toNumber(row.rating, 0);
      const reviews = parseInt(row.total_reviews, 10) || 0;

      const category =
        row.service_category ||
        row.vendor_category ||
        '';

      /**
       * A. Category match
       */
      if (servicesNeeded.includes(category)) {
        score += 25;
        reasons.push('Matches your needed services');
      }

      if (neededFromTasks.has(category)) {
        score += 5;
        reasons.push('Related to your checklist');
      }

      /**
       * B. Not already booked
       */
      if (!bookedCategories.has(category)) {
        score += 20;
        reasons.push("You haven't booked this yet");
      } else {
        score -= 10;
      }

      /**
       * C. Budget
       */
      if (price >= budgetMin && price <= budgetMax) {
        score += 15;

        const budgetMid =
          (budgetMin + budgetMax) / 2;

        const budgetRange =
          budgetMax - budgetMin;

        if (budgetRange > 0) {
          const distanceFromMid =
            Math.abs(price - budgetMid) /
            budgetRange;

          score += Math.round(
            (1 - distanceFromMid) * 10
          );
        }

        reasons.push('Within your budget');
      } else if (price < budgetMin) {
        score += 5;
        reasons.push('Below your budget');
      }

      /**
       * D. Rating
       */
      if (rating >= 4.5) {
        score += 15;
        reasons.push('Highly rated');
      } else if (rating >= 4.0) {
        score += 10;
        reasons.push('Well rated');
      } else if (rating >= 3.0) {
        score += 5;
      }

      /**
       * E. Reviews
       */
      if (reviews >= 10) {
        score += 5;
      } else if (reviews >= 5) {
        score += 3;
      } else if (reviews >= 1) {
        score += 1;
      }

      /**
       * F. Verified vendor
       */
      if (row.is_verified) {
        score += 5;
        reasons.push('Verified vendor');
      }

      return {
        vendorId: row.vendor_id,
        businessName:
          row.business_name ||
          row.vendor_name ||
          '',
        vendorCategory: row.vendor_category || '',
        profileImage: row.profile_image || null,
        city: row.city || '',
        rating,
        totalReviews: reviews,
        isVerified: Boolean(row.is_verified),
        serviceId: row.service_id,
        serviceName: row.service_name || '',
        serviceDescription:
          row.service_description || '',
        serviceCategory: category,
        serviceImage:
          row.service_image || null,
        price,
        score,
        reasons: [...new Set(reasons)],
        matchType:
          score >= 50
            ? 'excellent'
            : score >= 30
              ? 'good'
              : 'fair'
      };
    });

    /**
     * 6. Sort
     */
    scored.sort((a, b) => b.score - a.score);

    /**
     * 7. Max 3 vendors per category
     */
    const categoryGroups: Record<string, any[]> = {};

    for (const item of scored) {
      if (!categoryGroups[item.serviceCategory]) {
        categoryGroups[item.serviceCategory] = [];
      }

      if (
        categoryGroups[item.serviceCategory].length < 3
      ) {
        categoryGroups[item.serviceCategory].push(item);
      }
    }

    /**
     * 8. Build groups
     */
    const neededCategories =
      servicesNeeded.length > 0
        ? servicesNeeded
        : [
            ...new Set(
              scored.map(item => item.serviceCategory)
            )
          ];

    const grouped = neededCategories
      .map(category => ({
        category,
        isBooked: bookedCategories.has(category),
        vendors:
          categoryGroups[category] || []
      }))
      .filter(group => group.vendors.length > 0);

    /**
     * 9. Unbooked first
     */
    grouped.sort((a, b) => {
      if (a.isBooked && !b.isBooked) return 1;
      if (!a.isBooked && b.isBooked) return -1;
      return 0;
    });

    return res.json({
      recommendations: grouped,
      topPicks: scored.slice(0, 6),
      stats: {
        totalFound: scored.length,
        categoriesNeeded: servicesNeeded.length,
        categoriesBooked: bookedCategories.size,
        budgetRange: `€${budgetMin} - €${budgetMax}`
      }
    });
  } catch (error: any) {
    console.error(
      '❌ Error fetching recommendations:',
      error
    );

    return res.status(500).json({
      error: 'Failed to fetch recommendations',
      details: error?.message || String(error),
      code: error?.code || null,
      sqlMessage: error?.sqlMessage || null
    });
  }
});


/* =========================================================
   WEDDING TASKS
   ========================================================= */


/**
 * GET /api/wedding-profile/tasks/:clientId
 */
router.get('/tasks/:clientId', async (req, res) => {
  try {
    const clientId = parseClientId(req.params.clientId);

    if (!clientId) {
      return res.status(400).json({
        error: 'Invalid client ID'
      });
    }

    const tasks = await db.query(
      `
        SELECT *
        FROM wedding_tasks
        WHERE client_id = ?
        ORDER BY
          sort_order ASC,
          due_date ASC,
          created_at ASC
      `,
      [clientId]
    );

    return res.json(
      Array.isArray(tasks) ? tasks : []
    );
  } catch (error: any) {
    console.error(
      '❌ Error fetching tasks:',
      error
    );

    return res.status(500).json({
      error: 'Failed to fetch tasks',
      details: error?.message || String(error)
    });
  }
});


/**
 * POST /api/wedding-profile/tasks
 */
router.post('/tasks', async (req, res) => {
  try {
    const {
      clientId,
      title,
      description,
      category,
      dueDate,
      priority
    } = req.body || {};

    const parsedClientId = parseClientId(clientId);

    if (!parsedClientId || !title?.trim()) {
      return res.status(400).json({
        error: 'clientId and title are required'
      });
    }

    const result = await db.query(
      `
        INSERT INTO wedding_tasks
        (
          client_id,
          title,
          description,
          category,
          due_date,
          priority
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        parsedClientId,
        title.trim(),
        description || null,
        category || null,
        dueDate || null,
        priority || 'medium'
      ]
    );

    return res.status(201).json({
      success: true,
      id: result?.insertId || null,
      message: 'Task added'
    });
  } catch (error: any) {
    console.error(
      '❌ Error adding task:',
      error
    );

    return res.status(500).json({
      error: 'Failed to add task',
      details: error?.message || String(error)
    });
  }
});


/**
 * PUT /api/wedding-profile/tasks/:taskId/toggle
 */
router.put('/tasks/:taskId/toggle', async (req, res) => {
  try {
    const taskId = parseClientId(req.params.taskId);

    if (!taskId) {
      return res.status(400).json({
        error: 'Invalid task ID'
      });
    }

    await db.query(
      `
        UPDATE wedding_tasks
        SET
          is_completed = NOT is_completed,
          updated_at = NOW()
        WHERE id = ?
      `,
      [taskId]
    );

    return res.json({
      success: true,
      message: 'Task toggled'
    });
  } catch (error: any) {
    console.error(
      '❌ Error toggling task:',
      error
    );

    return res.status(500).json({
      error: 'Failed to toggle task',
      details: error?.message || String(error)
    });
  }
});


/**
 * PUT /api/wedding-profile/tasks/:taskId
 */
router.put('/tasks/:taskId', async (req, res) => {
  try {
    const taskId = parseClientId(req.params.taskId);

    if (!taskId) {
      return res.status(400).json({
        error: 'Invalid task ID'
      });
    }

    const {
      title,
      description,
      category,
      dueDate,
      priority
    } = req.body || {};

    await db.query(
      `
        UPDATE wedding_tasks
        SET
          title = ?,
          description = ?,
          category = ?,
          due_date = ?,
          priority = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        title || null,
        description || null,
        category || null,
        dueDate || null,
        priority || 'medium',
        taskId
      ]
    );

    return res.json({
      success: true,
      message: 'Task updated'
    });
  } catch (error: any) {
    console.error(
      '❌ Error updating task:',
      error
    );

    return res.status(500).json({
      error: 'Failed to update task',
      details: error?.message || String(error)
    });
  }
});


/**
 * DELETE /api/wedding-profile/tasks/:taskId
 */
router.delete('/tasks/:taskId', async (req, res) => {
  try {
    const taskId = parseClientId(req.params.taskId);

    if (!taskId) {
      return res.status(400).json({
        error: 'Invalid task ID'
      });
    }

    await db.query(
      `
        DELETE FROM wedding_tasks
        WHERE id = ?
      `,
      [taskId]
    );

    return res.json({
      success: true,
      message: 'Task deleted'
    });
  } catch (error: any) {
    console.error(
      '❌ Error deleting task:',
      error
    );

    return res.status(500).json({
      error: 'Failed to delete task',
      details: error?.message || String(error)
    });
  }
});


/**
 * POST /api/wedding-profile/tasks/defaults
 */
router.post('/tasks/defaults', async (req, res) => {
  try {
    const parsedClientId = parseClientId(
      req.body?.clientId
    );

    if (!parsedClientId) {
      return res.status(400).json({
        error: 'clientId required'
      });
    }

    const existing = await db.query(
      `
        SELECT COUNT(*) AS count
        FROM wedding_tasks
        WHERE client_id = ?
      `,
      [parsedClientId]
    );

    const existingRows = Array.isArray(existing)
      ? existing
      : [];

    const existingCount =
      Number(existingRows[0]?.count) || 0;

    if (existingCount > 0) {
      return res.json({
        message: 'Tasks already exist',
        skipped: true
      });
    }

    const defaultTasks = [
      {
        title: 'Set wedding budget',
        category: 'Planning',
        priority: 'high',
        order: 1
      },
      {
        title: 'Choose wedding date',
        category: 'Planning',
        priority: 'high',
        order: 2
      },
      {
        title: 'Book venue',
        category: 'Venues',
        priority: 'high',
        order: 3
      },
      {
        title: 'Hire photographer',
        category: 'Photography',
        priority: 'high',
        order: 4
      },
      {
        title: 'Hire videographer',
        category: 'Videography',
        priority: 'medium',
        order: 5
      },
      {
        title: 'Book florist',
        category: 'Floristry',
        priority: 'medium',
        order: 6
      },
      {
        title: 'Book catering / cake',
        category: 'Cake & Sweets',
        priority: 'medium',
        order: 7
      },
      {
        title: 'Book entertainment / music',
        category: 'Entertainment',
        priority: 'medium',
        order: 8
      },
      {
        title: 'Book makeup & hair stylist',
        category: 'Beauty',
        priority: 'medium',
        order: 9
      },
      {
        title: 'Send invitations',
        category: 'Planning',
        priority: 'medium',
        order: 10
      },
      {
        title: 'Plan honeymoon',
        category: 'Planning',
        priority: 'low',
        order: 11
      },
      {
        title: 'Arrange transportation',
        category: 'Car Rental',
        priority: 'low',
        order: 12
      }
    ];

    for (const task of defaultTasks) {
      await db.query(
        `
          INSERT INTO wedding_tasks
          (
            client_id,
            title,
            category,
            priority,
            sort_order
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          parsedClientId,
          task.title,
          task.category,
          task.priority,
          task.order
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Default tasks created',
      count: defaultTasks.length
    });
  } catch (error: any) {
    console.error(
      '❌ Error creating default tasks:',
      error
    );

    return res.status(500).json({
      error: 'Failed to create default tasks',
      details: error?.message || String(error)
    });
  }
});


/* =========================================================
   BOOKED VENDORS
   ========================================================= */


/**
 * GET /api/wedding-profile/booked-vendors/:clientId
 */
router.get('/booked-vendors/:clientId', async (req, res) => {
  try {
    const clientId = parseClientId(req.params.clientId);

    if (!clientId) {
      return res.status(400).json({
        error: 'Invalid client ID'
      });
    }

    const vendors = await db.query(
      `
        SELECT
          b.id AS booking_id,
          b.status AS booking_status,
          b.event_date,
          b.total_amount,
          b.created_at AS booked_at,

          v.id AS vendor_id,
          v.business_name,
          v.name AS vendor_name,
          v.category,
          v.phone,
          v.email,
          v.profile_image,
          v.rating,

          vs.name AS service_name,
          vs.price AS service_price

        FROM bookings b
        JOIN vendors v
          ON b.vendor_id = v.id
        LEFT JOIN vendor_services vs
          ON b.service_id = vs.id

        WHERE
          b.client_id = ?
          AND b.status IN ('pending', 'confirmed')

        ORDER BY b.event_date ASC
      `,
      [clientId]
    );

    return res.json(
      Array.isArray(vendors) ? vendors : []
    );
  } catch (error: any) {
    console.error(
      '❌ Error fetching booked vendors:',
      error
    );

    return res.status(500).json({
      error: 'Failed to fetch booked vendors',
      details: error?.message || String(error)
    });
  }
});


/* =========================================================
   VENDOR VIEW
   ========================================================= */


/**
 * GET /api/wedding-profile/vendor-view/:vendorId/:clientId
 *
 * Vendor can view the client's wedding information
 * when there is a booking between them.
 */
router.get(
  '/vendor-view/:vendorId/:clientId',
  async (req, res) => {
    try {
      const vendorId = parseClientId(
        req.params.vendorId
      );

      const clientId = parseClientId(
        req.params.clientId
      );

      if (!vendorId || !clientId) {
        return res.status(400).json({
          error: 'Invalid vendor ID or client ID'
        });
      }

      /**
       * Verify booking.
       */
      const bookings = await db.query(
        `
          SELECT id
          FROM bookings
          WHERE
            vendor_id = ?
            AND client_id = ?
          LIMIT 1
        `,
        [vendorId, clientId]
      );

      const bookingRows = Array.isArray(bookings)
        ? bookings
        : [];

      if (bookingRows.length === 0) {
        return res.status(403).json({
          error:
            'No booking exists between you and this client'
        });
      }

      /**
       * Client information
       */
      const clients = await db.query(
        `
          SELECT id, name, email, phone
          FROM clients
          WHERE id = ?
        `,
        [clientId]
      );

      const clientRows = Array.isArray(clients)
        ? clients
        : [];

      /**
       * Wedding profile
       */
      const profiles = await db.query(
        `
          SELECT *
          FROM client_wedding_profiles
          WHERE client_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [clientId]
      );

      const profileRows = Array.isArray(profiles)
        ? profiles
        : [];

      /**
       * Task stats
       */
      const taskStatsResult = await db.query(
        `
          SELECT
            COUNT(*) AS total_tasks,
            SUM(
              CASE
                WHEN is_completed = 1
                THEN 1
                ELSE 0
              END
            ) AS completed_tasks
          FROM wedding_tasks
          WHERE client_id = ?
        `,
        [clientId]
      );

      const taskStatsRows =
        Array.isArray(taskStatsResult)
          ? taskStatsResult
          : [];

      /**
       * Booked vendors
       */
      const bookedVendorsResult = await db.query(
        `
          SELECT
            v.business_name,
            v.category,
            b.status AS booking_status,
            b.total_amount

          FROM bookings b

          JOIN vendors v
            ON b.vendor_id = v.id

          WHERE
            b.client_id = ?
            AND b.status IN ('pending', 'confirmed')

          ORDER BY b.created_at DESC
        `,
        [clientId]
      );

      const bookedVendors =
        Array.isArray(bookedVendorsResult)
          ? bookedVendorsResult
          : [];

      const client =
        clientRows[0] || null;

      const profile =
        profileRows[0] || null;

      const stats =
        taskStatsRows[0] || {
          total_tasks: 0,
          completed_tasks: 0
        };

      return res.json({
        client: client
          ? {
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone
            }
          : null,

        weddingProfile: profile
          ? {
              weddingDate:
                profile.wedding_date,
              venueLocation:
                profile.venue_location,
              guestCount:
                profile.guest_count,
              budgetMin:
                toNumber(profile.budget_min),
              budgetMax:
                toNumber(profile.budget_max),
              preferredStyle:
                profile.preferred_style,
              colorTheme:
                profile.color_theme,
              specialRequirements:
                profile.special_requirements,
              servicesNeeded:
                parseServices(
                  profile.services_needed
                )
            }
          : null,

        taskProgress: {
          total:
            parseInt(
              String(stats.total_tasks || 0),
              10
            ) || 0,

          completed:
            parseInt(
              String(stats.completed_tasks || 0),
              10
            ) || 0
        },

        bookedVendors:
          bookedVendors.map((vendor: any) => ({
            businessName:
              vendor.business_name,
            category:
              vendor.category,
            status:
              vendor.booking_status,
            amount:
              toNumber(vendor.total_amount)
          }))
      });
    } catch (error: any) {
      console.error(
        '❌ Error fetching client wedding profile for vendor:',
        error
      );

      return res.status(500).json({
        error: 'Failed to fetch client profile',
        details:
          error?.message || String(error),
        code:
          error?.code || null,
        sqlMessage:
          error?.sqlMessage || null
      });
    }
  }
);


export default router;