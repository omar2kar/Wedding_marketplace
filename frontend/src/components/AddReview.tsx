import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import RatingStars from './RatingStars';
import toast from 'react-hot-toast';

interface AddReviewProps {
  serviceId: number;
  vendorId: number;
  onReviewAdded?: () => void;
}

interface PurchaseStatus {
  hasPurchased: boolean;
  purchaseDate?: string;
  bookingId?: number;
  canReview: boolean;
  hasReviewed: boolean;
}

const AddReview: React.FC<AddReviewProps> = ({ serviceId, vendorId, onReviewAdded }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus | null>(null);

  useEffect(() => {
    checkPurchaseStatus();
  }, [serviceId]);

  const checkPurchaseStatus = async () => {
    try {
      setCheckingPurchase(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setPurchaseStatus({
          hasPurchased: false,
          canReview: false,
          hasReviewed: false
        });
        return;
      }

      const response = await axios.get(`/services/${serviceId}/purchase-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPurchaseStatus(response.data);
    } catch (error) {
      console.error('Error checking purchase status:', error);
      setPurchaseStatus({
        hasPurchased: false,
        canReview: false,
        hasReviewed: false
      });
    } finally {
      setCheckingPurchase(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    if (comment.length < 10) {
      toast.error('Comment must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      console.log('Submitting review:', { rating, comment, serviceId, vendorId });
      
      const response = await axios.post(
        `/services/${serviceId}/reviews`,
        {
          rating,
          comment,
          vendorId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Review response:', response.data);

      toast.success('Review added successfully');
      setRating(0);
      setComment('');
      
      // Update purchase status
      await checkPurchaseStatus();
      
      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      if (error.response?.status === 403) {
        toast.error('You must purchase this service first before adding a review');
      } else if (error.response?.status === 409) {
        toast.error('You have already reviewed this service');
      } else {
        toast.error('An error occurred while adding the review');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingPurchase) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  // User not logged in
  if (!purchaseStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Login to Add Review</h3>
          <p className="text-gray-500">You must login to be able to review this service</p>
        </div>
      </div>
    );
  }

  // User has already reviewed
  if (purchaseStatus.hasReviewed) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Thank you!</h3>
          <p className="text-gray-500">You have already reviewed this service</p>
        </div>
      </div>
    );
  }

  // User hasn't purchased the service
  if (!purchaseStatus.hasPurchased) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5 ml-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                Only customers who purchased this service can add a review
              </h3>
              <p className="text-sm text-yellow-700">
                Book this service first to be able to review it after service completion
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Service not completed yet
  if (!purchaseStatus.canReview) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mt-0.5 ml-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Service not completed yet
              </h3>
              <p className="text-sm text-blue-700">
                You can add a review after service completion on {purchaseStatus.purchaseDate ? new Date(purchaseStatus.purchaseDate).toLocaleDateString('en-US') : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User can review
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Review</h3>
      
      <div className="space-y-4">
        {/* Purchase verification badge */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-800">
              Verified Customer - Service completed on {purchaseStatus.purchaseDate ? new Date(purchaseStatus.purchaseDate).toLocaleDateString('en-US') : ''}
            </span>
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex items-center gap-3">
            <RatingStars rating={rating} onChange={setRating} size={8} />
            <span className="text-sm text-gray-500">
              {rating === 0 && 'Choose your rating'}
              {rating === 1 && 'Very Bad'}
              {rating === 2 && 'Bad'}
              {rating === 3 && 'Average'}
              {rating === 4 && 'Good'}
              {rating === 5 && 'Excellent'}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this service..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="mt-1 text-xs text-gray-500 text-left">
            {comment.length}/500
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Review Guidelines:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Be honest and objective in your review</li>
            <li>• Mention pros and cons if any</li>
            <li>• Avoid using offensive or inappropriate language</li>
            <li>• Your review will help others make decisions</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitReview}
          disabled={loading || rating === 0 || !comment.trim()}
          className={`w-full py-3 rounded-lg font-medium transition ${
            loading || rating === 0 || !comment.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Review'
          )}
        </button>
      </div>
    </div>
  );
};

export default AddReview;
