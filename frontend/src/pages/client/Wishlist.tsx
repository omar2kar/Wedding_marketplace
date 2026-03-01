import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface WishlistItem {
  id: number;
  name: string;
  category: string;
  provider: string;
  price: string;
  rating: number;
  image?: string;
}

const Wishlist: React.FC = () => {
  const { t } = useTranslation();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    { id: 1, name: 'Elegant Wedding Dress', category: 'Dresses', provider: 'Bridal Boutique', price: '€460', rating: 4.8 },
    { id: 2, name: 'Professional DJ Service', category: 'Entertainment', provider: 'Party Masters', price: '€740', rating: 4.9 },
    { id: 3, name: 'Wedding Photography Package', category: 'Photography', provider: 'Capture Moments', price: '€1100', rating: 4.7 },
    { id: 4, name: 'Luxury Wedding Venue', category: 'Venues', provider: 'Grand Ballroom', price: '€4600', rating: 4.9 },
    { id: 5, name: 'Custom Wedding Invitations', category: 'Stationery', provider: 'Paper Elegance', price: '€280', rating: 4.6 },
  ]);

  const removeItem = (id: number) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">{t('myWishlist')}</h1>
        <p className="text-white/80">{t('saveYourFavoriteServices')}</p>
      </div>

      {wishlistItems.length > 0 ? ( 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="glass shadow-lg overflow-hidden">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="bg-white/10 border border-white/30 rounded-xl w-full h-48 flex items-center justify-center">
                  <span className="text-white/70">{t('noImage')}</span>
                </div>
              )}
              
              <div className="glass p-6 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    <p className="text-sm text-white/80">{item.category}</p>
                    <p className="text-sm text-white/80">{t('by')} {item.provider}</p>
                    <div className="flex items-center mt-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-sm text-white/80">{item.rating}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-xl font-bold text-primary-600 mt-3">{item.price}</p>
                
                <div className="mt-4 flex space-x-2">
                  <Link 
                    to={`/service/${item.id}`} 
                    className="flex-grow px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm text-center"
                  >
                    {t('viewDetails')}
                  </Link>
                  <Link 
                    to="/chat" 
                    className="px-3 py-1 border border-white/60 rounded-md hover:bg-white/10 transition text-sm text-center"
                  >
                    {t('contact')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-white">{t('emptyWishlist')}</h3>
          <p className="mt-1 text-white/70">{t('noItemsInWishlist')}</p>
          <Link 
            to="/" 
            className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
          >
            {t('browseServices')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
