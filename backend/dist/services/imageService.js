"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageService = exports.ImageService = void 0;
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const promise_1 = __importDefault(require("mysql2/promise"));
// Database connection (you may need to adjust this based on your existing DB setup)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wedding_marketplace'
};
class ImageService {
    constructor() {
        // Use frontend/public/images directory for serving static files
        this.imagesDir = path_1.default.join(__dirname, '../../../frontend/public/images');
        this.ensureImagesDirectory();
    }
    ensureImagesDirectory() {
        if (!fs_1.default.existsSync(this.imagesDir)) {
            fs_1.default.mkdirSync(this.imagesDir, { recursive: true });
        }
    }
    async getDbConnection() {
        return await promise_1.default.createConnection(dbConfig);
    }
    generateUniqueFilename(originalFilename) {
        const ext = path_1.default.extname(originalFilename);
        const uuid = (0, uuid_1.v4)();
        const timestamp = Date.now();
        return `${uuid}-${timestamp}${ext}`;
    }
    validateImageFile(file) {
        // Check file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return { valid: false, error: 'File size exceeds 10MB limit' };
        }
        // Check MIME type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' };
        }
        // Check file extension
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        if (!allowedExtensions.includes(ext)) {
            return { valid: false, error: 'Invalid file extension' };
        }
        return { valid: true };
    }
    async saveImageFile(file) {
        const filename = this.generateUniqueFilename(file.originalname);
        const filePath = path_1.default.join(this.imagesDir, filename);
        await fs_1.default.promises.writeFile(filePath, file.buffer);
        return `/images/${filename}`;
    }
    async deleteImageFile(filePath) {
        // Extract filename from path (e.g., "/images/filename.jpg" -> "filename.jpg")
        const filename = path_1.default.basename(filePath);
        const fullPath = path_1.default.join(this.imagesDir, filename);
        if (fs_1.default.existsSync(fullPath)) {
            await fs_1.default.promises.unlink(fullPath);
        }
    }
    async saveImageToDatabase(serviceId, filePath, originalFilename, uploaderId, fileSize, mimeType, displayOrder, isPrimary) {
        const connection = await this.getDbConnection();
        try {
            const [result] = await connection.execute(`INSERT INTO service_images 
         (service_id, file_path, original_filename, uploader_id, file_size, mime_type, display_order, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [serviceId, filePath, originalFilename, uploaderId, fileSize, mimeType, displayOrder || 0, isPrimary || false]);
            return result.insertId;
        }
        finally {
            await connection.end();
        }
    }
    async getServiceImages(serviceId) {
        const connection = await this.getDbConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM service_images WHERE service_id = ? ORDER BY display_order ASC, upload_timestamp ASC', [serviceId]);
            return rows;
        }
        finally {
            await connection.end();
        }
    }
    async deleteImageFromDatabase(imageId, serviceId) {
        const connection = await this.getDbConnection();
        try {
            // First get the image info
            const whereClause = serviceId ? 'id = ? AND service_id = ?' : 'id = ?';
            const params = serviceId ? [imageId, serviceId] : [imageId];
            const [rows] = await connection.execute(`SELECT * FROM service_images WHERE ${whereClause}`, params);
            const images = rows;
            if (images.length === 0) {
                return null;
            }
            const image = images[0];
            // Delete from database
            await connection.execute(`DELETE FROM service_images WHERE ${whereClause}`, params);
            return image;
        }
        finally {
            await connection.end();
        }
    }
    async countServiceImages(serviceId) {
        const connection = await this.getDbConnection();
        try {
            const [rows] = await connection.execute('SELECT COUNT(*) as count FROM service_images WHERE service_id = ?', [serviceId]);
            return rows[0].count;
        }
        finally {
            await connection.end();
        }
    }
    async setPrimaryImage(imageId, serviceId) {
        const connection = await this.getDbConnection();
        try {
            await connection.beginTransaction();
            // Remove primary flag from all images of this service
            await connection.execute('UPDATE service_images SET is_primary = FALSE WHERE service_id = ?', [serviceId]);
            // Set the specified image as primary
            const [result] = await connection.execute('UPDATE service_images SET is_primary = TRUE WHERE id = ? AND service_id = ?', [imageId, serviceId]);
            await connection.commit();
            return result.affectedRows > 0;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            await connection.end();
        }
    }
    async updateImageOrder(imageId, serviceId, newOrder) {
        const connection = await this.getDbConnection();
        try {
            const [result] = await connection.execute('UPDATE service_images SET display_order = ? WHERE id = ? AND service_id = ?', [newOrder, imageId, serviceId]);
            return result.affectedRows > 0;
        }
        finally {
            await connection.end();
        }
    }
}
exports.ImageService = ImageService;
exports.imageService = new ImageService();
//# sourceMappingURL=imageService.js.map