import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reviews from './routes/reviews';
import vendorAuth from './routes/vendorAuth';
import adminAuth from './routes/adminAuth';
import clientAuth from './routes/clientAuth';
import profile from './routes/profile';
import adminVendors from './routes/adminVendors';
import adminClients from './routes/adminClients';
import adminReports from './routes/adminReports';
import adminServices from './routes/adminServices';
import adminReviews from './routes/adminReviews';
import adminSettings from './routes/adminSettings';
import adminPermissions from './routes/adminPermissions';
import vendorServices from './routes/vendorServices';
import services from './routes/services';
const serviceRoutes = require('./routes/serviceRoutes');
const bookings = require('./routes/bookings');
const vendorRoutes = require('./routes/vendorRoutes');
import favorites from './routes/favorites';
import reviews2 from './routes/reviews';
import weddingProfile from './routes/weddingProfile';
import availability from './routes/availability';
import imageUpload from './routes/imageUpload';
import imageRoutes from './routes/imageRoutes';
// import { apiRateLimit } from './middleware/rateLimiting';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static images
const path = require('path');
const imagesDir = path.join(__dirname, '../../frontend/public/images');
app.use('/images', express.static(imagesDir));
// Temporarily disable rate limiting for development
// app.use(apiRateLimit); // Apply rate limiting to all routes

// Routes
app.use('/api', reviews);
app.use('/api', vendorAuth);
app.use('/api', adminAuth);
app.use('/api', clientAuth);
app.use('/api', profile);
app.use('/api', adminVendors);
app.use('/api', adminClients);
app.use('/api', adminReports);
app.use('/api', adminServices);
app.use('/api', adminReviews);
app.use('/api', adminSettings);
app.use('/api', adminPermissions);
app.use('/api', vendorServices);
app.use('/api/services', serviceRoutes); // Vendor-profile based listing
app.use('/api/bookings', bookings); // Booking system
app.use('/api/vendor', vendorRoutes); // Vendor profile management
app.use('/api/services-legacy', services); // Legacy individual services (kept for backwards compat)
app.use('/api/favorites', favorites);
app.use('/api/reviews', reviews2);
app.use('/api/wedding-profile', weddingProfile);
app.use('/api/availability', availability);
app.use('/api', imageUpload);
app.use('/api/images', imageRoutes);
console.log('Using real reviews with database connection');

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});