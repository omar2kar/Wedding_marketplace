import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';

// Database connection (you may need to adjust this based on your existing DB setup)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace'
};

export interface ServiceImage {
  id: number;
  service_id: number;
  file_path: string;
  original_filename?: string;
  uploader_id?: number;
  upload_timestamp: Date;
  display_order: number;
  is_primary: boolean;
  file_size?: number;
  mime_type?: string;
}

export class ImageService {
  private imagesDir: string;

  constructor() {
    // Use frontend/public/images directory for serving static files
    this.imagesDir = path.join(__dirname, '../../../frontend/public/images');
    this.ensureImagesDirectory();
  }

  private ensureImagesDirectory(): void {
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  private async getDbConnection() {
    return await mysql.createConnection(dbConfig);
  }

  generateUniqueFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const uuid = uuidv4();
    const timestamp = Date.now();
    return `${uuid}-${timestamp}${ext}`;
  }

  validateImageFile(file: Express.Multer.File): { valid: boolean; error?: string } {
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
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExtensions.includes(ext)) {
      return { valid: false, error: 'Invalid file extension' };
    }

    return { valid: true };
  }

  async saveImageFile(file: Express.Multer.File): Promise<string> {
    const filename = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.imagesDir, filename);
    
    await fs.promises.writeFile(filePath, file.buffer);
    return `/images/${filename}`;
  }

  async deleteImageFile(filePath: string): Promise<void> {
    // Extract filename from path (e.g., "/images/filename.jpg" -> "filename.jpg")
    const filename = path.basename(filePath);
    const fullPath = path.join(this.imagesDir, filename);
    
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  async saveImageToDatabase(
    serviceId: number,
    filePath: string,
    originalFilename: string,
    uploaderId?: number,
    fileSize?: number,
    mimeType?: string,
    displayOrder?: number,
    isPrimary?: boolean
  ): Promise<number> {
    const connection = await this.getDbConnection();
    
    try {
      const [result] = await connection.execute(
        `INSERT INTO service_images 
         (service_id, file_path, original_filename, uploader_id, file_size, mime_type, display_order, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [serviceId, filePath, originalFilename, uploaderId, fileSize, mimeType, displayOrder || 0, isPrimary || false]
      );
      
      return (result as any).insertId;
    } finally {
      await connection.end();
    }
  }

  async getServiceImages(serviceId: number): Promise<ServiceImage[]> {
    const connection = await this.getDbConnection();
    
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM service_images WHERE service_id = ? ORDER BY display_order ASC, upload_timestamp ASC',
        [serviceId]
      );
      
      return rows as ServiceImage[];
    } finally {
      await connection.end();
    }
  }

  async deleteImageFromDatabase(imageId: number, serviceId?: number): Promise<ServiceImage | null> {
    const connection = await this.getDbConnection();
    
    try {
      // First get the image info
      const whereClause = serviceId ? 'id = ? AND service_id = ?' : 'id = ?';
      const params = serviceId ? [imageId, serviceId] : [imageId];
      
      const [rows] = await connection.execute(
        `SELECT * FROM service_images WHERE ${whereClause}`,
        params
      );
      
      const images = rows as ServiceImage[];
      if (images.length === 0) {
        return null;
      }
      
      const image = images[0];
      
      // Delete from database
      await connection.execute(
        `DELETE FROM service_images WHERE ${whereClause}`,
        params
      );
      
      return image;
    } finally {
      await connection.end();
    }
  }

  async countServiceImages(serviceId: number): Promise<number> {
    const connection = await this.getDbConnection();
    
    try {
      const [rows] = await connection.execute(
        'SELECT COUNT(*) as count FROM service_images WHERE service_id = ?',
        [serviceId]
      );
      
      return (rows as any)[0].count;
    } finally {
      await connection.end();
    }
  }

  async setPrimaryImage(imageId: number, serviceId: number): Promise<boolean> {
    const connection = await this.getDbConnection();
    
    try {
      await connection.beginTransaction();
      
      // Remove primary flag from all images of this service
      await connection.execute(
        'UPDATE service_images SET is_primary = FALSE WHERE service_id = ?',
        [serviceId]
      );
      
      // Set the specified image as primary
      const [result] = await connection.execute(
        'UPDATE service_images SET is_primary = TRUE WHERE id = ? AND service_id = ?',
        [imageId, serviceId]
      );
      
      await connection.commit();
      return (result as any).affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  }

  async updateImageOrder(imageId: number, serviceId: number, newOrder: number): Promise<boolean> {
    const connection = await this.getDbConnection();
    
    try {
      const [result] = await connection.execute(
        'UPDATE service_images SET display_order = ? WHERE id = ? AND service_id = ?',
        [newOrder, imageId, serviceId]
      );
      
      return (result as any).affectedRows > 0;
    } finally {
      await connection.end();
    }
  }
}

export const imageService = new ImageService();
