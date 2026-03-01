import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Vendor {
  id: number;
  businessName: string;
  ownerName: string;
  vendorCategory: string;
  description: string;
  rating: number;
  reviewCount: number;
  serviceCount: number;
  minPrice: number;
  maxPrice: number;
  serviceCategories: string[];
  profileImage: string | null;
  isVerified: boolean;
  city: string;
}

const BrowseServices: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    'All', 'Photography', 'Videography', 'Venues', 'Catering', 
    'Floristry', 'Music & DJ', 'Beauty', 'Planning', 'Decoration'
  ];

  useEffect(() => {
    fetchVendors();
  }, [selectedCategory]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'All' 
        ? 'http://localhost:5000/api/services'
        : `http://localhost:5000/api/services?category=${encodeURIComponent(selectedCategory)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('Frontend received data:', data);
      console.log('Number of vendors:', data.length);
      if (data.length > 0) {
        console.log('Sample vendor:', data[0]);
      }
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6d8d8] to-[#5a9be7] py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
              استعراض البائعين
            </h1>
            <p className="text-xl text-white/90">
              اكتشف أفضل البائعين ليومك المميز
            </p>
          </div>

          {/* Category Filter */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">تصفية حسب الفئة:</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-[#d4af37] text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {category === 'All' ? 'جميع الفئات' : 
                   category === 'Photography' ? 'التصوير' :
                   category === 'Videography' ? 'الفيديو' :
                   category === 'Venues' ? 'القاعات' :
                   category === 'Catering' ? 'الطعام' :
                   category === 'Floristry' ? 'الزهور' :
                   category === 'Music & DJ' ? 'الموسيقى' :
                   category === 'Beauty' ? 'التجميل' :
                   category === 'Planning' ? 'التنظيم' :
                   category === 'Decoration' ? 'الديكور' : 
                   category}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg">جاري تحميل البائعين...</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12 bg-white/10 backdrop-blur-md rounded-xl">
              <p className="text-white text-lg">لا توجد بائعين في هذه الفئة</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map(vendor => (
                <div key={vendor.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all">
                  {/* Vendor Profile Image */}
                  <div className="h-48 bg-white/20 rounded-lg mb-4 overflow-hidden">
                    {vendor.profileImage ? (
                      <img 
                        src={`http://localhost:5000${vendor.profileImage}`}
                        alt={vendor.businessName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center text-white/60"
                      style={{ display: vendor.profileImage ? 'none' : 'flex' }}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/30 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-2xl">👨‍💼</span>
                        </div>
                        <span className="text-sm">لا توجد صورة</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vendor Details */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-playfair text-xl font-semibold text-white">
                      {vendor.businessName}
                    </h3>
                    {vendor.isVerified && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        ✓ موثق
                      </span>
                    )}
                  </div>
                  
                  <p className="text-white/70 mb-2 text-sm">المالك: {vendor.ownerName}</p>
                  <p className="text-white/70 mb-2 text-sm line-clamp-2">{vendor.description || 'لا يوجد وصف'}</p>
                  
                  <div className="space-y-1 mb-3">
                    <p className="text-white/80 text-sm">
                      <span className="font-semibold">الفئة:</span> {vendor.vendorCategory}
                    </p>
                    <p className="text-white/80 text-sm">
                      <span className="font-semibold">عدد الخدمات:</span> {vendor.serviceCount}
                    </p>
                    <p className="text-white/80 text-sm">
                      <span className="font-semibold">نطاق الأسعار:</span> €{vendor.minPrice} - €{vendor.maxPrice}
                    </p>
                    {vendor.city && (
                      <p className="text-white/80 text-sm">
                        <span className="font-semibold">المدينة:</span> {vendor.city}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="text-white ml-1">
                        {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'جديد'}
                      </span>
                      <span className="text-white/60 text-sm mr-1">
                        ({vendor.reviewCount} تقييم)
                      </span>
                    </div>
                  </div>
                  
                  <Link
                    to={`/vendor/${vendor.id}`}
                    className="inline-block bg-[#d4af37] hover:bg-[#b48a3b] text-white px-6 py-2 rounded-lg font-semibold transition-colors w-full text-center"
                  >
                    عرض البروفايل
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
              <h2 className="font-playfair text-2xl font-semibold text-white mb-4">
                لا تجد ما تبحث عنه؟
              </h2>
              <p className="text-white/90 mb-6">
                تواصل معنا وسنساعدك في العثور على البائعين المناسبين لحفل زفافك
              </p>
              <Link
                to="/help"
                className="bg-[#d4af37] hover:bg-[#b48a3b] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                احصل على المساعدة
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseServices;
