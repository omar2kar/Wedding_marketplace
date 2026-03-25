import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer style={{ background: 'linear-gradient(180deg, #f4e9dc 0%, #eaddd0 100%)' }}>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-playfair text-2xl font-semibold mb-3" style={{ color: '#c7a48a' }}>ONEDAY</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#a08b7a' }}>
              {t('Your one-stop wedding marketplace. Find, compare and book the best wedding vendors.')}
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#c7a48a' }}>
              {t('For Clients')}
            </h4>
            <ul className="space-y-2.5">
              {[
                { to: '/categories', label: t('Browse Vendors') },
                { to: '/search', label: t('Compare Services') },
                { to: '/client/dashboard/wishlist', label: t('Wishlist') },
                { to: '/client/dashboard/wedding', label: t('Wedding Planner') },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm transition-colors hover:opacity-70" style={{ color: '#a08b7a' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#c7a48a' }}>
              {t('For Vendors')}
            </h4>
            <ul className="space-y-2.5">
              {[
                { to: '/vendor/register', label: t('Create Profile') },
                { to: '/vendor/dashboard', label: t('Manage Services') },
                { to: '/vendor/dashboard', label: t('View Bookings') },
                { to: '/vendor/dashboard', label: t('Analytics') },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm transition-colors hover:opacity-70" style={{ color: '#a08b7a' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#c7a48a' }}>
              {t('Support')}
            </h4>
            <ul className="space-y-2.5">
              {[
                { to: '/about', label: t('About Us') },
                { to: '/about', label: t('Contact') },
                { to: '/about', label: t('Terms of Service') },
                { to: '/about', label: t('Privacy Policy') },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm transition-colors hover:opacity-70" style={{ color: '#a08b7a' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 flex flex-wrap items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(199,164,138,0.25)' }}>
          <p className="text-xs" style={{ color: '#b9a18e' }}>
            © {new Date().getFullYear()} ONEDAY. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Instagram', 'Facebook', 'Pinterest'].map(social => (
              <a key={social} href="#" className="text-xs transition-colors hover:opacity-70" style={{ color: '#b9a18e' }}>
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;