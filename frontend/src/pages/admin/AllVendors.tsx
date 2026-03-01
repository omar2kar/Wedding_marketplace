import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Vendor {
  id: number;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  category: string;
  created_at: string;
  admin_notes: string;
  status: string;
  approved_at: string;
  approved_by_name: string;
}

const AllVendors: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: ''
  });
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'suspend' | 'approve'>('suspend');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800'
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchVendors();
  }, [navigate, filters]);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      
      const response = await fetch(`http://localhost:5000/api/admin/vendors?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (vendor: Vendor, actionType: 'suspend' | 'approve') => {
    setSelectedVendor(vendor);
    setAction(actionType);
    setNotes('');
    setShowModal(true);
  };

  const submitAction = async () => {
    if (!selectedVendor) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/vendors/${selectedVendor.id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        setShowModal(false);
        fetchVendors();
      }
    } catch (error) {
      console.error(`Error ${action}ing vendor:`, error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-white/60">Loading vendors...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-semibold text-white">All Vendors</h1>
            </div>
            <span className="text-sm text-white/60">{vendors.length} total vendors</span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">
        <div className="glass p-4 rounded-lg border border-white/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Categories</option>
                <option value="Photography">Photography</option>
                <option value="Videography">Videography</option>
                <option value="Venue">Venue</option>
                <option value="Catering">Catering</option>
                <option value="Floristry">Floristry</option>
                <option value="Music & Entertainment">Music & Entertainment</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', category: '' })}
                className="w-full glass border border-white/20 text-white/80 hover:bg-white/10 hover:text-white px-4 py-2 rounded-lg transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="glass rounded-lg border border-white/20 overflow-hidden backdrop-blur-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Vendor Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Business Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-white/10">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-white/5 backdrop-blur-sm">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{vendor.name}</div>
                        <div className="text-sm text-white/60">{vendor.email}</div>
                        <div className="text-sm text-white/60">{vendor.phone}</div>
                        <div className="text-xs text-white/40">Joined: {formatDate(vendor.created_at)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{vendor.business_name}</div>
                        <div className="text-sm text-white/60">{vendor.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[vendor.status as keyof typeof statusColors]}`}>
                        {vendor.status}
                      </span>
                      {vendor.approved_at && (
                        <div className="text-xs text-white/40 mt-1">
                          {formatDate(vendor.approved_at)}
                          {vendor.approved_by_name && <div>by {vendor.approved_by_name}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {vendor.status === 'approved' && (
                        <button
                          onClick={() => handleAction(vendor, 'suspend')}
                          className="glass border border-orange-400/40 text-orange-200 hover:bg-orange-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
                        >
                          Suspend
                        </button>
                      )}
                      {vendor.status === 'suspended' && (
                        <button
                          onClick={() => handleAction(vendor, 'approve')}
                          className="glass border border-green-400/40 text-green-200 hover:bg-green-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
                        >
                          Reactivate
                        </button>
                      )}
                      {vendor.admin_notes && (
                        <button
                          onClick={() => alert(vendor.admin_notes)}
                          className="glass border border-blue-400/40 text-blue-200 hover:bg-blue-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
                        >
                          View Notes
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 glass border border-white/20 rounded-lg backdrop-blur-lg w-96">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                {action === 'suspend' ? 'Suspend' : 'Reactivate'} Vendor
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-white/60 mb-2">
                  <strong>Vendor:</strong> {selectedVendor.name}
                </p>
                <p className="text-sm text-white/60 mb-2">
                  <strong>Business:</strong> {selectedVendor.business_name}
                </p>
                <p className="text-sm text-white/60">
                  <strong>Current Status:</strong> {selectedVendor.status}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder={`Add notes for ${action}ing this vendor...`}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={submitAction}
                  disabled={processing}
                  className={`px-4 py-2 rounded-lg transition transform hover:-translate-y-0.5 text-white ${
                    action === 'suspend' 
                      ? 'glass border border-orange-400/40 text-orange-200 hover:bg-orange-500/20 hover:text-white' 
                      : 'glass border border-green-400/40 text-green-200 hover:bg-green-500/20 hover:text-white'
                  } disabled:opacity-50`}
                >
                  {processing ? 'Processing...' : (action === 'suspend' ? 'Suspend' : 'Reactivate')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllVendors;
