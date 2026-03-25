import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useClient } from '../../context/ClientContext';

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
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const segments = location.pathname.replace('/client/dashboard', '').split('/').filter(Boolean);
    setActiveTab(segments[0] || 'overview');
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4e9dc' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#c7a48a' }}></div>
      </div>
    );
  }

  if (!client) return null;

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '🏠', path: '/client/dashboard' },
    { id: 'wedding', label: 'Wedding Profile', icon: '💍', path: '/client/dashboard/wedding' },
    { id: 'profile', label: 'My Profile', icon: '👤', path: '/client/dashboard/profile' },
    { id: 'orders', label: 'My Bookings', icon: '📋', path: '/client/dashboard/orders' },
    { id: 'wishlist', label: 'Wishlist', icon: '❤️', path: '/client/dashboard/wishlist' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/client/dashboard/settings' },
  ];

  return (
    <div style={{ background: '#f4e9dc', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 sticky top-24" style={{ border: '1px solid rgba(199,164,138,0.15)' }}>
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
                  style={{ background: 'linear-gradient(135deg, #c7a48a, #e8c597)' }}>
                  {client.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-lg font-semibold" style={{ color: '#1a1a2e' }}>{client.name}</h2>
                <p className="text-xs mt-0.5" style={{ color: '#b9a18e' }}>{client.email}</p>
              </div>

              {/* Nav */}
              <nav className="space-y-1">
                {menuItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <Link key={item.id} to={item.path}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: isActive ? 'rgba(199,164,138,0.1)' : 'transparent',
                        color: isActive ? '#c7a48a' : '#6b5e53',
                        borderLeft: isActive ? '3px solid #c7a48a' : '3px solid transparent'
                      }}>
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ── Main Content ── */}
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

/* ═══════ OVERVIEW ═══════ */
const DashboardOverview: React.FC<{ client: any }> = ({ client }) => {
  const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0, wishlistItems: 0, savedVendors: 0 });

  useEffect(() => {
    if (!client) return;
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        const favRes = await fetch(`http://localhost:5000/api/favorites/count/${client.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let wishlistCount = 0;
        if (favRes.ok) { const d = await favRes.json(); wishlistCount = d.count; }

        const bookRes = await fetch(`http://localhost:5000/api/bookings/client/${client.id}`);
        let totalOrders = 0, activeOrders = 0;
        if (bookRes.ok) {
          const d = await bookRes.json();
          const bookings = d.bookings || [];
          totalOrders = bookings.length;
          activeOrders = bookings.filter((b: any) => b.status === 'pending' || b.status === 'confirmed').length;
        }

        setStats({ totalOrders, activeOrders, wishlistItems: wishlistCount, savedVendors: 0 });
      } catch (err) { console.error('Error:', err); }
    };
    fetchStats();
    const handler = () => fetchStats();
    window.addEventListener('favoritesUpdated', handler);
    return () => window.removeEventListener('favoritesUpdated', handler);
  }, [client]);

  const statCards = [
    { label: 'Total Bookings', value: stats.totalOrders, icon: '📋', color: '#7e99c4' },
    { label: 'Active Bookings', value: stats.activeOrders, icon: '🚀', color: '#c7a48a' },
    { label: 'Wishlist Items', value: stats.wishlistItems, icon: '❤️', color: '#e8c597' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(199,164,138,0.15)' }}>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1a1a2e' }}>
          Welcome back, {client.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm" style={{ color: '#b9a18e' }}>
          Here's an overview of your wedding planning journey.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(199,164,138,0.15)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#b9a18e' }}>{s.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
              <div className="text-3xl">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(199,164,138,0.15)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#1a1a2e' }}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { to: '/categories', label: 'Browse Vendors', icon: '🔍', bg: '#c7a48a' },
            { to: '/client/dashboard/wedding', label: 'Wedding Profile', icon: '💍', bg: '#7e99c4' },
            { to: '/client/dashboard/wishlist', label: 'My Wishlist', icon: '❤️', bg: '#e8c597' },
          ].map((action, i) => (
            <Link key={i} to={action.to}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm transition-all hover:opacity-90 hover:shadow-md"
              style={{ background: action.bg }}>
              <span>{action.icon}</span> {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(199,164,138,0.15)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#1a1a2e' }}>Getting Started</h2>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Complete your wedding profile with date, budget and preferences', to: '/client/dashboard/wedding' },
            { step: '2', text: 'Browse vendors by category and add favorites to your wishlist', to: '/categories' },
            { step: '3', text: 'Book your favorite vendors and track everything in one place', to: '/client/dashboard/orders' },
          ].map((item, i) => (
            <Link key={i} to={item.to}
              className="flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-sm"
              style={{ background: '#faf7f4', border: '1px solid rgba(199,164,138,0.1)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: '#c7a48a' }}>
                {item.step}
              </div>
              <p className="text-sm font-medium" style={{ color: '#6b5e53' }}>{item.text}</p>
              <svg className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: '#c7a48a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;