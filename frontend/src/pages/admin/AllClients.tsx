import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  total_bookings: number;
  total_reviews: number;
  status?: string;
}

const AllClients: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'suspend' | 'activate' | 'delete'>('suspend');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchClients();
  }, [navigate, searchQuery]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`http://localhost:5000/api/admin/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (client: Client, actionType: 'suspend' | 'activate' | 'delete') => {
    setSelectedClient(client);
    setAction(actionType);
    setNotes('');
    setShowModal(true);
  };

  const submitAction = async () => {
    if (!selectedClient) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      let response;

      if (action === 'delete') {
        response = await fetch(`http://localhost:5000/api/admin/clients/${selectedClient.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notes })
        });
      } else {
        response = await fetch(`http://localhost:5000/api/admin/clients/${selectedClient.id}/toggle-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action, notes })
        });
      }

      if (response.ok) {
        setShowModal(false);
        fetchClients();
      }
    } catch (error) {
      console.error(`Error ${action}ing client:`, error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string = 'active') => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'deleted': return 'bg-gray-100 text-white/60';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-white/60">Loading clients...</p>
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
              <h1 className="text-xl font-semibold text-white">Client Management</h1>
            </div>
            <span className="text-sm text-white/60">{clients.length} total clients</span>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">
        <div className="glass p-4 rounded-lg border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-2">Search Clients</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSearchQuery('')}
                className="glass border border-white/20 text-white/80 hover:bg-white/10 hover:text-white px-4 py-2 rounded-lg transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="glass rounded-lg border border-white/20 overflow-hidden backdrop-blur-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Client Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Activity
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
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/5 backdrop-blur-sm">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{client.name}</div>
                        <div className="text-sm text-white/60">{client.email}</div>
                        <div className="text-sm text-white/60">{client.phone}</div>
                        <div className="text-xs text-white/40">Joined: {formatDate(client.created_at)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white">{client.total_bookings} Bookings</div>
                        <div className="text-sm text-white/60">{client.total_reviews} Reviews</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                        {client.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {(!client.status || client.status === 'active') && (
                        <button
                          onClick={() => handleAction(client, 'suspend')}
                          className="glass border border-orange-400/40 text-orange-200 hover:bg-orange-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
                        >
                          Suspend
                        </button>
                      )}
                      {client.status === 'suspended' && (
                        <button
                          onClick={() => handleAction(client, 'activate')}
                          className="glass border border-green-400/40 text-green-200 hover:bg-green-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                        className="glass border border-blue-400/40 text-blue-200 hover:bg-blue-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAction(client, 'delete')}
                        className="glass border border-red-400/40 text-red-200 hover:bg-red-500/20 hover:text-white px-3 py-1 rounded-lg text-sm transition transform hover:-translate-y-0.5"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 glass border border-white/20 rounded-lg backdrop-blur-lg w-96">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                {action === 'delete' ? 'Delete' : action === 'suspend' ? 'Suspend' : 'Activate'} Client
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-white/60 mb-2">
                  <strong>Client:</strong> {selectedClient.name}
                </p>
                <p className="text-sm text-white/60 mb-2">
                  <strong>Email:</strong> {selectedClient.email}
                </p>
                <p className="text-sm text-white/60">
                  <strong>Current Status:</strong> {selectedClient.status || 'active'}
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
                  placeholder={`Add notes for ${action}ing this client...`}
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
                    action === 'delete' 
                      ? 'glass border border-red-400/40 text-red-200 hover:bg-red-500/20 hover:text-white' 
                      : action === 'suspend'
                      ? 'glass border border-orange-400/40 text-orange-200 hover:bg-orange-500/20 hover:text-white'
                      : 'glass border border-green-400/40 text-green-200 hover:bg-green-500/20 hover:text-white'
                  }`}
                >
                  {processing ? 'Processing...' : (action === 'delete' ? 'Delete' : action === 'suspend' ? 'Suspend' : 'Activate')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllClients;
