import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';

// All imports converted to standard ES module imports
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
import serviceRoutes from './routes/serviceRoutes';
import bookings from './routes/bookings';
import featuredVendors from './routes/featuredVendors';
import vendorRoutes from './routes/vendorRoutes';
import favorites from './routes/favorites';
import reviews2 from './routes/reviews';
import weddingProfile from './routes/weddingProfile';
import availability from './routes/availability';
import imageUpload from './routes/imageUpload';
import imageRoutes from './routes/imageRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman or mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`⚠️ CORS blocked request from: ${origin}`);
    // Return false instead of throwing Error to prevent 500 status on preflight OPTIONS requests
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static images
const imagesDir = path.join(__dirname, '../../frontend/public/images');
app.use('/images', express.static(imagesDir));

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
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookings);
app.use('/api/featured-vendors', featuredVendors);
app.use('/api/vendor', vendorRoutes);
app.use('/api/services-legacy', services);
app.use('/api/favorites', favorites);
app.use('/api/reviews', reviews2);
app.use('/api/wedding-profile', weddingProfile);
app.use('/api/availability', availability);
app.use('/api', imageUpload);
app.use('/api/images', imageRoutes);

// Health check endpoints
const healthCheck = (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
};
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Express Error Handler:', err.stack || err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start server on 0.0.0.0 to accept both IPv4 (127.0.0.1) and IPv6 (localhost)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`✅ Health check: http://127.0.0.1:${PORT}/health`);
})