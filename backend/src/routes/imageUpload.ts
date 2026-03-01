import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for image upload
const imagesDir = path.join(__dirname, '../../../frontend/public/images');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    const fileName = `${timestamp}_${randomString}${ext}`;
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
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// Upload single image
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const filePath = `/images/${req.file.filename}`;
    
    console.log('Image uploaded successfully:', filePath);
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      filePath: filePath,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Delete image
router.delete('/delete-image/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(imagesDir, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Image deleted successfully:', fileName);
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Serve static images (this is handled by express.static in main server)
// But we can add a route to check if image exists
router.get('/check-image/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(imagesDir, fileName);
    
    if (fs.existsSync(filePath)) {
      res.json({ exists: true, path: `/images/${fileName}` });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking image:', error);
    res.status(500).json({ error: 'Failed to check image' });
  }
});

export default router;
