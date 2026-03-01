import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useClient } from '../../context/ClientContext';

// Import sub-pages
import ClientProfile from './ClientProfile';
import ClientOrders from './ClientOrders';
import ClientWishlist from './ClientWishlist';
import ClientSettings from './ClientSettings';
import WeddingProfile from './WeddingProfile';

const ClientDashboard: React.FC = () => {
  const { client, isAuthenticated, isLoading } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname.split('/').pop();
    setActiveTab(path || 'overview');
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '🏠', path: '/client/dashboard' },
    { id: 'wedding', label: 'Wedding Profile', icon: '💍', path: '/client/dashboard/wedding' },
    { id: 'profile', label: 'My Profile', icon: '👤', path: '/client/dashboard/profile' },
    { id: 'orders', label: 'My Orders', icon: '📋', path: '/client/dashboard/orders' },
    { id: 'wishlist', label: 'Wishlist', icon: '❤️', path: '/client/dashboard/wishlist' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/client/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {client.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{client.name}</h2>
                <p className="text-sm text-gray-500">{client.email}</p>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Routes>
              <Route path="/" element={<DashboardOverview client={client} />} />
              <Route path="wedding" element={<WeddingProfile />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="orders" element={<ClientOrders />} />
              <Route path="wishlist" element={<ClientWishlist />} />
              <Route path="settings" element={<ClientSettings />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview: React.FC<{ client: any }> = ({ client }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    wishlistItems: 0,
    savedVendors: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!client) return;
      
      try {
        const token = localStorage.getItem('clientToken');
        
        // Fetch favorites count from the new API endpoint
        const favoritesResponse = await fetch(`http://localhost:5000/api/favorites/count/${client.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        let wishlistCount = 0;
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          wishlistCount = favoritesData.count;
          console.log('Dashboard - Wishlist count from API:', wishlistCount);
        } else {
          console.error('Failed to fetch wishlist count:', favoritesResponse.status);
        }
        
        // For now, set other stats to 0 (can be implemented later)
        setStats({
          totalOrders: 0,
          activeOrders: 0,
          wishlistItems: wishlistCount,
          savedVendors: 0
        });
        
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    if (client) {
      fetchStats();
    }

    // Listen for favorites updates to refresh stats
    const handleFavoritesUpdate = () => {
      fetchStats();
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, [client]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {client.name}! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your wedding planning journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Wishlist Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.wishlistItems}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-xl">❤️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Saved Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.savedVendors}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xl">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 pb-4 border-b">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">You viewed Photography services</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 pb-4 border-b">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">Added "Elegant Florals" to wishlist</p>
              <p className="text-xs text-gray-500">Yesterday</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">Updated your profile information</p>
              <p className="text-xs text-gray-500">3 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/categories"
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span>🔍</span>
            <span>Browse Services</span>
          </Link>
          <Link
            to="/client/dashboard/wishlist"
            className="flex items-center justify-center space-x-2 bg-pink-600 text-white px-4 py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            <span>❤️</span>
            <span>View Wishlist</span>
          </Link>
          <Link
            to="/client/dashboard/profile"
            className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span>👤</span>
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;