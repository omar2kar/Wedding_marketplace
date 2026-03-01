import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WeddingRingIcon, MessageIcon, UserIcon, SettingsIcon } from './icons';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-transparent text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <WeddingRingIcon className="icon-primary mr-2" size={24} />
              <h3 className="text-xl font-bold">{t('weddingMarketplace')}</h3>
            </div>
            <p className="text-white/80">{t('footerDescription')}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('forClients')}</h4>
            <ul className="space-y-2 text-white/80">
              <li><Link to="/browse-services" className="hover:text-white transition">{t('browseServices') || 'Browse Services'}</Link></li>
              <li><Link to="/create-wishlist" className="hover:text-white transition">{t('createWishlist') || 'Create Wishlist'}</Link></li>
              <li><Link to="/compare" className="hover:text-white transition">{t('compareOffers') || 'Compare Offers'}</Link></li>
              <li><Link to="/book-services" className="hover:text-white transition">{t('bookServices') || 'Book Services'}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('forProviders')}</h4>
            <ul className="space-y-2 text-white/80">
              <li><Link to="/vendor/register" className="hover:text-white transition">{t('createProfile') || 'Create Profile'}</Link></li>
              <li><Link to="/vendor/dashboard" className="hover:text-white transition">{t('manageAvailability') || 'Manage Availability'}</Link></li>
              <li><Link to="/vendor/dashboard" className="hover:text-white transition">{t('offerPackages') || 'Offer Packages'}</Link></li>
              <li><Link to="/vendor/dashboard" className="hover:text-white transition">{t('viewStatistics') || 'View Statistics'}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('forPlanners')}</h4>
            <ul className="space-y-2 text-white/80">
              <li><Link to="/about" className="hover:text-white transition">{t('plannerBenefits') || 'Planner Benefits'}</Link></li>
              <li><Link to="/planner/dashboard" className="hover:text-white transition">{t('createBundles') || 'Create Bundles'}</Link></li>
              <li><Link to="/about" className="hover:text-white transition">{t('noCommission') || 'No Commission'}</Link></li>
              <li><Link to="/planner/dashboard" className="hover:text-white transition">{t('plannerTools') || 'Planner Tools'}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-white/80">
          <p>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
