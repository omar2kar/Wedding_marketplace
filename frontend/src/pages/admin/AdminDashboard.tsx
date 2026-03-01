import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface DashboardStats {
  pendingVendors: number;
  totalVendors: number;
  totalClients: number;
  totalBookings: number;
  todayRegistrations: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);

  // Current route to highlight active sidebar link
  const location = useLocation();
  const navBtnCls = (path: string) =>
    `w-full text-right px-4 py-3 rounded-lg transition transform duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-white/40 hover:-translate-y-0.5 ${
      location.pathname.startsWith(path)
        ? 'glass bg-white/20 text-white font-medium border border-white/30'
        : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`;

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminData');
    
    if (!token || !admin) {
      navigate('/admin/login');
      return;
    }

    setAdminData(JSON.parse(admin));
    fetchDashboardStats();
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-white/60">Loading dashboard...</p>
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
              <div className="h-8 w-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/70">
                Welcome, {adminData?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 w-full glass rounded-lg h-fit flex-shrink-0 border border-white/20 order-first">
            <nav className="p-4 space-y-2">
              <button onClick={() => navigate('/admin/vendors/pending')} className={navBtnCls('/admin/vendors/pending')}>
                🕒 Pending Vendors
              </button>
              <button onClick={() => navigate('/admin/vendors')} className={navBtnCls('/admin/vendors')}>
                👥 All Vendors
              </button>
              <button onClick={() => navigate('/admin/clients')} className={navBtnCls('/admin/clients')}>
                🧑‍🤝‍🧑 Customers
              </button>
              <button onClick={() => navigate('/admin/services')} className={navBtnCls('/admin/services')}>
                🛠️ Services
              </button>
              <button onClick={() => navigate('/admin/reviews')} className={navBtnCls('/admin/reviews')}>
                ⭐ Reviews
              </button>
              <button onClick={() => navigate('/admin/reports')} className={navBtnCls('/admin/reports')}>
                📊 Reports
              </button>
              <button onClick={() => navigate('/admin/settings')} className={navBtnCls('/admin/settings')}>
                ⚙️ Settings
              </button>
              <button onClick={() => navigate('/admin/permissions')} className={navBtnCls('/admin/permissions')}>
                🔑 Permissions
              </button>
            </nav>
          </aside>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pending Vendors */}
            <div className="glass border border-white/20 rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">
                        Pending Vendors
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {stats?.pendingVendors || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Vendors */}
            <div className="glass border border-white/20 rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">
                        Total Vendors
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {stats?.totalVendors || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Clients */}
            <div className="glass border border-white/20 rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">
                        Total Clients
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {stats?.totalClients || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Bookings */}
            <div className="glass border border-white/20 rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate('/admin/reports')}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Reports
                  </button>
                  <button
                    onClick={() => navigate('/admin/settings')}
                    className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition duration-200 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    System Settings
                  </button>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-white/70 truncate">
                        Total Bookings
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {stats?.totalBookings || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hidden">
            <h2 className="text-lg font-semibold text-white mb-2">Quick Actions</h2>
            <button
              onClick={() => navigate('/admin/vendors/pending')}
              className="glass border border-yellow-400/30 bg-yellow-500/20 hover:bg-yellow-500/30 text-white px-4 py-3 rounded-lg text-right transition flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Pending Vendors</h3>
              <p className="text-yellow-100">Review vendor applications</p>
            </button>

            <button 
              onClick={() => navigate('/admin/vendors')}
              className="glass border border-blue-400/30 bg-blue-500/20 hover:bg-blue-500/30 text-white px-4 py-3 rounded-lg text-right transition flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-semibold mb-2">All Vendors</h3>
              <p className="text-blue-100">Manage all vendors</p>
            </button>

            <button 
              onClick={() => navigate('/admin/clients')}
              className="glass border border-green-400/30 bg-green-500/20 hover:bg-green-500/30 text-white px-4 py-3 rounded-lg text-right transition flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Customers</h3>
              <p className="text-green-100">View customer data</p>
            </button>

            <button 
              onClick={() => navigate('/admin/services')}
              className="glass border border-orange-400/30 bg-orange-500/20 hover:bg-orange-500/30 text-white px-4 py-3 rounded-lg text-right transition flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Services</h3>
              <p className="text-orange-100">Manage all services</p>
            </button>

            <button 
              onClick={() => navigate('/admin/reviews')}
              className="glass border border-yellow-400/30 bg-yellow-500/20 hover:bg-yellow-500/30 text-white px-4 py-3 rounded-lg text-right transition flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Reviews</h3>
              <p className="text-yellow-100">Moderate reviews</p>
            </button>

            <button 
              onClick={() => navigate('/admin/reports')}
              className="glass border border-purple-400/30 bg-purple-500/20 hover:bg-purple-500/30 text-white px-4 py-3 rounded-lg text-right transition flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Reports</h3>
              <p className="text-purple-100">Analytics & Statistics</p>
            </button>

            <button 
              onClick={() => navigate('/admin/settings')}
              className="glass border border-white/30 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg text-right transition flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-white/60">System Configuration</p>
            </button>

            <button 
              onClick={() => navigate('/admin/permissions')}
              className="glass border border-indigo-400/30 bg-indigo-500/20 hover:bg-indigo-500/30 text-white px-4 py-3 rounded-lg text-right transition flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Permissions</h3>
              <p className="text-indigo-100">Admin Management</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
