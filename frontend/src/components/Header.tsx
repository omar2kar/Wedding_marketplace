import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useClient } from '../context/ClientContext';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { client, isAuthenticated, logout } = useClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => { setIsMenuOpen(false); setIsProfileMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navBg = isHome && !scrolled
    ? 'bg-transparent'
    : 'bg-white/90 backdrop-blur-md shadow-sm';
  const navText = isHome && !scrolled ? '#ffffff' : '#1a1a2e';
  const logoColor = isHome && !scrolled ? '#ffffff' : '#c7a48a';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className={`${navBg} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="font-playfair text-2xl md:text-3xl font-semibold tracking-wide" style={{ color: logoColor }}>
            ONEDAY
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { to: '/', label: t('Home') },
              { to: '/categories', label: t('Vendors') },
              { to: '/about', label: t('About') },
            ].map(item => (
              <Link key={item.to} to={item.to}
                className="font-medium text-[15px] transition-colors hover:opacity-70"
                style={{ color: navText, fontFamily: "'Playfair Display', serif" }}>
                {item.label}
              </Link>
            ))}

            {!isAuthenticated && (
              <Link to="/login" className="font-medium text-[15px] transition-colors hover:opacity-70"
                style={{ color: navText, fontFamily: "'Playfair Display', serif" }}>
                {t('Login')}
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Profile Dropdown */}
            {isAuthenticated && client && (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors"
                  style={{ background: isHome && !scrolled ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #c7a48a, #e8c597)' }}>
                    {client.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium" style={{ color: navText }}>{client.name?.split(' ')[0]}</span>
                  <svg className="w-3.5 h-3.5" style={{ color: navText }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-400">{client.email}</p>
                    </div>
                    {[
                      { to: '/client/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: t('Dashboard') },
                      { to: '/client/dashboard/wedding', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: t('Wedding Profile') },
                      { to: '/client/dashboard/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: t('My Orders') },
                      { to: '/client/dashboard/wishlist', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: t('Wishlist') },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => { logout(); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('Logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Language */}
            <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'de' : 'en')}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                border: `1px solid ${isHome && !scrolled ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)'}`,
                color: navText
              }}>
              {i18n.language === 'en' ? 'DE' : 'EN'}
            </button>

            {/* Theme */}
            <button onClick={toggleTheme}
              className="p-2 rounded-full transition-all"
              style={{ color: navText, background: isHome && !scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)' }}>
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* Mobile Toggle */}
            <button className="md:hidden p-2" style={{ color: navText }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <nav className="px-6 py-4 space-y-1">
              {[
                { to: '/', label: t('Home') },
                { to: '/categories', label: t('Vendors') },
                { to: '/about', label: t('About') },
              ].map(item => (
                <Link key={item.to} to={item.to} onClick={() => setIsMenuOpen(false)}
                  className="block py-3 text-gray-800 font-medium border-b border-gray-50">{item.label}</Link>
              ))}
              {!isAuthenticated ? (
                <Link to="/login" onClick={() => setIsMenuOpen(false)}
                  className="block py-3 font-medium" style={{ color: '#c7a48a' }}>{t('Login')}</Link>
              ) : (
                <>
                  <Link to="/client/dashboard" onClick={() => setIsMenuOpen(false)} className="block py-3 text-gray-800 font-medium">{t('Dashboard')}</Link>
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block py-3 text-red-500 font-medium">{t('Logout')}</button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;