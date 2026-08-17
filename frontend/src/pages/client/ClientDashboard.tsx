import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useClient } from '../../context/ClientContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next'; // إضافة مكتبة الترجمة
import ClientProfile from './ClientProfile';
import ClientOrders from './ClientOrders';
import ClientWishlist from './ClientWishlist';
import ClientSettings from './ClientSettings';
import WeddingProfile from './WeddingProfile';
import { API_BASE } from '../../config/api';

const ClientDashboard: React.FC = () => {
  const { client, isAuthenticated, isLoading } = useClient();
  const { theme } = useTheme();
  const { t } = useTranslation(); // تهيئة دالة الترجمة
  const isDark = theme === 'dark';
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
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300 bg-[#f4e9dc] dark:bg-[#090a10]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c7a48a] dark:border-[#d4af37]"></div>
      </div>
    );
  }

  if (!client) return null;

  // استخدام الترجمة داخل القائمة
  const menuItems = [
    { id: 'overview', label: t('Overview'), icon: '🏠', path: '/client/dashboard' },
    { id: 'wedding', label: t('Wedding Profile'), icon: '💍', path: '/client/dashboard/wedding' },
    { id: 'profile', label: t('My Profile'), icon: '👤', path: '/client/dashboard/profile' },
    { id: 'orders', label: t('My Bookings'), icon: '📋', path: '/client/dashboard/orders' },
    { id: 'wishlist', label: t('Wishlist'), icon: '❤️', path: '/client/dashboard/wishlist' },
    { id: 'settings', label: t('Settings'), icon: '⚙️', path: '/client/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen pt-20 transition-colors duration-300 bg-[#f4e9dc] dark:bg-[#090a10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#121420] rounded-2xl p-6 sticky top-24 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-colors">
              
              {/* User Info */}
              <div className="text-center mb-6">
                <div 
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white dark:text-slate-950 text-2xl font-bold mb-3 shadow-inner"
                  style={{ background: isDark ? 'linear-gradient(135deg, #2a2416, #d4af37)' : 'linear-gradient(135deg, #c7a48a, #e8c597)' }}
                >
                  {client.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-lg font-semibold text-[#1a1a2e] dark:text-slate-100">{client.name}</h2>
                <p className="text-xs mt-0.5 text-[#b9a18e] dark:text-slate-400">{client.email}</p>
              </div>

              {/* Nav */}
              <nav className="space-y-1">
                {menuItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <Link key={item.id} to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border-l-[3px] ${
                        isActive
                          ? 'bg-[rgba(199,164,138,0.1)] dark:bg-[#d4af37]/10 text-[#c7a48a] dark:text-[#d4af37] border-[#c7a48a] dark:border-[#d4af37]'
                          : 'border-transparent text-[#6b5e53] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-[#d4af37]/5 hover:text-[#c7a48a] dark:hover:text-[#f3e5ab]'
                      }`}>
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
  const { theme } = useTheme();
  const { t } = useTranslation(); // استخدام الترجمة هنا أيضاً
  const isDark = theme === 'dark';
  const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0, wishlistItems: 0, savedVendors: 0 });

  useEffect(() => {
    if (!client) return;
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        const favRes = await fetch(`${API_BASE}/favorites/count/${client.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let wishlistCount = 0;
        if (favRes.ok) { const d = await favRes.json(); wishlistCount = d.count; }

        const bookRes = await fetch(`${API_BASE}/bookings/client/${client.id}`);
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

  // الترجمة للبطاقات الإحصائية
  const statCards = [
    { label: t('Total Bookings'), value: stats.totalOrders, icon: '📋', lightColor: '#7e99c4', darkColor: '#94a3b8' },
    { label: t('Active Bookings'), value: stats.activeOrders, icon: '🚀', lightColor: '#c7a48a', darkColor: '#d4af37' },
    { label: t('Wishlist Items'), value: stats.wishlistItems, icon: '❤️', lightColor: '#e8c597', darkColor: '#f3e5ab' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white dark:bg-[#121420] rounded-2xl p-6 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-colors">
        <h1 className="text-2xl font-semibold mb-1 text-[#1a1a2e] dark:text-slate-100">
          {t('Welcome back')}, {client.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm text-[#b9a18e] dark:text-slate-400">
          {t("Here's an overview of your wedding planning journey.")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#121420] rounded-2xl p-5 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#b9a18e] dark:text-slate-400">{s.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: isDark ? s.darkColor : s.lightColor }}>{s.value}</p>
              </div>
              <div className="text-3xl">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-[#121420] rounded-2xl p-6 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-colors">
        <h2 className="text-lg font-semibold mb-4 text-[#1a1a2e] dark:text-slate-100">{t('Quick Actions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { 
              to: '/categories', label: t('Browse Vendors'), icon: '🔍', 
              lightBg: '#c7a48a', 
              darkClasses: 'text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.3)]',
              darkStyle: { background: 'linear-gradient(to right, #d4af37, #f3e5ab, #c5a059)' }
            },
            { 
              to: '/client/dashboard/wedding', label: t('Wedding Profile'), icon: '💍', 
              lightBg: '#7e99c4', 
              darkClasses: 'bg-[#1f2235] text-slate-200 border border-[#d4af37]/30 hover:bg-[#2a2d45]',
              darkStyle: {}
            },
            { 
              to: '/client/dashboard/wishlist', label: t('My Wishlist'), icon: '❤️', 
              lightBg: '#e8c597', 
              darkClasses: 'bg-[#1f2235] text-slate-200 border border-[#d4af37]/30 hover:bg-[#2a2d45]',
              darkStyle: {}
            },
          ].map((action, i) => (
            <Link key={i} to={action.to}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90 hover:shadow-md ${
                isDark ? action.darkClasses : 'text-white'
              }`}
              style={isDark ? action.darkStyle : { background: action.lightBg }}>
              <span>{action.icon}</span> {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white dark:bg-[#121420] rounded-2xl p-6 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-colors">
        <h2 className="text-lg font-semibold mb-4 text-[#1a1a2e] dark:text-slate-100">{t('Getting Started')}</h2>
        <div className="space-y-3">
          {[
            { step: '1', text: t('Complete your wedding profile with date, budget and preferences'), to: '/client/dashboard/wedding' },
            { step: '2', text: t('Browse vendors by category and add favorites to your wishlist'), to: '/categories' },
            { step: '3', text: t('Book your favorite vendors and track everything in one place'), to: '/client/dashboard/orders' },
          ].map((item, i) => (
            <Link key={i} to={item.to}
              className="flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-sm bg-[#faf7f4] border border-[rgba(199,164,138,0.1)] dark:bg-[#0f1018] dark:border-[#d4af37]/15 dark:hover:bg-[#1a1c2b]">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-inner"
                style={{ 
                  background: isDark ? '#d4af37' : '#c7a48a', 
                  color: isDark ? '#0b0c14' : '#ffffff' 
                }}>
                {item.step}
              </div>
              <p className="text-sm font-medium text-[#6b5e53] dark:text-slate-300">{item.text}</p>
              <svg className="w-4 h-4 ml-auto flex-shrink-0 text-[#c7a48a] dark:text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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