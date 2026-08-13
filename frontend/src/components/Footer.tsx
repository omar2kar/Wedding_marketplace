import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer
      className="transition-colors duration-500 border-t border-transparent dark:border-[#d4af37]/20"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #0f111a 0%, #05060a 100%)'
          : 'linear-gradient(180deg, #f4e9dc 0%, #eaddd0 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-playfair text-2xl font-semibold mb-3 text-[#c7a48a] dark:text-[#d4af37] transition-colors duration-300 dark:drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
              ONEDAY
            </h3>
            <p className="text-sm leading-relaxed text-[#a08b7a] dark:text-slate-400">
              {t('Your one-stop wedding marketplace. Find, compare and book the best wedding vendors.')}
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-5 text-[#c7a48a] dark:text-[#d4af37]">
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
                  <Link
                    to={item.to}
                    className="text-sm text-[#a08b7a] dark:text-slate-400 hover:text-[#1a1a2e] dark:hover:text-[#f3e5ab] transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-5 text-[#c7a48a] dark:text-[#d4af37]">
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
                  <Link
                    to={item.to}
                    className="text-sm text-[#a08b7a] dark:text-slate-400 hover:text-[#1a1a2e] dark:hover:text-[#f3e5ab] transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-5 text-[#c7a48a] dark:text-[#d4af37]">
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
                  <Link
                    to={item.to}
                    className="text-sm text-[#a08b7a] dark:text-slate-400 hover:text-[#1a1a2e] dark:hover:text-[#f3e5ab] transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(199,164,138,0.25)] dark:border-[#d4af37]/20">
          <p className="text-xs text-[#b9a18e] dark:text-slate-500">
            © {new Date().getFullYear()} ONEDAY. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Instagram', 'Facebook', 'Pinterest'].map(social => (
              <a
                key={social}
                href="#"
                className="text-xs text-[#b9a18e] dark:text-slate-500 hover:text-[#1a1a2e] dark:hover:text-[#d4af37] transition-colors duration-300"
              >
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