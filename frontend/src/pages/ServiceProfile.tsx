import React, { useEffect, useState } from 'react';
import { useClient } from '../context/ClientContext';
import RatingStars from '../components/RatingStars';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import { AvailabilitySlot, BookingRequest, getAvailability, requestBooking } from '../api/availability';
import { Review, getReviews, addReview } from '../api/reviews';
import { Service, getServiceById } from '../api/services';
import { useTranslation } from 'react-i18next';
import { VerifiedIcon, StarIcon } from '../components/icons';
import { useParams } from 'react-router-dom';
import BookingModal from '../components/booking/BookingModal';

const ServiceProfile: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'availability'>('details');

  // Service data state
  const [service, setService] = useState<Service | null>(null);
  const [loadingService, setLoadingService] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState<BookingRequest>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientCompany: '',
    notes: ''
  });
  
  // New booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      
      try {
        setLoadingService(true);
        setServiceError(null);
        const serviceData = await getServiceById(Number(id));
        setService(serviceData);
      } catch (error) {
        console.error('Failed to load service:', error);
        setServiceError('Failed to load service details');
      } finally {
        setLoadingService(false);
      }
    };

    fetchService();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingAvail(true);
        const slots = await getAvailability(Number(id));
        setAvailability(slots);
      } catch (err) {
        console.error('Failed to load availability', err);
      } finally {
        setLoadingAvail(false);
      }
    })();
  }, [id]);

  const availableDates = availability
    .filter((d) => d.status === 'available')
    .map((d) => d.date);
  const bookedDates = availability
    .filter((d) => d.status === 'booked')
    .map((d) => d.date);
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const { client, isAuthenticated } = useClient();

  // Calculate average rating and review count from actual reviews
  const calculateRatingStats = () => {
    if (reviewList.length === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }
    
    const totalRating = reviewList.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviewList.length;
    
    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: reviewList.length
    };
  };

  const { averageRating, reviewCount } = calculateRatingStats();


  useEffect(() => {
    (async () => {
      try {
        setLoadingReviews(true);
        const revs = await getReviews(Number(id));
        setReviewList(revs);
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setLoadingReviews(false);
      }
    })();
  }, [id]);

  // Loading state
  if (loadingService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (serviceError || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
          <p className="text-gray-600 mb-4">{serviceError || 'The requested service could not be found.'}</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
              <div className="flex items-center mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {service.category}
                </span>
                <div className="flex items-center ml-4">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-gray-700">{averageRating.toFixed(1)}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-700">{reviewCount} {t('reviews')}</span>
                </div>
              </div>
              {service.vendor && (
                <div className="mt-3">
                  <p className="text-gray-600">
                    by <span className="font-medium text-gray-900">
                      {service.vendor.businessName || service.vendor.ownerName || 'Unknown Vendor'}
                    </span>
                  </p>
                  {service.vendor.city && service.vendor.country && (
                    <p className="text-sm text-gray-500">{service.vendor.city}, {service.vendor.country}</p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 md:mt-0 flex flex-col space-y-2">
              <div className="text-right">
                <span className="text-3xl font-bold text-purple-600">€{service.price}</span>
              </div>
              <button 
                onClick={() => setShowBookingModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-200 font-semibold"
              >
                🎉 {t('Book Now')}
              </button>
              <button 
                onClick={() => setActiveTab('availability')}
                className="px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-medium"
              >
                📅 {t('Check Availability')}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('Service Details')}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('Reviews')}
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'availability'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('Availability')}
            </button>
          </nav>
        </div>

        {/* Service Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('About This Service')}</h2>
                <p className="text-gray-700">{service.description}</p>
                {service.vendor && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-2">
                      About {service.vendor.businessName || service.vendor.ownerName || 'Vendor'}
                    </h3>
                    <p className="text-gray-600">{service.vendor.description || 'No description available.'}</p>
                    {service.vendor.website && (
                      <div className="mt-3">
                        <a 
                          href={service.vendor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                          Visit Website →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Gallery</h2>
                <div className="grid grid-cols-2 gap-2">
                  {service.images && service.images.length > 0 ? (
                    service.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden">
                        <img 
                          src={image} 
                          alt={`${service.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="aspect-square bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">Image {index + 1}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {service.vendor?.isVerified && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Verified Provider</h2>
                  <div className="flex items-center">
                    <VerifiedIcon className="text-green-500 mr-2" size={24} />
                    <span className="text-gray-700">This provider has been verified</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Reviews</h2>
            
            <div className="space-y-6">
              {loadingReviews ? (
                <p className="text-gray-500">Loading reviews...</p>
              ) : (
                reviewList.length === 0 ? (
                  <p className="text-gray-500">No reviews yet</p>
                ) : (
                  reviewList.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900">{review.user}</h3>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon 
                              key={i} 
                              className={`${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                              size={16}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 mt-2">{review.comment}</p>
                      <p className="text-sm text-gray-500 mt-2">{review.date}</p>
                    </div>
                  ))
                )
              )}
            </div>
            
            {/* Show review form only if user is logged in */}
            {!isAuthenticated ? (
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Login Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>You must be logged in as a client to add a review for this service</p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          type="button"
                          className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                          onClick={() => window.location.href = '/login'}
                        >
                          Login
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Review</h3>
                <div className="mb-4 text-sm text-gray-600">
                  Hello {client?.name || 'Client'}, you can add your review for this service
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating
                    </label>
                    <RatingStars rating={newRating} onChange={setNewRating} />
                  </div>
                  <div>
                    <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Comment
                    </label>
                    <textarea
                      id="review"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Write your review here... (at least 10 characters)"
                      minLength={10}
                    ></textarea>
                    <p className="mt-1 text-sm text-gray-500">
                      {newComment.length}/10 characters minimum
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={newRating === 0 || newComment.trim().length < 10}
                    onClick={async () => {
                      if (newRating === 0 || newComment.trim().length < 10) {
                        alert('Please select a rating and write a comment of at least 10 characters');
                        return;
                      }

                      try {
                        const created = await addReview(Number(id), { rating: newRating, comment: newComment });
                        setReviewList([created, ...reviewList]);
                        setNewRating(0);
                        setNewComment('');
                        alert('Review added successfully!');
                      } catch (err: any) {
                        console.error('Error adding review:', err);
                        alert(err.message || 'An error occurred while adding the review');
                      }
                    }}
                  >
                    {t('Submit Review')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('Check Availability')}</h2>

            {loadingAvail ? (
              <p className="text-gray-500">Loading availability...</p>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <AvailabilityCalendar
                  availableDates={availableDates}
                  bookedDates={bookedDates}
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
              </div>
            )}

            {selectedDate && !showBookingForm && (
              <div className="mt-6 bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">Selected Date: {selectedDate.toISOString().slice(0, 10)}</p>
                <button
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  onClick={() => setShowBookingForm(true)}
                >
                  Request Booking
                </button>
              </div>
            )}

            {showBookingForm && selectedDate && (
              <div className="mt-6 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
                <p className="text-sm text-gray-600 mb-4">Selected Date: {selectedDate.toISOString().slice(0, 10)}</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={bookingData.clientName}
                      onChange={(e) => setBookingData({...bookingData, clientName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={bookingData.clientPhone}
                      onChange={(e) => setBookingData({...bookingData, clientPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="+962 7X XXX XXXX"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={bookingData.clientEmail}
                      onChange={(e) => setBookingData({...bookingData, clientEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                    <textarea
                      value={bookingData.notes}
                      onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Any additional details you'd like to share..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-60"
                    disabled={!bookingData.clientName || !bookingData.clientPhone || !bookingData.clientEmail}
                    onClick={async () => {
                      if (!selectedDate) return;
                      if (!bookingData.clientName || !bookingData.clientPhone || !bookingData.clientEmail) {
                        alert('Please fill in all required fields');
                        return;
                      }
                      try {
                        await requestBooking(Number(id), selectedDate.toISOString().slice(0, 10), bookingData);
                        alert('Booking request sent successfully!');
                        const slots = await getAvailability(Number(id));
                        setAvailability(slots);
                        setSelectedDate(undefined);
                        setShowBookingForm(false);
                        setBookingData({
                          clientName: '',
                          clientPhone: '',
                          clientEmail: '',
                          clientCompany: '',
                          notes: ''
                        });
                      } catch (err) {
                        alert('Something went wrong');
                      }
                    }}
                  >
                    Confirm Booking
                  </button>
                  <button
                    className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    onClick={() => {
                      setShowBookingForm(false);
                      setBookingData({
                        clientName: '',
                        clientPhone: '',
                        clientEmail: '',
                        clientCompany: '',
                        notes: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        service={{
          id: service.id,
          name: service.name,
          price: service.price,
          category: service.category,
          vendor_id: service.vendorId || service.vendor?.id || 0,
          business_name: service.vendor?.businessName || ''
        }}
        clientId={client?.id || null}
      />
    </div>
  );
};

export default ServiceProfile;
