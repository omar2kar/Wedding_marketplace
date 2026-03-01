import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Review {
  id: number;
  rating: number;
  comment: string;
  status: 'approved' | 'hidden' | 'pending';
  is_reported: boolean;
  client_name: string;
  client_email: string;
  vendor_name: string;
  business_name: string;
  service_title: string;
  report_count: number;
  created_at: string;
  admin_notes?: string;
}

const AllReviews: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [reportedOnly, setReportedOnly] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [actionType, setActionType] = useState<'hide' | 'approve' | 'delete' | 'resolve' | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchReviews();
  }, [navigate, searchTerm, statusFilter, ratingFilter, reportedOnly]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (ratingFilter !== 'all') params.append('rating', ratingFilter);
      if (reportedOnly) params.append('reported_only', 'true');
      
      const response = await fetch(`http://localhost:5000/api/admin/reviews?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedReview || !actionType) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem('adminToken');
      
      let endpoint = '';
      let method = 'POST';
      let body: any = { notes };

      switch (actionType) {
        case 'hide':
          endpoint = `http://localhost:5000/api/admin/reviews/${selectedReview.id}/hide`;
          break;
        case 'approve':
          endpoint = `http://localhost:5000/api/admin/reviews/${selectedReview.id}/approve`;
          break;
        case 'delete':
          endpoint = `http://localhost:5000/api/admin/reviews/${selectedReview.id}`;
          method = 'DELETE';
          break;
        case 'resolve':
          endpoint = `http://localhost:5000/api/admin/reviews/${selectedReview.id}/resolve-reports`;
          body.action = 'dismiss';
          break;
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setSelectedReview(null);
        setActionType(null);
        setNotes('');
        fetchReviews();
      } else {
        const error = await response.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      hidden: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-white/60';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-white/60'}>
        ★
      </span>
    ));
  };

  const getActionButtons = (review: Review) => {
    const buttons = [];
    
    if (review.status === 'approved') {
      buttons.push(
        <button
          key="hide"
          onClick={() => {
            setSelectedReview(review);
            setActionType('hide');
          }}
          className="glass border border-orange-400/40 text-orange-200 hover:bg-orange-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
        >
          Hide
        </button>
      );
    }
    
    if (review.status === 'hidden') {
      buttons.push(
        <button
          key="approve"
          onClick={() => {
            setSelectedReview(review);
            setActionType('approve');
          }}
          className="glass border border-green-400/40 text-green-200 hover:bg-green-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
        >
          Show
        </button>
      );
    }
    
    if (review.is_reported) {
      buttons.push(
        <button
          key="resolve"
          onClick={() => {
            setSelectedReview(review);
            setActionType('resolve');
          }}
          className="glass border border-blue-400/40 text-blue-200 hover:bg-blue-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
        >
          Resolve Reports
        </button>
      );
    }
    
    buttons.push(
      <button
        key="delete"
        onClick={() => {
          setSelectedReview(review);
          setActionType('delete');
        }}
        className="glass border border-red-400/40 text-red-200 hover:bg-red-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
      >
        Delete
      </button>
    );
    
    return buttons;
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="glass border-b border-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="mr-4 text-white/60 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-white">Reviews Management</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">
        <div className="glass p-4 rounded-lg border border-white/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="hidden">Hidden</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportedOnly}
                  onChange={(e) => setReportedOnly(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-white/80">Reported Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="glass rounded-lg border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-white/60">Loading reviews...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Service/Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-white/10">
                  {reviews.map((review) => (
                    <tr key={review.id} className={review.is_reported ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-white line-clamp-3">{review.comment}</p>
                          <p className="text-xs text-white/60 mt-1">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{review.client_name}</div>
                          <div className="text-sm text-white/60">{review.client_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{review.service_title}</div>
                          <div className="text-sm text-white/60">{review.business_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRatingStars(review.rating)}
                          <span className="ml-2 text-sm text-white/60">{review.rating}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(review.status)}`}>
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {review.is_reported ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {review.report_count} reports
                          </span>
                        ) : (
                          <span className="text-white/40 text-sm">No reports</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {getActionButtons(review).map((button, index) => (
                            <span key={index}>{button}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {selectedReview && actionType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 glass border border-white/20 rounded-lg backdrop-blur-lg w-96">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                {actionType === 'resolve' ? 'Resolve Reports' : `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Review`}
              </h3>
              
              <div className="mb-4 p-3 bg-white/5 backdrop-blur-sm rounded">
                <p className="text-sm text-white/60 mb-2">
                  <strong>Client:</strong> {selectedReview.client_name}
                </p>
                <p className="text-sm text-white/60 mb-2">
                  <strong>Service:</strong> {selectedReview.service_title}
                </p>
                <p className="text-sm text-white/60 mb-2">
                  <strong>Rating:</strong> {selectedReview.rating}/5
                </p>
                <p className="text-sm text-white">
                  <strong>Comment:</strong> {selectedReview.comment}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Admin Notes {actionType === 'delete' ? '(Required)' : '(Optional)'}:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder={`Reason for ${actionType}...`}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setSelectedReview(null);
                    setActionType(null);
                    setNotes('');
                  }}
                  className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing || (actionType === 'delete' && !notes.trim())}
                  className="px-4 py-2 glass border border-red-400/40 text-red-200 hover:bg-red-500/20 hover:text-white rounded-lg disabled:opacity-50"
                >
                  {processing ? 'Processing...' : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllReviews;
