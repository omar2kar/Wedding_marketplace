import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

const CreateWishlist: React.FC = () => {
  const { t } = useTranslation();
  const [wishlistName, setWishlistName] = useState('');
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const sampleServices = [
    { id: 1, name: 'Premium Photography', category: 'Photography', price: 2500, image: 'https://picsum.photos/200/150?random=1' },
    { id: 2, name: 'Elegant Venue', category: 'Venues', price: 5000, image: 'https://picsum.photos/200/150?random=2' },
    { id: 3, name: 'Gourmet Catering', category: 'Catering', price: 3500, image: 'https://picsum.photos/200/150?random=3' },
    { id: 4, name: 'Bridal Makeup', category: 'Beauty', price: 800, image: 'https://picsum.photos/200/150?random=4' }
  ];

  const addToWishlist = (service: WishlistItem) => {
    if (!wishlistItems.find(item => item.id === service.id)) {
      setWishlistItems([...wishlistItems, service]);
      toast.success(`${service.name} added to wishlist!`);
    } else {
      toast.error('Item already in wishlist');
    }
  };

  const removeFromWishlist = (serviceId: number) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== serviceId));
    toast.success('Item removed from wishlist');
  };

  const saveWishlist = () => {
    if (!wishlistName.trim()) {
      toast.error('Please enter a wishlist name');
      return;
    }
    
    const wishlist = {
      name: wishlistName,
      items: wishlistItems,
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage for demo
    const existingWishlists = JSON.parse(localStorage.getItem('wishlists') || '[]');
    existingWishlists.push(wishlist);
    localStorage.setItem('wishlists', JSON.stringify(existingWishlists));
    
    toast.success('Wishlist saved successfully!');
    setWishlistName('');
    setWishlistItems([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6d8d8] to-[#5a9be7] py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
              Create Your Wishlist
            </h1>
            <p className="text-xl text-white/90">
              Save your favorite wedding services for easy comparison
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Available Services */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
                <h2 className="font-playfair text-2xl font-semibold text-white mb-6">
                  Available Services
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {sampleServices.map(service => (
                    <div key={service.id} className="bg-white/10 rounded-lg p-4">
                      <img 
                        src={service.image} 
                        alt={service.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-semibold text-white mb-1">{service.name}</h3>
                      <p className="text-white/80 text-sm mb-2">{service.category}</p>
                      <p className="text-white/80 text-sm mb-3">€{service.price}</p>
                      <button
                        onClick={() => addToWishlist(service)}
                        className="w-full bg-[#d4af37] hover:bg-[#b48a3b] text-white py-2 rounded-lg font-semibold transition-colors"
                      >
                        Add to Wishlist
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Wishlist Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 sticky top-6">
                <h2 className="font-playfair text-2xl font-semibold text-white mb-4">
                  Your Wishlist
                </h2>
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Enter wishlist name..."
                    value={wishlistName}
                    onChange={(e) => setWishlistName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {wishlistItems.length === 0 ? (
                  <p className="text-white/80 text-center py-8">
                    No items in wishlist yet
                  </p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {wishlistItems.map(item => (
                      <div key={item.id} className="bg-white/10 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-white text-sm">{item.name}</h4>
                            <p className="text-white/80 text-xs">{item.category}</p>
                            <p className="text-white/80 text-xs">€{item.price}</p>
                          </div>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={saveWishlist}
                    disabled={wishlistItems.length === 0 || !wishlistName.trim()}
                    className="w-full bg-[#d4af37] hover:bg-[#b48a3b] disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Save Wishlist
                  </button>
                  
                  <Link
                    to="/wishlist"
                    className="block w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg font-semibold text-center transition-colors"
                  >
                    View Saved Wishlists
                  </Link>
                </div>

                {wishlistItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-white/80 text-sm">
                      Total: €{wishlistItems.reduce((sum, item) => sum + item.price, 0)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWishlist;
