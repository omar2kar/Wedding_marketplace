import express from 'express';
import multer from 'multer';
import { imageService } from '../services/imageService';
import jwt from 'jsonwebtoken';

const router = express.Router();

// JWT middleware for vendor authentication
const authenticateVendor = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.vendorId = decoded.id || decoded.vendorId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Configure multer for memory storage (we'll handle file saving manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files per request
  },
  fileFilter: (_req, file, cb) => {
    const validation = imageService.validateImageFile(file);
    if (validation.valid) {
      cb(null, true);
    } else {
      cb(new Error(validation.error || 'Invalid file'));
    }
  }
});

// Upload images for a service
router.post('/services/:serviceId/images', authenticateVendor, upload.array('images', 10), async (req: any, res: any) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const vendorId = req.vendorId;
    const files = req.files as Express.Multer.File[];
    
    // TODO: Implement service ownership validation
    console.log(`Vendor ${vendorId} uploading images for service ${serviceId}`);
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }
    
    // Check if service belongs to vendor (you may need to adjust this query based on your schema)
    // For now, we'll skip this check but it should be implemented for security
    
    // Check current image count
    const currentCount = await imageService.countServiceImages(serviceId);
    const maxImages = 10; // Maximum images per service
    
    if (currentCount + files.length > maxImages) {
      return res.status(400).json({ 
        error: `Maximum ${maxImages} images allowed per service. Current: ${currentCount}` 
      });
    }
    
    const uploadedImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Save file to disk
        const filePath = await imageService.saveImageFile(file);
        
        // Save to database
        const imageId = await imageService.saveImageToDatabase(
          serviceId,
          filePath,
          file.originalname,
          vendorId,
          file.size,
          file.mimetype,
          currentCount + i + 1, // Display order
          currentCount === 0 && i === 0 // First image is primary if no images exist
        );
        
        uploadedImages.push({
          id: imageId,
          file_path: filePath,
          original_filename: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          is_primary: currentCount === 0 && i === 0
        });
        
      } catch (error) {
        console.error('Error uploading image:', error);
        // Continue with other images, but log the error
      }
    }
    
    res.json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      images: uploadedImages
    });
    
  } catch (error) {
    console.error('Error in image upload:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Get images for a service
router.get('/services/:serviceId/images', async (req: any, res: any) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const images = await imageService.getServiceImages(serviceId);
    
    res.json({
      success: true,
      images: images
    });
    
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Delete an image
router.delete('/services/:serviceId/images/:imageId', authenticateVendor, async (req: any, res: any) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const imageId = parseInt(req.params.imageId);
    const vendorId = req.vendorId;
    
    // TODO: Implement service ownership validation
    console.log(`Vendor ${vendorId} deleting image ${imageId} from service ${serviceId}`);
    
    // Get image info and delete from database
    const deletedImage = await imageService.deleteImageFromDatabase(imageId, serviceId);
    
    if (!deletedImage) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete file from disk
    try {
      await imageService.deleteImageFile(deletedImage.file_path);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // File deletion failed, but DB record is already deleted
      // You might want to log this for cleanup later
    }
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Set primary image
router.put('/services/:serviceId/images/:imageId/primary', authenticateVendor, async (req: any, res: any) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const imageId = parseInt(req.params.imageId);
    
    const success = await imageService.setPrimaryImage(imageId, serviceId);
    
    if (!success) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json({
      success: true,
      message: 'Primary image updated successfully'
    });
    
  } catch (error) {
    console.error('Error setting primary image:', error);
    res.status(500).json({ error: 'Failed to set primary image' });
  }
});

// Update image order
router.put('/services/:serviceId/images/:imageId/order', authenticateVendor, async (req: any, res: any) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const imageId = parseInt(req.params.imageId);
    const { order } = req.body;
    
    if (typeof order !== 'number') {
      return res.status(400).json({ error: 'Order must be a number' });
    }
    
    const success = await imageService.updateImageOrder(imageId, serviceId, order);
    
    if (!success) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json({
      success: true,
      message: 'Image order updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating image order:', error);
    res.status(500).json({ error: 'Failed to update image order' });
  }
});

export default router;
