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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    document.body.style.overflow = '';
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Debug: Log client changes
  useEffect(() => {
    console.log('🔔 Header: Client data changed:', JSON.stringify(client, null, 2));
    console.log('🔔 Header: client.name =', client?.name);
    console.log('🔔 Header: First char =', client?.name?.charAt(0));
  }, [client]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const isHome = location.pathname === '/';

  return (
    <header className="relative z-30">
      <div className={`${isHome ? 'bg-gradient-to-b from-[#f6d8d8] to-[#5a9be7]' : 'bg-transparent'}`}>
        {/* Navigation */}
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-playfair text-2xl md:text-3xl font-semibold" style={{ color: '#d4af37' }}>
              ONEDAY
            </span>
          </Link>

          <div className="ml-auto flex items-center">
            <nav className="hidden md:flex items-center space-x-10">
              <Link to="/" className="font-playfair text-black text-lg hover:opacity-80">{t('home')}</Link>
              <Link to="/categories" className="font-playfair text-black text-lg hover:opacity-80">{t('vendors')}</Link>
              <Link to="/about" className="font-playfair text-black text-lg hover:opacity-80">{t('about')}</Link>
              {!isAuthenticated && (
                <Link to="/login" className="font-playfair text-black text-lg hover:opacity-80">{t('login')}</Link>
              )}
            </nav>

            {/* User Account / Language & Theme Buttons */}
            <div className="flex items-center space-x-3 ml-6">
              {/* User Account Dropdown */}
              {isAuthenticated && client && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {client.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.email}</p>
                      </div>
                      
                      <Link
                        to="/client/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span>{t('Dashboard')}</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/client/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{t('My Profile')}</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/client/dashboard/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>{t('My Orders')}</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/client/dashboard/wishlist"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{t('Wishlist')}</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/client/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{t('Settings')}</span>
                        </div>
                      </Link>
                      
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>{t('Logout')}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => changeLanguage(i18n.language === 'en' ? 'de' : 'en')}
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700"
              >
                {i18n.language === 'en' ? 'Deutsch' : 'English'}
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 border border-gray-300 rounded text-gray-700"
              >
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

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden p-2 text-gray-700"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden px-4 pb-4">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2">{t('home')}</Link>
            <Link to="/categories" onClick={() => setIsMenuOpen(false)} className="block py-2">{t('vendors')}</Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)} className="block py-2">{t('about')}</Link>
            {!isAuthenticated ? (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block py-2">{t('login')}</Link>
            ) : (
              <>
                <Link to="/client/dashboard" onClick={() => setIsMenuOpen(false)} className="block py-2">{t('Dashboard')}</Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block py-2 text-red-600">{t('Logout')}</button>
              </>
            )}
          </nav>
        )}

        {/* Hero Section */}
        {isHome && (
          <div className="py-40 text-center">
            <h1 className="font-playfair text-5xl sm:text-7xl md:text-7xl font-medium text-white max-w-3xl mx-auto">
              {t('For your special day — and all the other special days.')}
            </h1>
            <div className="mt-8">
              <button
                onClick={() => navigate('/search')}
                className="bg-[#b48a3b] text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-[#a07933] transition"
              >
                {t('findVendors')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
