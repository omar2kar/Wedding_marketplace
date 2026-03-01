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
}

const PendingVendors: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchPendingVendors();
  }, [navigate]);

  const fetchPendingVendors = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching pending vendors with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('http://localhost:5000/api/admin/vendors/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Received data:', data);
        console.log('Data length:', data.length);
        setVendors(data);
      } else {
        const errorText = await response.text();
        console.error('Response error:', errorText);
      }
    } catch (error) {
      console.error('Error fetching pending vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (vendor: Vendor, actionType: 'approve' | 'reject') => {
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
      console.log(`${action}ing vendor ${selectedVendor.id} with notes:`, notes);
      
      const response = await fetch(`http://localhost:5000/api/admin/vendors/${selectedVendor.id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      console.log(`${action} response status:`, response.status);

      if (response.ok) {
        const result = await response.json();
        console.log(`${action} successful:`, result);
        setShowModal(false);
        fetchPendingVendors(); // Refresh the list
      } else {
        const errorText = await response.text();
        console.error(`${action} failed:`, errorText);
      }
    } catch (error) {
      console.error(`Error ${action}ing vendor:`, error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-white/60">Loading pending vendors...</p>
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
              <h1 className="text-xl font-semibold text-white">Pending Vendors</h1>
            </div>
            <span className="text-sm text-white/60">{vendors.length} pending applications</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {vendors.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">No pending vendors</h3>
              <p className="mt-1 text-sm text-white/60">All vendor applications have been reviewed.</p>
            </div>
          ) : (
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
                        Applied
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
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{vendor.business_name}</div>
                            <div className="text-sm text-white/60">{vendor.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                          {formatDate(vendor.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleAction(vendor, 'approve')}
                            className="glass border border-green-400/40 text-green-200 hover:bg-green-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(vendor, 'reject')}
                            className="glass border border-red-400/40 text-red-200 hover:bg-red-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Action Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 glass border border-white/20 rounded-lg backdrop-blur-lg w-96">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                {action === 'approve' ? 'Approve' : 'Reject'} Vendor
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-white/60 mb-2">
                  <strong>Vendor:</strong> {selectedVendor.name}
                </p>
                <p className="text-sm text-white/60 mb-2">
                  <strong>Business:</strong> {selectedVendor.business_name}
                </p>
                <p className="text-sm text-white/60">
                  <strong>Category:</strong> {selectedVendor.category}
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
                    action === 'approve' 
                      ? 'glass border border-green-400/40 text-green-200 hover:bg-green-500/20 hover:text-white' 
                      : 'glass border border-red-400/40 text-red-200 hover:bg-red-500/20 hover:text-white'
                  } disabled:opacity-50`}
                >
                  {processing ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingVendors;
