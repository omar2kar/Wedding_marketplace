import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClient } from '../context/ClientContext';
import { useToast } from '../context/ToastContext';
import { HeartIcon, StarIcon } from '../components/icons';

interface Vendor {
  id: number;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  vendorCategory: string;
  description: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  serviceCount: number;
  minPrice: number;
  maxPrice: number;
  serviceCategories: string[];
  profileImage: string | null;
}

const Search: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { client, isAuthenticated } = useClient();
  const { showSuccess, showWarning, showError } = useToast();

  const categoryList = ['All', 'Photography', 'Videography', 'Floristry', 'Venues', 'Beauty', 'Entertainment', 'Cake & Sweets', 'Planning'];
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        const urlParams = new URLSearchParams(location.search);
        const categoryParam = urlParams.get('category');
        let activeCategory = category;
        if (categoryParam && categoryParam !== category) {
          activeCategory = categoryParam;
          setCategory(categoryParam);
        }
        const params = new URLSearchParams();
        if (activeCategory !== 'All') params.append('category', activeCategory);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (minRating) params.append('minRating', minRating.toString());
        if (keyword) params.append('keyword', keyword);

        const res = await fetch(`http://localhost:5000/api/services?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setVendors(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to load vendors.');
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [location.search, category, minPrice, maxPrice, minRating, keyword]);

  const clearFilters = () => {
    setCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setKeyword('');
    navigate('/search');
  };

  const getImg = (vendor: Vendor) => {
    if (imgErrors.has(vendor.id)) return null;
    if (!vendor.profileImage) return null;
    return vendor.profileImage.startsWith('http') ? vendor.profileImage : `http://localhost:5000${vendor.profileImage.startsWith('/') ? '' : '/'}${vendor.profileImage}`;
  };

  const hasActiveFilters = category !== 'All' || minPrice || maxPrice || minRating > 0 || keyword;

  return (
    <div style={{ background: '#f4e9dc', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-playfair text-3xl font-semibold" style={{ color: '#1a1a2e' }}>
              {category !== 'All' ? category : t('Find Vendors')}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#b9a18e' }}>
              {vendors.length} {t('vendors found')}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="ml-2 underline hover:opacity-70 transition" style={{ color: '#c7a48a' }}>
                  {t('Clear filters')}
                </button>
              )}
            </p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: '#ffffff', color: '#6b5e53', border: '1px solid rgba(199,164,138,0.25)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('Filters')}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categoryList.map(cat => (
            <button key={cat}
              onClick={() => { setCategory(cat); navigate(cat !== 'All' ? `/search?category=${cat}` : '/search'); }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: category === cat ? '#c7a48a' : '#ffffff',
                color: category === cat ? '#ffffff' : '#6b5e53',
                border: category === cat ? 'none' : '1px solid rgba(199,164,138,0.2)'
              }}>
              {t(cat === 'All' ? 'All' : cat)}
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            style={{ border: '1px solid rgba(199,164,138,0.15)' }}>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b5e53' }}>{t('Keyword')}</label>
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={t('e.g. studio name')}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#faf7f4', border: '1px solid rgba(199,164,138,0.2)', color: '#1a1a2e' }} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b5e53' }}>{t('Min Price')}</label>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#faf7f4', border: '1px solid rgba(199,164,138,0.2)', color: '#1a1a2e' }} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b5e53' }}>{t('Max Price')}</label>
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="5000"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#faf7f4', border: '1px solid rgba(199,164,138,0.2)', color: '#1a1a2e' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b5e53' }}>{t('Min Rating')}</label>
              <select value={minRating} onChange={e => setMinRating(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#faf7f4', border: '1px solid rgba(199,164,138,0.2)', color: '#1a1a2e' }}>
                {[0, 3, 3.5, 4, 4.5].map(r => <option key={r} value={r}>{r === 0 ? t('Any') : `${r}+`}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: 'rgba(199,164,138,0.1)', color: '#c7a48a' }}>
                {t('Clear All')}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#c7a48a' }}></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-xl text-white font-medium" style={{ background: '#c7a48a' }}>
              {t('Retry')}
            </button>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium mb-2" style={{ color: '#1a1a2e' }}>{t('No vendors found')}</p>
            <p className="text-sm mb-6" style={{ color: '#b9a18e' }}>{t('Try adjusting your filters')}</p>
            <button onClick={clearFilters} className="px-6 py-2.5 rounded-xl text-white font-medium" style={{ background: '#c7a48a' }}>
              {t('Clear All Filters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map(vendor => {
              const img = getImg(vendor);
              return (
                <Link key={vendor.id} to={`/vendor/${vendor.id}`}
                  className="group bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ border: '1px solid rgba(199,164,138,0.12)' }}>

                  {/* Image */}
                  <div className="relative h-52 overflow-hidden" style={{ background: 'linear-gradient(135deg, #f4e9dc, #ecc0a4)' }}>
                    {img ? (
                      <img src={img} alt={vendor.businessName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImgErrors(prev => new Set(prev).add(vendor.id))} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #c7a48a, #e8c597)' }}>
                          {vendor.businessName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    {/* Verified badge */}
                    {vendor.isVerified && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                        style={{ background: 'rgba(255,255,255,0.9)', color: '#10b981' }}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                    {/* Category */}
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(255,255,255,0.9)', color: '#6b5e53' }}>
                      {vendor.vendorCategory}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-1 group-hover:opacity-80 transition-colors" style={{ color: '#1a1a2e' }}>
                      {vendor.businessName}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: '#b9a18e' }}>{vendor.ownerName}</p>

                    {/* Rating & Services */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <StarIcon className="text-amber-400" size={14} />
                        <span className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>
                          {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}
                        </span>
                        {vendor.reviewCount > 0 && (
                          <span className="text-xs" style={{ color: '#b9a18e' }}>({vendor.reviewCount})</span>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: '#b9a18e' }}>
                        {vendor.serviceCount} {vendor.serviceCount === 1 ? 'service' : 'services'}
                      </span>
                    </div>

                    {/* Price Range */}
                    <div className="flex items-center justify-between">
                      <div>
                        {vendor.minPrice > 0 && (
                          <span className="text-lg font-bold" style={{ color: '#c7a48a' }}>
                            €{vendor.minPrice}{vendor.maxPrice > vendor.minPrice ? ` – €${vendor.maxPrice}` : ''}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all group-hover:shadow-sm"
                        style={{ background: 'rgba(199,164,138,0.1)', color: '#c7a48a' }}>
                        {t('View Profile')} →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;