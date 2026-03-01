const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images
const imagesDir = path.join(__dirname, '../frontend/public/images');
app.use('/images', express.static(imagesDir));

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Import required modules for image service
const mysql = require('mysql2/promise');

// UUID generation function (alternative to uuid package)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Configure multer for backward compatibility (legacy endpoint)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const fileName = req.body.fileName || `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${file.originalname.split('.').pop()}`;
    cb(null, fileName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload image endpoint
app.post('/api/upload-image', (req, res) => {
  console.log('Upload request received');
  console.log('Content-Type:', req.headers['content-type']);
  
  // Apply multer middleware manually with error handling
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(500).json({ error: 'Server error during upload', details: err.message });
    }

    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    try {
      if (!req.file) {
        console.error('No file provided in request');
        return res.status(400).json({ error: 'No image file provided' });
      }

      console.log('File uploaded successfully:', req.file.filename);
      const relativePath = `/images/${req.file.filename}`;
      
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        filePath: relativePath,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image', details: error.message });
    }
  });
});

// Delete image endpoint
app.delete('/api/delete-image/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(imagesDir, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Vendor Services API endpoints
app.get('/api/vendor/services', async (req, res) => {
  console.log('GET /api/vendor/services called');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      // Get all services from database
      const [services] = await connection.execute(
        'SELECT * FROM vendor_services ORDER BY created_at DESC'
      );
      
      // Get images for each service
      for (let service of services) {
        const [images] = await connection.execute(
          'SELECT file_path FROM service_images WHERE service_id = ? ORDER BY display_order ASC',
          [service.id]
        );
        
        // Map images to array of paths
        service.images = images.map(img => img.file_path);
      }
      
      // Format the response
      const formattedServices = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        price: Number(service.price),
        images: service.images || [],
        isActive: Boolean(service.is_active),
        createdAt: service.created_at
      }));
      
      console.log(`Loaded ${formattedServices.length} services from database`);
      res.json(formattedServices);
      
    } finally {
      await connection.end();
    }
    
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/vendor/services', async (req, res) => {
  console.log('POST /api/vendor/services called');
  console.log('Request body:', req.body);
  
  const { name, description, category, price, images, isActive } = req.body;
  const vendorId = 1; // Mock vendor ID for development
  
  console.log('Creating service for vendorId:', vendorId);
  
  // Validate required fields
  if (!name || !description || !category || price === undefined) {
    console.log('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      // Insert service into database
      const [result] = await connection.execute(
        'INSERT INTO vendor_services (vendor_id, name, description, category, price, images, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [vendorId, name, description, category, Number(price), JSON.stringify(images || []), isActive !== undefined ? isActive : true]
      );
      
      const newService = {
        id: result.insertId,
        vendor_id: vendorId,
        name,
        description,
        category,
        price: Number(price),
        images: images || [],
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString()
      };
      
      console.log('Created service in database:', newService);
      res.json(newService);
      
    } finally {
      await connection.end();
    }
    
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/vendor/services/:id', (req, res) => {
  console.log('PUT /api/vendor/services/:id called');
  const { id } = req.params;
  console.log('Updating service ID:', id);
  console.log('Request body:', req.body);
  
  try {
    const { name, description, category, price, images, isActive } = req.body;
    
    // Mock updating service - in production this would update database
    const updatedService = {
      id: Number(id),
      name,
      description,
      category,
      price: Number(price),
      images: images || [],
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updated service:', updatedService);
    res.json(updatedService);
    
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/vendor/services/:id', (req, res) => {
  console.log('DELETE /api/vendor/services/:id called');
  const { id } = req.params;
  console.log('Deleting service ID:', id);
  
  try {
    // Mock deleting service - in production this would delete from database
    res.json({ success: true, message: 'Service deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace'
};

// JWT middleware for vendor authentication
const authenticateVendor = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // For testing purposes, accept test tokens
    if (token === 'test-vendor-token') {
      req.vendorId = 1; // Mock vendor ID for testing
      return next();
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.vendorId = decoded.id || decoded.vendorId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Image service functions
const generateUniqueFilename = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const uuid = generateUUID();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}${ext}`;
};

const validateImageFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' };
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: 'Invalid file extension' };
  }

  return { valid: true };
};

// Configure multer for new image API - Using disk storage for reliability
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uuid = generateUUID();
      const timestamp = Date.now();
      const filename = `${uuid}-${timestamp}${ext}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const validation = validateImageFile(file);
    if (validation.valid) {
      cb(null, true);
    } else {
      cb(new Error(validation.error || 'Invalid file'));
    }
  }
});

// Upload images for a service - SIMPLIFIED VERSION
app.post('/api/images/services/:serviceId/images', imageUpload.array('images', 10), async (req, res) => {
  console.log('=== IMAGE UPLOAD ENDPOINT CALLED ===');
  
  try {
    const serviceId = parseInt(req.params.serviceId);
    const files = req.files;
    
    console.log(`Service ID: ${serviceId}`);
    console.log(`Files received: ${files ? files.length : 0}`);
    
    if (!files || files.length === 0) {
      console.log('ERROR: No files received');
      return res.status(400).json({ error: 'No images provided' });
    }
    
    // Log file details
    files.forEach((file, index) => {
      console.log(`File ${index + 1}: ${file.filename} (${file.size} bytes, ${file.mimetype})`);
    });
    
    const uploadedImages = [];
    
    // Try to save to database
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      try {
        // Check if service exists
        const [serviceRows] = await connection.execute(
          'SELECT id FROM vendor_services WHERE id = ?',
          [serviceId]
        );
        
        if (serviceRows.length === 0) {
          console.log(`ERROR: Service ${serviceId} not found`);
          return res.status(404).json({ error: 'Service not found' });
        }
        
        console.log(`Service ${serviceId} exists, proceeding with image save...`);
        
        // Save each image to database
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const publicPath = `/images/${file.filename}`;
          
          try {
            const [result] = await connection.execute(
              `INSERT INTO service_images 
               (service_id, file_path, original_filename, uploader_id, file_size, mime_type, display_order, is_primary)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [serviceId, publicPath, file.originalname, 1, file.size, file.mimetype, i + 1, i === 0]
            );
            
            console.log(`✓ Image ${i + 1} saved to DB with ID: ${result.insertId}`);
            
            uploadedImages.push({
              id: result.insertId,
              file_path: publicPath,
              original_filename: file.originalname
            });
          } catch (dbError) {
            console.error(`✗ Failed to save image ${i + 1} to DB:`, dbError.message);
          }
        }
        
      } finally {
        await connection.end();
      }
      
    } catch (dbConnectionError) {
      console.error('Database connection error:', dbConnectionError.message);
      // Still return success for files that were saved to disk
      console.log('WARNING: Database save failed, but files are saved to disk');
    }
    
    console.log(`=== UPLOAD COMPLETE: ${uploadedImages.length}/${files.length} images saved ===`);
    
    // Always return success if files were uploaded to disk
    res.json({
      success: true,
      message: `${files.length} images uploaded successfully`,
      images: uploadedImages.length > 0 ? uploadedImages : files.map((f, i) => ({
        file_path: `/images/${f.filename}`,
        original_filename: f.originalname
      })),
      total: files.length,
      uploaded: uploadedImages.length > 0 ? uploadedImages.length : files.length
    });
    
  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
});

// Get images for a service
app.get('/api/images/services/:serviceId/images', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM service_images WHERE service_id = ? ORDER BY display_order ASC, upload_timestamp ASC',
        [serviceId]
      );
      
      res.json({
        success: true,
        images: rows
      });
      
    } finally {
      await connection.end();
    }
    
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Delete an image
app.delete('/api/images/services/:serviceId/images/:imageId', authenticateVendor, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const imageId = parseInt(req.params.imageId);
    const vendorId = req.vendorId;
    
    console.log(`Vendor ${vendorId} deleting image ${imageId} from service ${serviceId}`);
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      // Get image info first
      const [rows] = await connection.execute(
        'SELECT * FROM service_images WHERE id = ? AND service_id = ?',
        [imageId, serviceId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      const image = rows[0];
      
      // Delete from database
      await connection.execute(
        'DELETE FROM service_images WHERE id = ? AND service_id = ?',
        [imageId, serviceId]
      );
      
      // Delete file from disk
      try {
        const filename = path.basename(image.file_path);
        const fullPath = path.join(imagesDir, filename);
        
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
      
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
      
    } finally {
      await connection.end();
    }
    
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Wedding Marketplace Backend is running!' });
});

// Search routes
const searchRoutes = require('./src/routes/searchRoutes');
app.use('/api/search', searchRoutes);

// Message routes
const messageRoutes = require('./src/routes/messageRoutes');
app.use('/api/messages', messageRoutes);

// Package routes
const packageRoutes = require('./src/routes/packageRoutes');
app.use('/api/packages', packageRoutes);

// ═══════════════════════════════════════════════════════════════
// BOOKING SYSTEM APIs - يجب أن يكون قبل serviceRoutes!
// ═══════════════════════════════════════════════════════════════

// Get service availability (معطل مؤقتاً - سيتم تفعيله مع نظام الإتاحة)
app.get('/api/services/:serviceId/availability', async (req, res) => {
  try {
    // حالياً نرجع مصفوفة فارغة لأن نظام الإتاحة معطل
    // جميع التواريخ متاحة بشكل افتراضي
    res.json([]);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Set service availability (Vendor)
app.post('/api/services/:serviceId/availability', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { dates } = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      for (const dateInfo of dates) {
        await connection.execute(
          `INSERT INTO service_availability (service_id, date, is_available, max_bookings)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           is_available = VALUES(is_available),
           max_bookings = VALUES(max_bookings)`,
          [serviceId, dateInfo.date, dateInfo.isAvailable, dateInfo.maxBookings || 1]
        );
      }
      
      res.json({ success: true, message: 'Availability updated' });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error setting availability:', error);
    res.status(500).json({ error: 'Failed to set availability' });
  }
});

// Create booking (Client) - إنشاء حجز جديد
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      clientId,
      serviceId,
      eventDate,
      eventTime,
      eventLocation,
      guestCount,
      clientNotes
    } = req.body;
    
    console.log('📝 Creating booking:', req.body);
    
    // التحقق من وجود clientId
    if (!clientId) {
      return res.status(401).json({ 
        success: false,
        error: 'authentication_required',
        message: 'يجب تسجيل الدخول للحجز' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      // التحقق من أن العميل موجود في قاعدة البيانات
      const [clients] = await connection.execute(
        'SELECT id, name, email FROM clients WHERE id = ?',
        [clientId]
      );
      
      if (clients.length === 0) {
        return res.status(401).json({ 
          success: false,
          error: 'invalid_client',
          message: 'مستخدم غير صالح. يرجى تسجيل الدخول مرة أخرى' 
        });
      }
      
      console.log('✅ Client verified:', clients[0].name);
      
      // Call stored procedure
      const [result] = await connection.execute(
        'CALL create_booking(?, ?, ?, ?, ?, ?, ?, @booking_id, @booking_number, @status)',
        [clientId, serviceId, eventDate, eventTime || '10:00', eventLocation, guestCount || 0, clientNotes || '']
      );
      
      // Get output parameters
      const [[output]] = await connection.execute(
        'SELECT @booking_id as bookingId, @booking_number as bookingNumber, @status as status'
      );
      
      console.log('📋 Stored procedure result:', output);
      
      if (output.status === 'success') {
        // Fetch the created booking with full details
        const [bookings] = await connection.execute(
          `SELECT b.*, 
                  vs.name as service_name, 
                  vs.category, 
                  v.business_name as vendor_name
           FROM bookings b
           LEFT JOIN vendor_services vs ON b.service_id = vs.id
           LEFT JOIN vendors v ON b.vendor_id = v.id
           WHERE b.id = ?`,
          [output.bookingId]
        );
        
        console.log('✅ Booking created successfully:', bookings[0].booking_number);
        
        res.json({
          success: true,
          booking: bookings[0],
          message: 'تم إنشاء الحجز بنجاح'
        });
      } else {
        res.status(400).json({
          success: false,
          error: output.status,
          message: 'فشل إنشاء الحجز'
        });
      }
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create booking' 
    });
  }
});

// Get all bookings for logged-in client
app.get('/api/bookings', async (req, res) => {
  try {
    const clientId = req.query.clientId || req.headers['x-client-id'];
    
    if (!clientId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'يجب تسجيل الدخول لعرض الحجوزات' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [bookings] = await connection.execute(
        `SELECT b.id, 
                b.booking_number,
                b.event_date as date,
                b.status,
                b.total_amount as price,
                b.service_name as serviceName,
                v.business_name as providerName,
                b.created_at,
                b.client_notes,
                vs.category
         FROM bookings b
         LEFT JOIN vendor_services vs ON b.service_id = vs.id
         LEFT JOIN vendors v ON b.vendor_id = v.id
         WHERE b.client_id = ?
         ORDER BY b.created_at DESC`,
        [clientId]
      );
      
      const formattedBookings = bookings.map(booking => ({
        id: booking.id,
        serviceName: booking.serviceName,
        providerName: booking.providerName || 'N/A',
        date: booking.date,
        status: booking.status,
        price: `€${booking.price}`,
        bookingNumber: booking.booking_number
      }));
      
      console.log(`✅ Fetched ${formattedBookings.length} bookings for client ${clientId}`);
      res.json(formattedBookings);
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking (Client)
app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, eventDate } = req.body;
    
    const newDate = date || eventDate;
    
    if (!newDate) {
      return res.status(400).json({ error: 'تاريخ جديد مطلوب' });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [bookings] = await connection.execute(
        'SELECT * FROM bookings WHERE id = ?',
        [id]
      );
      
      if (bookings.length === 0) {
        return res.status(404).json({ error: 'الحجز غير موجود' });
      }
      
      if (bookings[0].status !== 'pending') {
        return res.status(400).json({ error: 'لا يمكن تعديل حجز غير معلق' });
      }
      
      await connection.execute(
        'UPDATE bookings SET event_date = ?, updated_at = NOW() WHERE id = ?',
        [newDate, id]
      );
      
      await connection.execute(
        'INSERT INTO booking_history (booking_id, changed_by_type, new_status, change_description) VALUES (?, ?, ?, ?)',
        [id, 'client', 'pending', `Date changed to ${newDate}`]
      );
      
      const [updated] = await connection.execute(
        `SELECT b.id, b.booking_number, b.event_date as date, b.status, 
                b.total_amount as price, b.service_name as serviceName,
                v.business_name as providerName
         FROM bookings b
         LEFT JOIN vendors v ON b.vendor_id = v.id
         WHERE b.id = ?`,
        [id]
      );
      
      res.json(updated[0]);
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    res.status(500).json({ error: 'فشل تحديث الحجز' });
  }
});

// Delete/Cancel booking (Client)
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [bookings] = await connection.execute(
        'SELECT * FROM bookings WHERE id = ?',
        [id]
      );
      
      if (bookings.length === 0) {
        return res.status(404).json({ error: 'الحجز غير موجود' });
      }
      
      await connection.execute(
        'UPDATE bookings SET status = ?, cancelled_at = NOW(), updated_at = NOW() WHERE id = ?',
        ['cancelled', id]
      );
      
      await connection.execute(
        'INSERT INTO booking_history (booking_id, changed_by_type, new_status, change_description) VALUES (?, ?, ?, ?)',
        [id, 'client', 'cancelled', 'Booking cancelled by client']
      );
      
      console.log(`✅ Booking ${id} cancelled successfully`);
      res.json({ success: true, message: 'تم إلغاء الحجز بنجاح' });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({ error: 'فشل إلغاء الحجز' });
  }
});

// Get client bookings by ID (backward compatibility)
app.get('/api/bookings/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [bookings] = await connection.execute(
        `SELECT b.*, vs.name as service_name, vs.category, 
                v.business_name as vendor_name, v.email as vendor_email
         FROM bookings b
         LEFT JOIN vendor_services vs ON b.service_id = vs.id
         LEFT JOIN vendors v ON b.vendor_id = v.id
         WHERE b.client_id = ?
         ORDER BY b.created_at DESC`,
        [clientId]
      );
      
      res.json(bookings);
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get vendor bookings
app.get('/api/bookings/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status } = req.query;
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      let query = `
        SELECT b.*, vs.name as service_name, vs.category
        FROM bookings b
        LEFT JOIN vendor_services vs ON b.service_id = vs.id
        WHERE b.vendor_id = ?
      `;
      const params = [vendorId];
      
      if (status) {
        query += ' AND b.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY b.created_at DESC';
      
      const [bookings] = await connection.execute(query, params);
      res.json(bookings);
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching vendor bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status (Vendor)
app.patch('/api/bookings/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, vendorNotes } = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      await connection.execute(
        'UPDATE bookings SET status = ?, vendor_notes = ?, updated_at = NOW() WHERE id = ?',
        [status, vendorNotes, bookingId]
      );
      
      await connection.execute(
        'INSERT INTO booking_history (booking_id, changed_by_type, new_status, change_description) VALUES (?, ?, ?, ?)',
        [bookingId, 'vendor', status, `Status changed to ${status}`]
      );
      
      res.json({ success: true, message: 'تم تحديث حالة الحجز' });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

console.log('✅ Booking system routes loaded');

// Service routes (يجب أن يكون بعد booking routes)
const serviceRoutes = require('./src/routes/serviceRoutes');
app.use('/api/services', serviceRoutes);

// Client routes
const clientRoutes = require('./src/routes/clientRoutes');
app.use('/api/client', clientRoutes);

// Vendor routes
const vendorRoutes = require('./src/routes/vendorRoutes');
app.use('/api/vendor', vendorRoutes);

// Vendor services routes
const vendorServiceRoutes = require('./src/routes/vendorServiceRoutes');
app.use('/api/vendor/services', vendorServiceRoutes);

// Email routes (NEW - Database Improvements)
const emailRoutes = require('./src/routes/emailRoutes');
app.use('/api/email', emailRoutes);
console.log('✅ Email routes loaded: /api/email/*');

// Review report routes (NEW - Database Improvements)
const reviewReportRoutes = require('./src/routes/reviewReportRoutes');
app.use('/api/review-reports', reviewReportRoutes);
console.log('✅ Review report routes loaded: /api/review-reports/*');

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
