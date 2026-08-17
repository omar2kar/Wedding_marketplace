import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CameraIcon,
  VideoCameraIcon,
  FlowerIcon,
  LocationIcon,
  SparkleIcon,
  MicrophoneIcon,
  CakeIcon,
  ClipboardIcon
} from '../components/icons';
import { useTheme } from '../context/ThemeContext';

const Categories: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const categories = [
    {
      id: 'photography',
      title: t('Photography'),
      subtitle: t('Capture the Moment'),
      icon: <CameraIcon />,
      to: '/search?category=Photography'
    },
    {
      id: 'videography',
      title: t('Videography'),
      subtitle: t('Video Coverage'),
      icon: <VideoCameraIcon />,
      to: '/search?category=Videography'
    },
    {
      id: 'floristry-decoration',
      title: t('Floristry & Decoration'),
      subtitle: t('Bouquets & Decor'),
      icon: <FlowerIcon />,
      to: '/search?category=Floristry & Decoration'
    },
    {
      id: 'locations',
      title: t('Locations'),
      subtitle: t('Halls & Gardens'),
      icon: <LocationIcon />,
      to: '/search?category=Locations'
    },
    {
      id: 'beauty-styling',
      title: t('Beauty & Styling'),
      subtitle: t('Makeup & Hair'),
      icon: <SparkleIcon />,
      to: '/search?category=Beauty & Styling'
    },
    {
      id: 'music-show',
      title: t('Music & Show'),
      subtitle: t('Music & Shows'),
      icon: <MicrophoneIcon />,
      to: '/search?category=Music & Show'
    },
    {
      id: 'wedding-cakes-sweets',
      title: t('Wedding Cakes & Sweets'),
      subtitle: t('Desserts & Treats'),
      icon: <CakeIcon />,
      to: '/search?category=Wedding Cakes & Sweets'
    },
    {
      id: 'wedding-planner',
      title: t('Wedding Planner'),
      subtitle: t('Event Coordination'),
      icon: <ClipboardIcon />,
      to: '/search?category=Wedding Planner'
    },
    {
      id: 'catering',
      title: t('Catering'),
      subtitle: t('Food & Service'),
      icon: <CakeIcon />,
      to: '/search?category=Catering'
    },
    {
      id: 'bridal-fashion',
      title: t('Bridal Fashion'),
      subtitle: t('Dresses & Styles'),
      icon: <SparkleIcon />,
      to: '/search?category=Bridal Fashion'
    },
    {
      id: 'wedding-cars-transport',
      title: t('Wedding Cars & Transport'),
      subtitle: t('Luxury Cars & Transport'),
      icon: <LocationIcon />,
      to: '/search?category=Wedding Cars & Transport'
    },
    {
      id: 'wedding-rings-jewelry',
      title: t('Wedding Rings & Jewelry'),
      subtitle: t('Rings & Jewelry'),
      icon: <SparkleIcon />,
      to: '/search?category=Wedding Rings & Jewelry'
    }
  ];

  return (
    <div className="bg-[#f4e9dc] dark:bg-[#090a10] min-h-screen pt-[100px] transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-[#c7a48a] dark:text-[#d4af37]">
            {t('Categories')}
          </p>

          <h1 className="font-playfair text-4xl md:text-5xl mb-4 text-[#1a1a2e] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#d4af37] dark:via-[#f3e5ab] dark:to-[#c5a059] font-medium">
            {t('What are you looking for?')}
          </h1>

          <p className="text-base max-w-xl mx-auto text-[#a08b7a] dark:text-slate-400">
            {t('Browse categories to find the right vendors for your special day.')}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={cat.to}
              className="group flex flex-col items-center py-10 px-5 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-white dark:bg-[#121420]/80 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 hover:dark:border-[#d4af37] hover:dark:shadow-[0_0_25px_rgba(212,175,55,0.2)]"
              style={{
                animationDelay: `${i * 60}ms`
              }}
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 bg-[rgba(232,197,151,0.1)] dark:bg-[#1f2235]">
                <div className="w-8 h-8 text-[#e8c597] dark:text-[#d4af37] transition-colors">
                  {cat.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className="font-playfair font-medium text-lg mb-1 text-[#1a1a2e] dark:text-slate-100 group-hover:dark:text-[#f3e5ab] transition-colors">
                {cat.title}
              </h3>

              {/* Subtitle */}
              <p className="text-xs text-[#b9a18e] dark:text-slate-400">
                {cat.subtitle}
              </p>

              {/* Bottom accent line */}
              <div className="mt-4 w-8 h-0.5 rounded-full transition-all duration-300 group-hover:w-12 bg-[#e8c597] dark:bg-[#d4af37]"></div>
            </Link>
          ))}
        </div>

        {/* Wedding Planner CTA */}
        <div className="mt-16 text-center rounded-2xl py-14 px-8 bg-white dark:bg-gradient-to-b dark:from-[#131524] dark:to-[#0b0c14] border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/30 dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <p className="font-playfair text-2xl md:text-3xl mb-2 text-[#1a1a2e] dark:text-slate-100 font-medium">
            {t('Sit back and let a professional handle it.')}
          </p>

          <p className="font-playfair text-xl mb-6 text-[#c7a48a] dark:text-[#d4af37]">
            {t('Hire a Wedding Planner')}
          </p>

          <Link
            to="/search?category=Wedding Planner"
            className={`inline-block px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg ${
              isDark
                ? 'text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.7)]'
                : 'text-white hover:opacity-90'
            }`}
            style={{
              background: isDark
                ? 'linear-gradient(to right, #d4af37, #f3e5ab, #c5a059)'
                : '#c7a48a'
            }}
          >
            {t('Browse Planners')}
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Categories;