import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClient } from '../context/ClientContext';
import { useToast } from '../context/ToastContext';
import { SearchIcon, LocationIcon, StarIcon, CameraIcon, MusicIcon, FlowerIcon, ChefHatIcon, HeartIcon } from '../components/icons';
import BookingModal from '../components/booking/BookingModal';

interface VendorProfile {
  id: number;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  vendorCategory: string;
  description: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: string;
  serviceCount: number;
  minPrice: number;
  maxPrice: number;
  serviceCategories: string[];
  profileImage: string | null;
}

// Keep legacy interface for booking modal compatibility
interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  images?: string[];
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  description?: string;
}


const Search: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { client, isAuthenticated } = useClient();
  const { showSuccess, showWarning, showError } = useToast();
  
  const categories = [t('All'), t('Photography'), t('Videography'), t('Floristry'), t('Venues'), t('Beauty'), t('Entertainment'), t('Cake & Sweets'), t('Planning')];
  const [category, setCategory] = useState<string>('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [services, setServices] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [compareList, setCompareList] = useState<VendorProfile[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);

  // Handle URL parameters and fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check URL parameters first
        const urlParams = new URLSearchParams(location.search);
        const categoryParam = urlParams.get('category');
        
        // Determine which category to use
        let activeCategory = category;
        if (categoryParam && categoryParam !== category) {
          activeCategory = categoryParam;
          setCategory(categoryParam);
          console.log('Updated category from URL:', categoryParam);
        }
        
        const params = new URLSearchParams();
        if (activeCategory !== 'All') params.append('category', activeCategory);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (minRating) params.append('minRating', minRating.toString());
        if (keyword) params.append('keyword', keyword);
        
        console.log('Fetching services with params:', params.toString());
        console.log('Active category:', activeCategory);
        
        const response = await fetch(`http://localhost:5000/api/services?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const data = await response.json();
        console.log('Received vendor profiles data:', data);
        console.log('Number of vendors received:', data.length);
        
        // Data is already in VendorProfile format from serviceRoutes.js
        setServices(data);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(t('Failed to load services. Please try again.'));
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [location.search, category, minPrice, maxPrice, minRating, keyword]);

  // Load favorites and compare list on component mount
  useEffect(() => {
    if (isAuthenticated && client) {
      loadFavorites();
    } else {
      setFavorites([]); // Clear favorites if not authenticated
    }
    
    const savedCompareList = localStorage.getItem('compareList');
    if (savedCompareList) {
      setCompareList(JSON.parse(savedCompareList));
    }
  }, [isAuthenticated, client]);

  const loadFavorites = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      if (!token || !client) return;

      const response = await fetch(`http://localhost:5000/api/favorites/${client.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const favorites = await response.json();
        const favoriteIds = favorites.map((fav: any) => fav.service ? fav.service.id : fav.service_id);
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Toggle favorite function
  const toggleFavorite = async (serviceId: number) => {
    if (!isAuthenticated || !client) {
      showWarning(t('Please log in to add services to your favorites'), 5000);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    try {
      const token = localStorage.getItem('clientToken');
      const isFavorite = favorites.includes(serviceId);
      
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch('http://localhost:5000/api/favorites/remove', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            clientId: client.id,
            serviceId: serviceId
          })
        });

        if (response.ok) {
          setFavorites(prev => prev.filter(id => id !== serviceId));
          showSuccess(t('Service removed from favorites successfully'));
          // Trigger a refresh of the wishlist if user is on dashboard
          window.dispatchEvent(new CustomEvent('favoritesUpdated'));
        } else {
          showError(t('Failed to remove service from favorites'));
        }
      } else {
        // Add to favorites
        const response = await fetch('http://localhost:5000/api/favorites/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            clientId: client.id,
            serviceId: serviceId
          })
        });

        if (response.ok) {
          setFavorites(prev => [...prev, serviceId]);
          showSuccess(t('Service added to favorites successfully'));
          // Trigger a refresh of the wishlist if user is on dashboard
          window.dispatchEvent(new CustomEvent('favoritesUpdated'));
        } else {
          const errorData = await response.json();
          console.error('Failed to add to favorites:', errorData);
          showError(`${t('Failed to add service to favorites')}: ${errorData.error || t('Unknown error')}`);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError(t('An error occurred while updating favorites'));
    }
  };

  // Toggle compare function
  const toggleCompare = (vendor: VendorProfile) => {
    setCompareList(prev => {
      const isInList = prev.find(s => s.id === vendor.id);
      if (isInList) {
        const newList = prev.filter(s => s.id !== vendor.id);
        localStorage.setItem('compareList', JSON.stringify(newList));
        return newList;
      } else if (prev.length < 4) {
        const newList = [...prev, vendor];
        localStorage.setItem('compareList', JSON.stringify(newList));
        return newList;
      } else {
        alert(t('You can only compare up to 4 services at a time'));
        return prev;
      }
    });
  };

  const filteredServices = services;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">{t('Search Services')}</h1>
        <div className="flex gap-3">
          <Link
            to="/compare"
            className="text-white px-6 py-3 rounded-xl transition-all duration-300 relative shadow-md hover:shadow-lg font-semibold"
            style={{
              background: 'linear-gradient(135deg, #c7a48a 0%, #d4b896 100%)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #b8956f 0%, #c5a685 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #c7a48a 0%, #d4b896 100%)';
            }}
          >
            {t('Compare')} ({compareList.length})
          </Link>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-primary-600 mb-4">
        {category !== t('All') ? `${category} ${t('Services')}` : t('Search Services')}
      </h1>
      {category !== 'All' && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
          <p className="text-blue-800">
            {t('Showing services in category')}: <strong>{category}</strong>
            <button 
              onClick={() => setCategory('All')} 
              className="ml-2 text-blue-600 underline hover:text-blue-800"
            >
              {t('Clear filter')}
            </button>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Keyword */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">{t('Keyword')}</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
            placeholder={t('e.g. photographer')}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">{t('Service Category')}</label>
          <select
            value={category}
                        onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="flex space-x-2">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('Min Price')}</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
              placeholder="0"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('Max Price')}</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
              placeholder="5000"
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">{t('Min Rating')}</label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full border border-accentNeutral rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
          >
            {[0, 3, 3.5, 4, 4.5, 5].map((r) => (
              <option key={r} value={r}>
                {r === 0 ? t('Any') : `${r}+`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('Loading services...')}</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            {t('Retry')}
          </button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">{t('No services match your criteria.')}</p>
          <button 
            onClick={() => {
              setCategory('All');
              setMinPrice('');
              setMaxPrice('');
              setMinRating(0);
              setKeyword('');
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            {t('Clear All Filters')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((vendor) => (
            <div key={vendor.id} className="glass rounded-2xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-white/20">
              <div className="relative">
                <img 
                  src={vendor.profileImage || 'https://via.placeholder.com/400x200?text=No+Image'} 
                  alt={vendor.businessName} 
                  className="w-full h-48 object-cover" 
                />
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => toggleFavorite(vendor.id)}
                    className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                      favorites.includes(vendor.id) 
                        ? 'bg-pink-500/90 text-white shadow-lg' 
                        : 'bg-white/90 text-gray-600 hover:bg-pink-500/90 hover:text-white'
                    }`}
                    title={favorites.includes(vendor.id) ? t('Remove from favorites') : t('Add to favorites')}
                  >
                    <HeartIcon 
                      size={18} 
                      className={favorites.includes(vendor.id) ? 'fill-current' : ''} 
                    />
                  </button>
                </div>
                {vendor.isVerified && (
                  <div className="absolute top-3 left-3 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                    ✓ {t('Verified')}
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-bold leading-tight" style={{ color: '#1f2640' }}>{vendor.businessName}</h2>
                  <div className="flex items-center bg-yellow-100/80 px-2 py-1 rounded-full backdrop-blur-sm">
                    <StarIcon className="text-yellow-600 mr-1" size={14} />
                    <span className="text-sm font-semibold text-yellow-700">{vendor.rating.toFixed(1)}</span>
                    {vendor.reviewCount > 0 && (
                      <span className="text-xs text-yellow-600 ml-1">({vendor.reviewCount})</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm" style={{ color: '#4a4a4a' }}>
                    <span className="font-medium">{vendor.ownerName}</span>
                  </p>
                  
                  <div className="flex items-center text-sm">
                    <LocationIcon className="mr-2 text-blue-400" size={16} />
                    <span className="font-medium" style={{ color: '#7e99c4' }}>
                      {vendor.vendorCategory}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm" style={{ color: '#4a4a4a' }}>
                    <span>{vendor.serviceCount} {t('Services')}</span>
                    {vendor.serviceCategories && vendor.serviceCategories.length > 0 && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {vendor.serviceCategories.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-lg font-bold" style={{ color: '#c7a48a' }}>
                      {vendor.minPrice === vendor.maxPrice 
                        ? `€${vendor.minPrice}` 
                        : `€${vendor.minPrice} - €${vendor.maxPrice}`
                      }
                    </div>
                    <span className="text-xs bg-white/60 px-2 py-1 rounded-full backdrop-blur-sm" style={{ color: '#4a4a4a' }}>{t('Price Range')}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-4">
                  <Link
                    to={`/vendor/${vendor.id}`}
                    className="w-full text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105 text-center"
                    style={{ 
                      background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #7e22ce 0%, #db2777 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)';
                    }}
                  >
                    📋 {t('View Profile')}
                  </Link>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setShowBookingModal(true);
                      }}
                      className="flex-1 text-white text-sm font-semibold py-2 px-3 rounded-xl transition-all duration-300 text-center shadow-md hover:shadow-lg"
                      style={{ 
                        background: 'linear-gradient(135deg, #7e99c4 0%, #5fa2f4 100%)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #6b8bb3 0%, #4a91e3 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #7e99c4 0%, #5fa2f4 100%)';
                      }}
                    >
                      🎉 {t('Book Now')}
                    </button>
                    
                    <button
                      onClick={() => toggleCompare(vendor)}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg ${
                        compareList.find(s => s.id === vendor.id)
                          ? 'text-white' 
                          : 'text-gray-600 hover:text-white'
                      }`}
                      style={{
                        background: compareList.find(s => s.id === vendor.id) 
                          ? 'linear-gradient(135deg, #c7a48a 0%, #d4b896 100%)'
                          : 'rgba(255, 255, 255, 0.6)'
                      }}
                      onMouseEnter={(e) => {
                        if (!compareList.find(s => s.id === vendor.id)) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #c7a48a 0%, #d4b896 100%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!compareList.find(s => s.id === vendor.id)) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                        }
                      }}
                      title={compareList.find(s => s.id === vendor.id) ? t('Remove from compare') : t('Add to compare')}
                    >
                      {compareList.find(s => s.id === vendor.id) ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Booking Modal */}
      {selectedVendor && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedVendor(null);
          }}
          service={{
            id: selectedVendor.id,
            name: selectedVendor.businessName,
            price: selectedVendor.minPrice,
            category: selectedVendor.vendorCategory,
            vendor_id: selectedVendor.id,
            business_name: selectedVendor.businessName
          }}
          clientId={client?.id || null}
        />
      )}
    </div>
  );
};

export default Search;