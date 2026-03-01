"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const vendorAuth_1 = __importDefault(require("./routes/vendorAuth"));
const adminAuth_1 = __importDefault(require("./routes/adminAuth"));
const clientAuth_1 = __importDefault(require("./routes/clientAuth"));
const profile_1 = __importDefault(require("./routes/profile"));
const adminVendors_1 = __importDefault(require("./routes/adminVendors"));
const adminClients_1 = __importDefault(require("./routes/adminClients"));
const adminReports_1 = __importDefault(require("./routes/adminReports"));
const adminServices_1 = __importDefault(require("./routes/adminServices"));
const adminReviews_1 = __importDefault(require("./routes/adminReviews"));
const adminSettings_1 = __importDefault(require("./routes/adminSettings"));
const adminPermissions_1 = __importDefault(require("./routes/adminPermissions"));
const vendorServices_1 = __importDefault(require("./routes/vendorServices"));
const services_1 = __importDefault(require("./routes/services"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const reviews_2 = __importDefault(require("./routes/reviews"));
const weddingProfile_1 = __importDefault(require("./routes/weddingProfile"));
const availability_1 = __importDefault(require("./routes/availability"));
const imageUpload_1 = __importDefault(require("./routes/imageUpload"));
const imageRoutes_1 = __importDefault(require("./routes/imageRoutes"));
// import { apiRateLimit } from './middleware/rateLimiting';
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Serve static images
const path = require('path');
const imagesDir = path.join(__dirname, '../../frontend/public/images');
app.use('/images', express_1.default.static(imagesDir));
// Temporarily disable rate limiting for development
// app.use(apiRateLimit); // Apply rate limiting to all routes
// Routes
app.use('/api', reviews_1.default);
app.use('/api', vendorAuth_1.default);
app.use('/api', adminAuth_1.default);
app.use('/api', clientAuth_1.default);
app.use('/api', profile_1.default);
app.use('/api', adminVendors_1.default);
app.use('/api', adminClients_1.default);
app.use('/api', adminReports_1.default);
app.use('/api', adminServices_1.default);
app.use('/api', adminReviews_1.default);
app.use('/api', adminSettings_1.default);
app.use('/api', adminPermissions_1.default);
app.use('/api', vendorServices_1.default);
app.use('/api/services', services_1.default);
app.use('/api/favorites', favorites_1.default);
app.use('/api/reviews', reviews_2.default);
app.use('/api/wedding-profile', weddingProfile_1.default);
app.use('/api/availability', availability_1.default);
app.use('/api', imageUpload_1.default);
app.use('/api/images', imageRoutes_1.default);
console.log('Using real reviews with database connection');
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
//# sourceMappingURL=server.js.map