import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
  created_by_name: string;
}

interface Activity {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_email: string;
  action_type: string;
  target_type: string;
  target_id: number;
  description: string;
  created_at: string;
}

interface PermissionStats {
  total_admins: number;
  active_admins: number;
  super_admins: number;
  regular_admins: number;
  recent_activities: number;
}

const AdminPermissions: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'admins' | 'activity'>('admins');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<PermissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Fetch overview stats
      const statsResponse = await fetch('http://localhost:5000/api/admin/permissions/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      if (activeTab === 'admins') {
        const response = await fetch('http://localhost:5000/api/admin/permissions/admins', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAdmins(data.admins);
        }
      } else if (activeTab === 'activity') {
        const response = await fetch('http://localhost:5000/api/admin/permissions/activity-log', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/permissions/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdmin)
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewAdmin({ name: '', email: '', password: '', role: 'admin' });
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Failed to create admin');
    }
  };

  const updateAdmin = async (admin: Admin) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/permissions/admins/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: admin.name,
          role: admin.role,
          is_active: admin.is_active
        })
      });

      if (response.ok) {
        setEditingAdmin(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating admin:', error);
    }
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
              <h1 className="text-xl font-semibold text-white">Admin Permissions</h1>
            </div>
            {activeTab === 'admins' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add New Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-lg border border-white/20">
              <div className="text-2xl font-bold text-white">{stats.total_admins}</div>
              <div className="text-sm text-white/60">Total Admins</div>
            </div>
            <div className="glass p-4 rounded-lg border border-white/20">
              <div className="text-2xl font-bold text-green-600">{stats.active_admins}</div>
              <div className="text-sm text-white/60">Active Admins</div>
            </div>
            <div className="glass p-4 rounded-lg border border-white/20">
              <div className="text-2xl font-bold text-blue-600">{stats.super_admins}</div>
              <div className="text-sm text-white/60">Super Admins</div>
            </div>
            <div className="glass p-4 rounded-lg border border-white/20">
              <div className="text-2xl font-bold text-purple-600">{stats.recent_activities}</div>
              <div className="text-sm text-white/60">Recent Activities (24h)</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-lg border border-white/20">
          <div className="border-b border-white/30">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('admins')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'admins'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                Admin Accounts
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'activity'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                Activity Log
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-white/60">Loading...</p>
              </div>
            ) : (
              <>
                {/* Admin Accounts Tab */}
                {activeTab === 'admins' && (
                  <div className="space-y-4">
                    {admins.map((admin) => (
                      <div key={admin.id} className="border border-white/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h3 className="text-sm font-medium text-white">{admin.name}</h3>
                                <p className="text-sm text-white/60">{admin.email}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                admin.role === 'super_admin' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-white/10 text-white'
                              }`}>
                                {admin.role}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                admin.is_active ? 'bg-white/10 text-white' : 'bg-red-100 text-red-800'
                              }`}>
                                {admin.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-white/60">
                              Created: {new Date(admin.created_at).toLocaleDateString()} by {admin.created_by_name}
                              {admin.last_login && (
                                <span className="ml-4">
                                  Last login: {new Date(admin.last_login).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingAdmin(admin)}
                              className="text-white/60 hover:text-white text-sm"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Activity Log Tab */}
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="border border-white/30 rounded-lg p-4 glass">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                activity.action_type === 'create' ? 'bg-white/10 text-white' :
                                activity.action_type === 'update' ? 'bg-blue-100 text-blue-800' :
                                activity.action_type === 'delete' ? 'bg-red-100 text-red-800' :
                                'bg-white/10 text-white'
                              }`}>
                                {activity.action_type}
                              </span>
                              <span className="text-sm text-white/60">{activity.target_type}</span>
                            </div>
                            <p className="text-sm text-white mt-1">{activity.description}</p>
                            <div className="text-xs text-white/60 mt-2">
                              By: {activity.admin_name} ({activity.admin_email}) • 
                              {new Date(activity.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 glass border border-white/20">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Add New Admin</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Name:</label>
                  <input
                    type="text"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Email:</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Password:</label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Role:</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white/70 bg-white/20 rounded-md hover:bg-white/5 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={createAdmin}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Create Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 glass border border-white/20">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">Edit Admin</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Name:</label>
                  <input
                    type="text"
                    value={editingAdmin.name}
                    onChange={(e) => setEditingAdmin({...editingAdmin, name: e.target.value})}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Email:</label>
                  <input
                    type="email"
                    value={editingAdmin.email}
                    disabled
                    className="w-full px-3 py-2 border border-white/30 rounded-md bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Role:</label>
                  <select
                    value={editingAdmin.role}
                    onChange={(e) => setEditingAdmin({...editingAdmin, role: e.target.value})}
                    className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingAdmin.is_active}
                      onChange={(e) => setEditingAdmin({...editingAdmin, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-white/70">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 text-sm font-medium text-white/70 bg-white/20 rounded-md hover:bg-white/5 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateAdmin(editingAdmin)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPermissions;
