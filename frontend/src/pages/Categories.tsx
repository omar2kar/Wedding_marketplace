import React from 'react';
import { useTranslation } from 'react-i18next';
import CategoryCard from '../components/CategoryCard';
import { Link } from 'react-router-dom';
import { CameraIcon, VideoCameraIcon, FlowerIcon, ChefHatIcon, LocationIcon, SparkleIcon, MicrophoneIcon, CakeIcon, ClipboardIcon } from '../components/icons';

// If you don't have a dress icon, we define a simple one here:
const DressIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6s2 1 4 1 3-1 3-1 1.2 0 3 1 4-1 4-1-1 8-4 11c0 0-2 3-3 3s-3-3-3-3C7 20 5 17 4 11 3 8 3 6 3 6z" />
  </svg>
);

const Categories: React.FC = () => {
  const { t } = useTranslation();

  // Categories index - each item can contain a link that leads to the search page with a category filter
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
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="font-playfair text-4xl md:text-5xl font-semibold">{t('What are you looking for?')}</h2>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">{t('Browse categories to find the right vendors for your special day.')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {categories.map((c) => (
          <Link key={c.id} to={c.to} className="block">
            <CategoryCard title={c.title} subtitle={c.subtitle} icon={c.icon} to={c.to} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;
