import { request } from './request';

export interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  date: string; // YYYY-MM-DD
}

// Fetch all reviews for a service (public - no authentication required)
export const getReviews = async (serviceId: number): Promise<Review[]> => {
  try {
    console.log(`Fetching reviews for service ${serviceId}`);
    
    // Direct fetch to backend API without authentication
    const response = await fetch(`http://localhost:5000/api/reviews/services/${serviceId}/reviews`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reviews = await response.json();
    console.log(`Received ${reviews.length} reviews from API`);
    
    // Transform the data to match our Review interface
    return reviews.map((review: any) => ({
      id: review.id,
      user: review.user || 'Anonymous User',
      rating: review.rating,
      comment: review.comment,
      date: new Date(review.date).toISOString().slice(0, 10)
    }));
  } catch (err) {
    console.error('Failed to fetch reviews from API:', err);
    // Return empty array instead of localStorage fallback for cleaner behavior
    return [];
  }
};

// Add a new review (returns created review)
export const addReview = async (
  serviceId: number,
  payload: Omit<Review, 'id' | 'date' | 'user'> & { comment: string; rating: number },
): Promise<Review> => {
  // Check if running in browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    throw new Error('localStorage غير متاح');
  }

  // Get client authentication token
  const token = localStorage.getItem('clientToken');
  if (!token) {
    throw new Error('يجب تسجيل الدخول لإضافة تقييم');
  }

  // Get client data from token payload or make API call to get client info
  let clientId;
  try {
    // Try to get client profile from API using token
    const response = await fetch('http://localhost:5000/api/client/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const clientProfile = await response.json();
      clientId = clientProfile.id;
    } else {
      throw new Error('فشل في الحصول على بيانات العميل');
    }
  } catch (error) {
    // Fallback: try localStorage
    const clientData = localStorage.getItem('clientData');
    if (clientData) {
      try {
        const client = JSON.parse(clientData);
        clientId = client.id;
      } catch (parseError) {
        throw new Error('بيانات العميل غير صالحة');
      }
    } else {
      throw new Error('بيانات العميل غير متوفرة');
    }
  }

  if (!clientId) {
    throw new Error('معرف العميل غير موجود');
  }

  try {
    console.log(`Adding review for service ${serviceId}:`, payload);
    
    // Prepare the payload with client ID and correct field names for backend
    const reviewPayload = {
      clientId: clientId,
      rating: payload.rating,
      reviewText: payload.comment
    };

    const response = await fetch(`http://localhost:5000/api/reviews/services/${serviceId}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reviewPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'فشل في إضافة التقييم');
    }

    const result = await response.json();
    console.log('Review added successfully:', result);
    
    // Return the review in the expected format using client name from backend response
    const newReview: Review = {
      id: result.reviewId,
      user: result.clientName || 'Client',
      rating: payload.rating,
      comment: payload.comment,
      date: new Date().toISOString().slice(0, 10)
    };
    
    return newReview;
  } catch (err: any) {
    console.warn('API failed, using localStorage fallback for review submission');
    
    // Fallback: Save review to localStorage for vendor to see
    const newReview: Review = {
      id: Date.now(),
      user: 'Anonymous User',
      rating: payload.rating,
      comment: payload.comment,
      date: new Date().toISOString().slice(0, 10),
    };
    
    // Save to service reviews
    const serviceReviews = localStorage.getItem(`serviceReviews_${serviceId}`);
    const reviews = serviceReviews ? JSON.parse(serviceReviews) : [];
    reviews.unshift(newReview);
    localStorage.setItem(`serviceReviews_${serviceId}`, JSON.stringify(reviews));
    
    // Also save to vendor reviews for dashboard
    const vendorReviews = localStorage.getItem('vendorReviews');
    const vReviews = vendorReviews ? JSON.parse(vendorReviews) : [];
    
    // Get service name and vendor ID from vendor services or vendor data
    const vendorServices = localStorage.getItem('vendorServices');
    const vendorData = localStorage.getItem('vendorData');
    let serviceName = 'Service';
    let vendorId = 1; // Default vendor ID
    
    // Try to get vendor ID from logged in vendor data first
    if (vendorData) {
      const vendor = JSON.parse(vendorData);
      vendorId = vendor.id || 1;
    }
    
    if (vendorServices) {
      const services = JSON.parse(vendorServices);
      const service = services.find((s: any) => s.id === serviceId);
      if (service) {
        serviceName = service.name || service.title || 'Service';
        // Use service's vendor ID if available, otherwise use logged in vendor ID
        vendorId = service.vendorId || vendorId;
      }
    }
    
    const vendorReview = {
      id: newReview.id,
      clientId: 1,
      clientName: newReview.user,
      serviceId,
      serviceName,
      vendorId, // Add vendor ID to associate review with specific vendor
      rating: newReview.rating,
      comment: newReview.comment,
      vendorReply: null,
      hasPurchased: true,
      purchaseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    vReviews.unshift(vendorReview);
    localStorage.setItem('vendorReviews', JSON.stringify(vReviews));
    
    // Notify other tabs/components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'vendorReviews',
      newValue: JSON.stringify(vReviews)
    }));
    
    return newReview;
  }
};

// Delete a review by id (if allowed)
export const deleteReview = (serviceId: number, reviewId: number) =>
  request<void>(`/services/${serviceId}/reviews/${reviewId}`, { method: 'DELETE' });
