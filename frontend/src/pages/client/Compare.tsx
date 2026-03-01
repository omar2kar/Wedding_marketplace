import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, LocationIcon, HeartIcon } from '../../components/icons';

interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  rating: number;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  vendor: {
    id: number;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    category: string;
    isVerified: boolean;
    rating: number;
    reviewCount: number;
  };
}

const Compare: React.FC = () => {
  const [compareList, setCompareList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load compare list from localStorage
    const saved = localStorage.getItem('compareList');
    if (saved) {
      setCompareList(JSON.parse(saved));
    }
  }, []);

  const removeFromCompare = (serviceId: number) => {
    const updated = compareList.filter(service => service.id !== serviceId);
    setCompareList(updated);
    localStorage.setItem('compareList', JSON.stringify(updated));
  };

  const clearAll = () => {
    setCompareList([]);
    localStorage.removeItem('compareList');
  };

  const addToFavorites = async (serviceId: number) => {
    // Temporary client ID - should come from auth context
    const clientId = 1;
    
    try {
      const response = await fetch('http://localhost:5000/api/favorites/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, serviceId }),
      });
      
      if (response.ok) {
        // Show success message or update UI
        console.log('Added to favorites');
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  if (compareList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary-600 mb-6">Compare Services</h1>
        
        <div className="text-center py-12">
          <div className="text-gray-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No services to compare</h2>
          <p className="text-gray-500 mb-6">Add services from the search page to compare them side by side!</p>
          <Link 
            to="/search" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300"
          >
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-600">Compare Services</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-600">{compareList.length} services selected</span>
          <button
            onClick={clearAll}
            className="text-red-600 hover:text-red-700 text-sm underline"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {compareList.map((service) => (
              <div key={service.id} className="glass rounded-lg overflow-hidden">
                {/* Service Image */}
                <div className="relative">
                  <img 
                    src={service.images[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
                    alt={service.name} 
                    className="w-full h-48 object-cover" 
                  />
                  <button
                    onClick={() => removeFromCompare(service.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-300"
                    title="Remove from comparison"
                  >
                    ✕
                  </button>
                </div>

                {/* Service Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{service.name}</h3>
                  
                  {/* Category */}
                  <div className="flex items-center text-sm text-white/80 mb-2">
                    <LocationIcon className="icon-secondary mr-1" size={14} />
                    <span>{service.category}</span>
                  </div>

                  {/* Vendor */}
                  <div className="mb-3">
                    <p className="text-sm text-white/70 mb-1">Vendor:</p>
                    <p className="text-sm font-medium text-white">{service.vendorName}</p>
                    {service.vendor?.isVerified && (
                      <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded mt-1">
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <p className="text-sm text-white/70 mb-1">Price:</p>
                    <p className="text-lg font-bold text-green-400">€{service.price}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    <StarIcon className="text-yellow-400 mr-1" size={16} />
                    <span className="text-white font-medium">{service.rating}</span>
                    <span className="text-white/60 text-sm ml-1">
                      ({service.vendor?.reviewCount || 0} reviews)
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="mb-4 text-sm">
                    <p className="text-white/70 mb-1">Contact:</p>
                    <p className="text-white/80">{service.vendorEmail}</p>
                    <p className="text-white/80">{service.vendorPhone}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/service/${service.id}`}
                      className="bg-pink-500 hover:bg-pink-600 text-white text-sm px-4 py-2 rounded text-center transition-all duration-300"
                    >
                      View Details
                    </Link>
                    
                    <button
                      onClick={() => addToFavorites(service.id)}
                      className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded transition-all duration-300"
                    >
                      <HeartIcon size={16} />
                      Add to Favorites
                    </button>

                    <Link
                      to={`/vendor/${service.vendor?.id}`}
                      className="text-purple-300 hover:text-purple-200 text-sm text-center underline"
                    >
                      View Vendor Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      {compareList.length > 1 && (
        <div className="mt-8 glass rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Comparison</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Price Comparison */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Price Range</h3>
              <p className="text-green-400">
                €{Math.min(...compareList.map(s => s.price))} - €{Math.max(...compareList.map(s => s.price))}
              </p>
              <p className="text-sm text-white/70">
                Average: €{Math.round(compareList.reduce((sum, s) => sum + s.price, 0) / compareList.length)}
              </p>
            </div>

            {/* Rating Comparison */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Ratings</h3>
              <p className="text-yellow-400">
                {Math.min(...compareList.map(s => s.rating))} - {Math.max(...compareList.map(s => s.rating))} ⭐
              </p>
              <p className="text-sm text-white/70">
                Average: {(compareList.reduce((sum, s) => sum + s.rating, 0) / compareList.length).toFixed(1)}
              </p>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Categories</h3>
              <div className="flex flex-wrap gap-1">
                {Array.from(new Set(compareList.map(s => s.category))).map(category => (
                  <span key={category} className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;
