import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CameraIcon, VideoCameraIcon, FlowerIcon, LocationIcon, SparkleIcon, MicrophoneIcon, CakeIcon, ClipboardIcon } from '../components/icons';

const Categories: React.FC = () => {
  const { t } = useTranslation();

  const categories = [
    { id: 'photography', title: t('Photography'), subtitle: t('Capture the Moment'), icon: <CameraIcon />, to: '/search?category=Photography' },
    { id: 'videography', title: t('Videography'), subtitle: t('Video Coverage'), icon: <VideoCameraIcon />, to: '/search?category=Videography' },
    { id: 'floristry', title: t('Floristry'), subtitle: t('Bouquets & Decor'), icon: <FlowerIcon />, to: '/search?category=Floristry' },
    { id: 'venues', title: t('Venues'), subtitle: t('Halls & Gardens'), icon: <LocationIcon />, to: '/search?category=Venues' },
    { id: 'beauty', title: t('Beauty'), subtitle: t('Makeup & Hair'), icon: <SparkleIcon />, to: '/search?category=Beauty' },
    { id: 'entertainment', title: t('Entertainment'), subtitle: t('Music & Shows'), icon: <MicrophoneIcon />, to: '/search?category=Entertainment' },
    { id: 'cake', title: t('Cake & Sweets'), subtitle: t('Desserts & Treats'), icon: <CakeIcon />, to: '/search?category=Cake & Sweets' },
    { id: 'planning', title: t('Planning'), subtitle: t('Event Coordination'), icon: <ClipboardIcon />, to: '/search?category=Planning' },
  ];

  return (
    <div style={{ background: '#f4e9dc', minHeight: '100vh', paddingTop: '100px' }}>
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#c7a48a' }}>
            {t('Categories')}
          </p>
          <h1 className="font-playfair text-4xl md:text-5xl mb-4" style={{ color: '#1a1a2e', fontWeight: 500 }}>
            {t('What are you looking for?')}
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: '#a08b7a' }}>
            {t('Browse categories to find the right vendors for your special day.')}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <Link key={cat.id} to={cat.to}
              className="group flex flex-col items-center py-10 px-5 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(199,164,138,0.15)',
                animationDelay: `${i * 60}ms`
              }}>
              {/* Icon */}
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'rgba(232,197,151,0.1)' }}>
                <div className="w-8 h-8" style={{ color: '#e8c597' }}>{cat.icon}</div>
              </div>

              {/* Title */}
              <h3 className="font-playfair font-medium text-lg mb-1" style={{ color: '#1a1a2e' }}>
                {cat.title}
              </h3>

              {/* Subtitle */}
              <p className="text-xs" style={{ color: '#b9a18e' }}>{cat.subtitle}</p>

              {/* Bottom accent line */}
              <div className="mt-4 w-8 h-0.5 rounded-full transition-all duration-300 group-hover:w-12"
                style={{ background: '#e8c597' }}></div>
            </Link>
          ))}
        </div>

        {/* Wedding Planner CTA */}
        <div className="mt-16 text-center rounded-2xl py-14 px-8" style={{ background: '#ffffff', border: '1px solid rgba(199,164,138,0.15)' }}>
          <p className="font-playfair text-2xl md:text-3xl mb-2" style={{ color: '#1a1a2e', fontWeight: 500 }}>
            {t('Sit back and let a professional handle it.')}
          </p>
          <p className="font-playfair text-xl mb-6" style={{ color: '#c7a48a' }}>
            {t('Hire a Wedding Planner')}
          </p>
          <Link to="/search?category=Planning"
            className="inline-block px-8 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90 hover:shadow-lg"
            style={{ background: '#c7a48a' }}>
            {t('Browse Planners')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Categories;