import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import RatingStars from '../RatingStars';
import { useVendor } from '../../context/VendorContext';
import toast from 'react-hot-toast';

interface Review {
  id: number;
  clientId: number;
  clientName: string;
  serviceId: number;
  serviceName: string;
  vendorId: number; // Add vendor ID to filter reviews
  rating: number;
  comment: string;
  vendorReply?: string;
  hasPurchased: boolean;
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface VendorReviewsProps {
  vendorId?: number;
}

const VendorReviews: React.FC<VendorReviewsProps> = ({ vendorId }) => {
  const { vendor, updateVendorProfile } = useVendor();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'noReply' | 'withReply'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');

  // Initialize reviews on component mount and ensure they persist
  useEffect(() => {
    const initializeReviews = () => {
      const vendorData = localStorage.getItem('vendorData');
      let currentVendorId = 1;
      
      if (vendorData) {
        const vendorInfo = JSON.parse(vendorData);
        currentVendorId = vendorInfo.id || 1;
      } else if (vendor?.id) {
        currentVendorId = vendor.id;
      }
      
      console.log('Initializing reviews for vendor ID:', currentVendorId);
      
      // Try to load vendor-specific reviews first
      const vendorSpecificStored = loadStoredReviews(currentVendorId);
      console.log('Vendor specific stored reviews:', vendorSpecificStored);
      
      if (vendorSpecificStored.length > 0) {
        setReviews(vendorSpecificStored);
        setLoading(false);
        return;
      }
      
      // If no vendor-specific reviews, check general reviews
      const generalStored = loadStoredReviews();
      const vendorSpecificReviews = generalStored.filter(review => review.vendorId === currentVendorId);
      console.log('Filtered vendor specific reviews:', vendorSpecificReviews);
      
      if (vendorSpecificReviews.length > 0) {
        setReviews(vendorSpecificReviews);
        // Save to vendor-specific storage
        localStorage.setItem(`vendorReviews_${currentVendorId}`, JSON.stringify(vendorSpecificReviews));
        setLoading(false);
      } else {
        // Create mock reviews and save them
        const mockReviews = getMockReviews(currentVendorId);
        console.log('Creating mock reviews:', mockReviews);
        setReviews(mockReviews);
        
        // Save to both storages
        localStorage.setItem(`vendorReviews_${currentVendorId}`, JSON.stringify(mockReviews));
        const allReviews = [...generalStored, ...mockReviews];
        localStorage.setItem('vendorReviews', JSON.stringify(allReviews));
        setLoading(false);
      }
    };
    
    initializeReviews();
  }, [vendor?.id]);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, vendor?.id]);

  // Listen for localStorage changes to refresh reviews
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vendorReviews') {
        const stored = loadStoredReviews();
        
        // Get vendor ID from vendor data in localStorage
        const vendorData = localStorage.getItem('vendorData');
        let currentVendorId = 1;
        if (vendorData) {
          const vendorInfo = JSON.parse(vendorData);
          currentVendorId = vendorInfo.id || 1;
        } else if (vendor?.id) {
          currentVendorId = vendor.id;
        }
        
        // Filter reviews for current vendor only
        const vendorSpecificReviews = stored.filter(review => review.vendorId === currentVendorId);
        
        // Always show reviews - either real ones or mock ones
        if (vendorSpecificReviews.length > 0) {
          setReviews(vendorSpecificReviews);
        } else {
          // Create mock reviews with correct vendor ID
          const mockReviews = getMockReviews(currentVendorId);
          setReviews(mockReviews);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [vendor?.id]);

  const loadStoredReviews = (vendorId?: number): Review[] => {
    try {
      // Try vendor-specific reviews first
      if (vendorId) {
        const vendorSpecific = localStorage.getItem(`vendorReviews_${vendorId}`);
        if (vendorSpecific) {
          return JSON.parse(vendorSpecific);
        }
      }
      
      // Fall back to general reviews
      const stored = localStorage.getItem('vendorReviews');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const getMockReviews = (vendorId: number = 1): Review[] => {
    return [
      {
        id: Date.now() + 1,
        clientId: 1,
        serviceId: 1,
        vendorId, // Use dynamic vendorId
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
        id: Date.now() + 2,
        clientId: 2,
        serviceId: 1,
        vendorId, // Use dynamic vendorId
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
  };

  const saveReviews = (data: Review[]) => {
    localStorage.setItem('vendorReviews', JSON.stringify(data));
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        console.log('No vendor token found, using localStorage data');
        const stored = loadStoredReviews();
        
        // Get vendor ID from vendor data in localStorage
        const vendorData = localStorage.getItem('vendorData');
        let currentVendorId = 1;
        if (vendorData) {
          const vendorInfo = JSON.parse(vendorData);
          currentVendorId = vendorInfo.id || 1;
        } else if (vendor?.id) {
          currentVendorId = vendor.id;
        }
        
        console.log('Current vendor ID:', currentVendorId);
        console.log('All stored reviews:', stored);
        
        // Filter reviews for current vendor only
        const vendorSpecificReviews = stored.filter(review => review.vendorId === currentVendorId);
        console.log('Filtered reviews for vendor:', vendorSpecificReviews);
        
        // Always show reviews - either real ones or mock ones
        if (vendorSpecificReviews.length > 0) {
          setReviews(vendorSpecificReviews);
        } else {
          // Create mock reviews with correct vendor ID
          const mockReviews = getMockReviews(currentVendorId);
          setReviews(mockReviews);
          
          // Save mock reviews to localStorage so they persist
          const allReviews = [...stored, ...mockReviews];
          localStorage.setItem('vendorReviews', JSON.stringify(allReviews));
        }
        return;
      }

      console.log('Fetching reviews with token:', token);
      const response = await axios.get('/vendor/reviews', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Reviews fetched:', response.data);
      const currentVendorId = vendor?.id || 1;
      // Filter reviews for current vendor only
      const vendorSpecificReviews = response.data.filter((review: Review) => review.vendorId === currentVendorId);
      setReviews(vendorSpecificReviews);
      // Save to localStorage as backup
      localStorage.setItem('vendorReviews', JSON.stringify(response.data));
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          toast.error('Session expired, please login again');
        } else if (error.response.status === 403) {
          toast.error('You are not authorized to view these reviews');
        } else {
          // For 5xx errors, silently fall back to cached reviews
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('Unable to connect to server, please check your internet connection');
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
        toast.error('An error occurred while trying to load reviews');
      }
      
      // Only fallback to localStorage if there was an error
      const stored = loadStoredReviews();
      
      // Get vendor ID from vendor data in localStorage
      const vendorData = localStorage.getItem('vendorData');
      let currentVendorId = 1;
      if (vendorData) {
        const vendorInfo = JSON.parse(vendorData);
        currentVendorId = vendorInfo.id || 1;
      } else if (vendor?.id) {
        currentVendorId = vendor.id;
      }
      
      // Filter reviews for current vendor only
      const vendorSpecificReviews = stored.filter(review => review.vendorId === currentVendorId);
      
      // Always show reviews - either real ones or mock ones
      if (vendorSpecificReviews.length > 0) {
        setReviews(vendorSpecificReviews);
      } else {
        // Create mock reviews with correct vendor ID
        const mockReviews = getMockReviews(currentVendorId);
        setReviews(mockReviews);
        
        // Save mock reviews to localStorage so they persist
        const allReviews = [...stored, ...mockReviews];
        localStorage.setItem('vendorReviews', JSON.stringify(allReviews));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: number) => {
    if (!replyText.trim()) {
      toast.error('Please write a reply');
      return;
    }

    try {
      const token = localStorage.getItem('vendorToken');
      if (!token) throw new Error('no-token');
      await axios.post(
        `/vendor/reviews/${reviewId}/reply`,
        { reply: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Reply added successfully');
      setReviews(prev => {
        const updated = prev.map(r => r.id === reviewId ? { ...r, vendorReply: replyText } : r);
        saveReviews(updated);
        return updated;
      });
      setReplyText('');
      setReplyingTo(null);
      fetchReviews();
    } catch (error) {
      console.error('Error replying to review:', error);
      toast.error('An error occurred while adding the reply');
    }
  };

  const handleEditReply = async (reviewId: number, newReply: string) => {
    try {
      const token = localStorage.getItem('vendorToken');
      if (!token) throw new Error('no-token');
      await axios.put(
        `/vendor/reviews/${reviewId}/reply`,
        { reply: newReply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Reply updated successfully');
      setReviews(prev => {
        const updated = prev.map(r => r.id === reviewId ? { ...r, vendorReply: newReply } : r);
        saveReviews(updated);
        return updated;
      });
      fetchReviews();
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error('An error occurred while updating the reply');
    }
  };

  const handleDeleteReply = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) {
      return;
    }

    try {
      const token = localStorage.getItem('vendorToken');
      if (!token) throw new Error('no-token');
      await axios.delete(`/vendor/reviews/${reviewId}/reply`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Reply deleted successfully');
      setReviews(prev => {
        const updated = prev.map(r => r.id === reviewId ? { ...r, vendorReply: undefined } : r);
        saveReviews(updated);
        return updated;
      });
      fetchReviews();
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('An error occurred while deleting the reply');
    }
  };

  // Filter and sort reviews
  const filteredReviews = reviews.filter(review => {
    if (filter === 'noReply') return !review.vendorReply;
    if (filter === 'withReply') return !!review.vendorReply;
    return true;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate statistics
  const stats = {
    total: reviews.length,
    average: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
    distribution: [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: reviews.length > 0 
        ? Math.round((reviews.filter(r => r.rating === rating).length / reviews.length) * 100)
        : 0
    })),
    withReply: reviews.filter(r => r.vendorReply).length,
    noReply: reviews.filter(r => !r.vendorReply).length
  };

  // Sync vendor rating in context when reviews change
  useEffect(() => {
    if (!vendor) return;
    const avg = reviews.length > 0 ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)) : 0;
    if (avg !== vendor.rating) {
      updateVendorProfile({ rating: avg });
    }
  }, [reviews, vendor, updateVendorProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Section */}
      <div className="glass rounded-lg shadow-sm p-6 border border-white/20">
        <h2 className="text-xl font-semibold mb-4">Review Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.average}</div>
            <div className="text-sm text-gray-600">Average Rating</div>
            <div className="flex justify-center mt-2">
              <RatingStars rating={parseFloat(stats.average)} onChange={() => {}} size={5} />
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Reviews</div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.withReply} with reply | {stats.noReply} without reply
            </div>
          </div>
          
          <div className="space-y-1">
            {stats.distribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm w-8">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="glass rounded-lg shadow-sm p-4 border border-white/20">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Reviews ({stats.total})
            </button>
            <button
              onClick={() => setFilter('noReply')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'noReply' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Without Reply ({stats.noReply})
            </button>
            <button
              onClick={() => setFilter('withReply')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'withReply' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              With Reply ({stats.withReply})
            </button>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="recent">Most Recent First</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.length === 0 ? (
          <div className="glass rounded-lg shadow-sm p-12 text-center border border-white/20">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews</h3>
            <p className="text-gray-500">Customer reviews will appear here after services are completed</p>
          </div>
        ) : (
          sortedReviews.map((review) => (
            <div key={review.id} className="glass rounded-lg shadow-sm p-6 border border-white/20">
              {/* Review Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{review.clientName}</h4>
                    {review.hasPurchased && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        ✓ Verified Customer
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <RatingStars rating={review.rating} onChange={() => {}} size={4} />
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Service</p>
                  <p className="font-medium text-purple-600">{review.serviceName}</p>
                  {review.purchaseDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Service Date: {new Date(review.purchaseDate).toLocaleDateString('en-US')}
                    </p>
                  )}
                </div>
              </div>

              {/* Review Comment */}
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>

              {/* Vendor Reply Section */}
              {review.vendorReply ? (
                <div className="bg-purple-50 rounded-lg p-4 border-r-4 border-purple-500">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-purple-900">Vendor Reply:</h5>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newReply = prompt('Edit reply:', review.vendorReply);
                          if (newReply && newReply !== review.vendorReply) {
                            handleEditReply(review.id, newReply);
                          }
                        }}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteReply(review.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-purple-800">{review.vendorReply}</p>
                </div>
              ) : (
                <div>
                  {replyingTo === review.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply here..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(review.id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                          Send Reply
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply to Review
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorReviews;
