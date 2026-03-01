import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClient } from '../../context/ClientContext';
import { useToast } from '../../context/ToastContext';

interface WishlistItem {
  id: number;
  serviceId: number;
  serviceName: string;
  vendorName: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  addedDate: string;
}

const ClientWishlist: React.FC = () => {
  const { client, isAuthenticated } = useClient();
  const { showSuccess, showError } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    if (isAuthenticated && client) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, client]);

  // Listen for favorites updates from other components
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      if (isAuthenticated && client) {
        fetchWishlist();
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    return () => window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
  }, [isAuthenticated, client]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('clientToken');
      
      if (!token || !client) {
        setWishlistItems([]);
        return;
      }

      console.log('Fetching favorites for client ID:', client.id);
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`http://localhost:5000/api/favorites/${client.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const favoritesData = await response.json();
        console.log('Fetched favorites:', favoritesData); // Debug log
        
        // Transform favorites data to wishlist format
        const wishlistData: WishlistItem[] = favoritesData.map((fav: any) => ({
          id: fav.id,
          serviceId: fav.service.id,
          serviceName: fav.service.name,
          vendorName: fav.service.vendor.businessName,
          category: fav.service.category,
          price: fav.service.price,
          rating: fav.service.vendor.rating,
          image: fav.service.images && fav.service.images.length > 0 ? fav.service.images[0] : 'https://via.placeholder.com/200',
          addedDate: fav.addedAt
        }));
        
        console.log('Transformed wishlist data:', wishlistData); // Debug log
        console.log('Favorite IDs:', favoritesData.map((fav: any) => fav.service.id)); // Debug log
        setWishlistItems(wishlistData);
        
        // Update favorites list for heart icons
        const favoriteIds = favoritesData.map((fav: any) => fav.service.id);
        setFavorites(favoriteIds);
      } else {
        console.error('Failed to fetch favorites, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setWishlistItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite function (same as in Search.tsx)
  const toggleFavorite = async (serviceId: number) => {
    if (!isAuthenticated || !client) {
      showError('Please log in to manage favorites');
      return;
    }

    console.log('Toggle favorite called for serviceId:', serviceId);
    console.log('Current favorites list:', favorites);
    console.log('Is favorite?', favorites.includes(serviceId));

    try {
      const token = localStorage.getItem('clientToken');
      const isFavorite = favorites.includes(serviceId);
      
      if (isFavorite) {
        console.log('Removing from favorites...');
        // Remove from favorites
        const response = await fetch(`http://localhost:5000/api/favorites/remove`, {
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

        console.log('Remove response status:', response.status);

        if (response.ok) {
          setFavorites(prev => prev.filter(id => id !== serviceId));
          setWishlistItems(prev => prev.filter(item => item.serviceId !== serviceId));
          showSuccess('Service removed from favorites successfully');
          // Trigger a refresh of the wishlist if user is on dashboard
          window.dispatchEvent(new CustomEvent('favoritesUpdated'));
        } else {
          const errorData = await response.json();
          console.error('Failed to remove from favorites:', errorData);
          showError(`Failed to remove service from favorites: ${errorData.error || 'Unknown error'}`);
        }
      } else {
        console.log('Adding to favorites...');
        // Add to favorites
        const response = await fetch(`http://localhost:5000/api/favorites/add`, {
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

        console.log('Add response status:', response.status);

        if (response.ok) {
          setFavorites(prev => [...prev, serviceId]);
          showSuccess('Service added to favorites successfully');
          // Trigger a refresh of the wishlist if user is on dashboard
          window.dispatchEvent(new CustomEvent('favoritesUpdated'));
        } else {
          const errorData = await response.json();
          console.error('Failed to add to favorites:', errorData);
          showError(`Failed to add service to favorites: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('An error occurred while updating favorites');
    }
  };

  const removeFromWishlist = async (itemId: number) => {
    // TODO: Implement remove from wishlist API call
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Photography': '📸',
      'Videography': '🎥',
      'Floristry': '🌸',
      'Venues': '🏛️',
      'Beauty': '💄',
      'Entertainment': '🎵',
      'Cake & Sweets': '🎂',
      'Planning': '📋'
    };
    return icons[category] || '💝';
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Please log in to view your wishlist</h3>
        <p className="text-gray-500 mb-6">
          You need to be logged in to access your saved services.
        </p>
        <Link
          to="/login"
          className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-1">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Share Wishlist
            </button>
          )}
        </div>
      </div>

      {/* Wishlist Items */}
      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6">
            Start adding services you love to keep track of them here.
          </p>
          <Link
            to="/categories"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Services
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    €{wishlistItems.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                  </p>
                </div>
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Categories</p>
                  <p className="text-xl font-bold text-gray-900">
                    {new Set(wishlistItems.map(item => item.category)).size}
                  </p>
                </div>
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Rating</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(wishlistItems.reduce((sum, item) => sum + item.rating, 0) / wishlistItems.length).toFixed(1)}
                  </p>
                </div>
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>

          {/* Wishlist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.serviceName}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(item.serviceId)}
                    className={`absolute top-2 right-2 rounded-full p-2 shadow-md transition-colors ${
                      favorites.includes(item.serviceId) 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-white text-gray-400 hover:bg-gray-50'
                    }`}
                    title={favorites.includes(item.serviceId) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute top-2 left-2 bg-white rounded-full px-3 py-1 shadow-md">
                    <span className="text-sm font-medium">
                      {getCategoryIcon(item.category)} {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.serviceName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">by {item.vendorName}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-purple-600">
                      €{item.price.toLocaleString()}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-sm text-gray-600">{item.rating}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      to={`/service/${item.serviceId}`}
                      className="flex-1 text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      View Details
                    </Link>
                    <button className="flex-1 text-center border border-purple-600 text-purple-600 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientWishlist;
