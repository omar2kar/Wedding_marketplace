import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { vendorAuthMiddleware } from '../middleware/vendorAuth';

const router = Router();

// In-memory storage for reviews (will reset on server restart)
let mockReviews: any[] = [
  {
    id: 1,
    clientId: 1,
    vendorId: 1,
    serviceId: 1,
    rating: 5,
    comment: 'خدمة ممتازة وفريق محترف! أنصح بالتعامل معهم بشدة',
    vendorReply: 'شكراً لثقتكم بنا، سعداء بخدمتكم',
    hasPurchased: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clientName: 'أحمد محمد',
    serviceName: 'تصوير الأفراح',
    purchaseDate: new Date().toISOString()
  },
  {
    id: 2,
    clientId: 2,
    vendorId: 1,
    serviceId: 1,
    rating: 4,
    comment: 'جودة عالية ودقة في المواعيد',
    vendorReply: null,
    hasPurchased: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    clientName: 'سارة أحمد',
    serviceName: 'تصوير الأفراح',
    purchaseDate: new Date(Date.now() - 172800000).toISOString()
  }
];

let nextReviewId = 3;

// Check purchase status (mock)
router.get('/services/:serviceId/purchase-status', authMiddleware, async (_req: Request, res: Response) => {
  // Always allow reviews in mock mode
  res.json({
    hasPurchased: true,
    purchaseDate: new Date().toISOString(),
    bookingId: 1,
    canReview: true,
    hasReviewed: false
  });
});

// Add a review (mock)
router.post('/services/:serviceId/reviews', authMiddleware, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { serviceId } = req.params;
    const { rating, comment, vendorId } = req.body;
    
    console.log('Mock: Adding review:', { serviceId, rating, comment, vendorId });
    
    // Validate
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }
    
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ error: 'Comment must be at least 10 characters' });
    }
    
    const newReview = {
      id: nextReviewId++,
      clientId: req.user?.id || 1,
      vendorId: vendorId || 1,
      serviceId: parseInt(serviceId),
      rating,
      comment,
      vendorReply: null,
      hasPurchased: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientName: (req.user as any)?.name || 'عميل جديد',
      serviceName: 'خدمة رقم ' + serviceId,
      purchaseDate: new Date().toISOString()
    };
    
    mockReviews.unshift(newReview); // Add to beginning
    
    console.log('Mock: Review added successfully, total reviews:', mockReviews.length);
    
    res.status(201).json({
      id: newReview.id,
      user: newReview.clientName,
      rating: newReview.rating,
      comment: newReview.comment,
      date: newReview.createdAt
    });
  } catch (error) {
    console.error('Mock: Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Get vendor reviews (mock)
router.get('/vendor/reviews', vendorAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const vendorId = req.vendor?.id || 1;
    console.log('Mock: Fetching reviews for vendor:', vendorId);
    
    // Filter reviews for this vendor
    const vendorReviews = mockReviews.filter(r => r.vendorId === vendorId);
    
    console.log('Mock: Returning', vendorReviews.length, 'reviews');
    res.json(vendorReviews);
  } catch (error) {
    console.error('Mock: Error fetching vendor reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add vendor reply (mock)
router.post('/vendor/reviews/:reviewId/reply', vendorAuthMiddleware, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;
    const vendorId = req.vendor?.id || 1;
    
    const review = mockReviews.find(r => r.id === parseInt(reviewId));
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.vendorId !== vendorId) {
      return res.status(403).json({ error: 'You can only reply to your own reviews' });
    }
    
    review.vendorReply = reply;
    review.replyDate = new Date().toISOString();
    
    console.log('Mock: Reply added to review', reviewId);
    res.json({ message: 'Reply added successfully' });
  } catch (error) {
    console.error('Mock: Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Update vendor reply (mock)
router.put('/vendor/reviews/:reviewId/reply', vendorAuthMiddleware, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;
    const vendorId = req.vendor?.id || 1;
    
    const review = mockReviews.find(r => r.id === parseInt(reviewId));
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.vendorId !== vendorId) {
      return res.status(403).json({ error: 'You can only update your own replies' });
    }
    
    review.vendorReply = reply;
    review.replyDate = new Date().toISOString();
    
    console.log('Mock: Reply updated for review', reviewId);
    res.json({ message: 'Reply updated successfully' });
  } catch (error) {
    console.error('Mock: Error updating reply:', error);
    res.status(500).json({ error: 'Failed to update reply' });
  }
});

// Delete vendor reply (mock)
router.delete('/vendor/reviews/:reviewId/reply', vendorAuthMiddleware, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { reviewId } = req.params;
    const vendorId = req.vendor?.id || 1;
    
    const review = mockReviews.find(r => r.id === parseInt(reviewId));
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.vendorId !== vendorId) {
      return res.status(403).json({ error: 'You can only delete your own replies' });
    }
    
    review.vendorReply = null;
    review.replyDate = null;
    
    console.log('Mock: Reply deleted from review', reviewId);
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Mock: Error deleting reply:', error);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});

// Get public reviews for a service (mock)
router.get('/services/:serviceId/reviews', async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    
    const serviceReviews = mockReviews.filter(r => r.serviceId === parseInt(serviceId));
    
    console.log('Mock: Returning', serviceReviews.length, 'reviews for service', serviceId);
    res.json(serviceReviews);
  } catch (error) {
    console.error('Mock: Error fetching service reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

export default router;
