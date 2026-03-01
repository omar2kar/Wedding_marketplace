import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, StarIcon, LocationIcon } from '../../components/icons';

interface Favorite {
  id: number;
  addedAt: string;
  service: {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    images: string[];
    vendor: {
      id: number;
      businessName: string;
      ownerName: string;
      email: string;
      phone: string;
      rating: number;
    };
  };
}

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Temporary client ID - should come from auth context
  const clientId = 1;

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/favorites/client/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const data = await response.json();
      setFavorites(data);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (serviceId: number) => {
    try {
      const response = await fetch('http://localhost:5000/api/favorites/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, serviceId }),
      });
      
      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.service.id !== serviceId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchFavorites} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <HeartIcon className="text-red-500 mr-3" size={32} />
        <h1 className="text-3xl font-bold text-primary-600">My Favorites</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="text-gray-300 mx-auto mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No favorites yet</h2>
          <p className="text-gray-500 mb-6">Start exploring services and add them to your favorites!</p>
          <Link 
            to="/search" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300"
          >
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="glass rounded-lg overflow-hidden hover:bg-white/15 transition-all duration-300">
              <div className="relative">
                <img 
                  src={favorite.service.images[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
                  alt={favorite.service.name} 
                  className="w-full h-48 object-cover" 
                />
                <button
                  onClick={() => removeFavorite(favorite.service.id)}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-300"
                  title="Remove from favorites"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{favorite.service.name}</h3>
                
                <div className="flex items-center text-sm text-white/80 mb-2">
                  <LocationIcon className="icon-secondary mr-1" size={14} />
                  <span>Category: {favorite.service.category}</span>
                </div>
                
                <p className="text-sm text-white/70 mb-2">
                  By: {favorite.service.vendor.businessName || favorite.service.vendor.ownerName}
                </p>
                
                <p className="text-sm text-white/80 mb-2">Price: €{favorite.service.price}</p>
                
                <div className="flex items-center text-sm text-yellow-400 mb-3">
                  <StarIcon className="icon-warning mr-1" size={14} />
                  <span>Rating: {favorite.service.vendor.rating}</span>
                </div>
                
                <p className="text-xs text-white/60 mb-3">
                  Added: {new Date(favorite.addedAt).toLocaleDateString()}
                </p>
                
                <div className="flex justify-between items-center">
                  <Link
                    to={`/service/${favorite.service.id}`}
                    className="bg-pink-500 hover:bg-pink-600 text-white text-sm px-4 py-2 rounded transition-all duration-300"
                  >
                    View Details
                  </Link>
                  
                  <Link
                    to={`/vendor/${favorite.service.vendor.id}`}
                    className="text-purple-300 hover:text-purple-200 text-sm underline"
                  >
                    View Vendor
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
