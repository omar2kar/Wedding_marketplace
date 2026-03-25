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
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsProfileMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const transparent = isHome && !scrolled;
  const navText = transparent ? '#ffffff' : '#1a1a2e';
  const logoColor = transparent ? '#ffffff' : '#c7a48a';

  const navLinks = [
    { to: '/', label: t('Home') },
    { to: '/categories', label: t('Vendors') },
    { to: '/about', label: t('About') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
      <div className={`transition-all duration-500 ${transparent ? 'bg-transparent' : 'bg-white/90 backdrop-blur-md shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="font-playfair text-2xl md:text-3xl font-semibold tracking-wide transition-colors duration-300 hover:opacity-80"
            style={{ color: logoColor }}>
            ONEDAY
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map(item => {
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}
                  className="relative font-playfair text-[15px] font-medium transition-all duration-300 group"
                  style={{ color: navText }}>
                  {item.label}
                  {/* Animated underline */}
                  <span className={`absolute -bottom-1 left-0 h-[2px] transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                    style={{ background: transparent ? '#e8c597' : '#c7a48a' }}></span>
                </Link>
              );
            })}

            {!isAuthenticated && (
              <Link to="/login"
                className="font-playfair text-[15px] font-medium px-5 py-2 rounded-full transition-all duration-300 hover:shadow-md"
                style={{
                  color: transparent ? '#ffffff' : '#c7a48a',
                  border: `1.5px solid ${transparent ? 'rgba(255,255,255,0.3)' : '#c7a48a'}`,
                  background: transparent ? 'rgba(255,255,255,0.08)' : 'transparent'
                }}>
                {t('Login')}
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Profile */}
            {isAuthenticated && client && (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300"
                  style={{ background: transparent ? 'rgba(255,255,255,0.12)' : 'rgba(199,164,138,0.08)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #c7a48a, #e8c597)' }}>
                    {client.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium" style={{ color: navText }}>{client.name?.split(' ')[0]}</span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl py-2 z-50" style={{ border: '1px solid rgba(199,164,138,0.1)' }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(199,164,138,0.1)' }}>
                      <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{client.name}</p>
                      <p className="text-xs" style={{ color: '#b9a18e' }}>{client.email}</p>
                    </div>
                    {[
                      { to: '/client/dashboard', icon: '🏠', label: t('Dashboard') },
                      { to: '/client/dashboard/wedding', icon: '💍', label: t('Wedding Profile') },
                      { to: '/client/dashboard/orders', icon: '📋', label: t('My Bookings') },
                      { to: '/client/dashboard/wishlist', icon: '❤️', label: t('Wishlist') },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-gray-50"
                        style={{ color: '#6b5e53' }}>
                        <span>{item.icon}</span> {item.label}
                      </Link>
                    ))}
                    <div className="border-t mt-1 pt-1" style={{ borderColor: 'rgba(199,164,138,0.1)' }}>
                      <button onClick={() => { logout(); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all">
                        <span>🚪</span> {t('Logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Language */}
            <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'de' : 'en')}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 hover:opacity-70"
              style={{ border: `1px solid ${transparent ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'}`, color: navText }}>
              {i18n.language === 'en' ? 'DE' : 'EN'}
            </button>

            {/* Theme */}
            <button onClick={toggleTheme} className="p-2 rounded-full transition-all duration-300 hover:opacity-70"
              style={{ color: navText, background: transparent ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {theme === 'light'
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                }
              </svg>
            </button>

            {/* Mobile */}
            <button className="md:hidden p-2" style={{ color: navText }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg" style={{ borderColor: 'rgba(199,164,138,0.1)' }}>
            <nav className="px-6 py-4 space-y-1">
              {navLinks.map(item => (
                <Link key={item.to} to={item.to} onClick={() => setIsMenuOpen(false)}
                  className="block py-3 font-medium border-b" style={{ color: '#1a1a2e', borderColor: 'rgba(199,164,138,0.08)' }}>
                  {item.label}
                </Link>
              ))}
              {!isAuthenticated ? (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block py-3 font-medium" style={{ color: '#c7a48a' }}>{t('Login')}</Link>
              ) : (
                <>
                  <Link to="/client/dashboard" onClick={() => setIsMenuOpen(false)} className="block py-3 font-medium" style={{ color: '#1a1a2e' }}>{t('Dashboard')}</Link>
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