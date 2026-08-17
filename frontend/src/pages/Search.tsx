import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClient } from '../context/ClientContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { HeartIcon, StarIcon } from '../components/icons';
import { API_BASE, SERVER_BASE } from '../config/api';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const categoryList = [
  'All',
  'Photography',
  'Videography',
  'Floristry & Decoration',
  'Locations',
  'Beauty & Styling',
  'Music & Show',
  'Wedding Cakes & Sweets',
  'Wedding Planner',
  'Catering',
  'Bridal Fashion',
  'Wedding Cars & Transport',
  'Wedding Rings & Jewelry',
];
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

        const res = await fetch(`${API_BASE}/services?${params}`);
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
    return vendor.profileImage.startsWith('http') ? vendor.profileImage : `${SERVER_BASE}${vendor.profileImage.startsWith('/') ? '' : '/'}${vendor.profileImage}`;
  };

  const hasActiveFilters = category !== 'All' || minPrice || maxPrice || minRating > 0 || keyword;

  return (
    <div className="min-h-screen pt-[80px] transition-colors duration-300 bg-[#f4e9dc] dark:bg-[#090a10] text-[#1a1a2e] dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-playfair text-3xl font-semibold text-[#1a1a2e] dark:text-slate-100">
              {category !== 'All' ? category : t('Find Vendors')}
            </h1>
            <p className="text-sm mt-1 text-[#b9a18e] dark:text-slate-400">
              {vendors.length} {t('vendors found')}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="ml-2 underline hover:opacity-70 transition text-[#c7a48a] dark:text-[#d4af37]">
                  {t('Clear filters')}
                </button>
              )}
            </p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-white dark:bg-[#121420]/80 text-[#6b5e53] dark:text-slate-200 border border-[rgba(199,164,138,0.25)] dark:border-[#d4af37]/20 hover:dark:border-[#d4af37] hover:dark:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
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
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat
                  ? isDark
                    ? 'bg-[#d4af37] text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                    : 'bg-[#c7a48a] text-white'
                  : isDark
                    ? 'bg-[#121420]/80 text-slate-300 border border-[#d4af37]/20 hover:border-[#d4af37] hover:text-[#f3e5ab] hover:bg-[#1b1d2b]'
                    : 'bg-white text-[#6b5e53] border border-[rgba(199,164,138,0.2)] hover:shadow-md'
              }`}>
              {t(cat === 'All' ? 'All' : cat)}
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-[#121420]/80 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">{t('Keyword')}</label>
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={t('e.g. studio name')}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-[#faf7f4] dark:bg-[#0d0e15] border border-[rgba(199,164,138,0.2)] dark:border-[#d4af37]/20 text-[#1a1a2e] dark:text-slate-100 placeholder:text-[#b9a18e] dark:placeholder:text-slate-500 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 transition-colors" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">{t('Min Price')}</label>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-[#faf7f4] dark:bg-[#0d0e15] border border-[rgba(199,164,138,0.2)] dark:border-[#d4af37]/20 text-[#1a1a2e] dark:text-slate-100 placeholder:text-[#b9a18e] dark:placeholder:text-slate-500 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 transition-colors" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">{t('Max Price')}</label>
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="5000"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-[#faf7f4] dark:bg-[#0d0e15] border border-[rgba(199,164,138,0.2)] dark:border-[#d4af37]/20 text-[#1a1a2e] dark:text-slate-100 placeholder:text-[#b9a18e] dark:placeholder:text-slate-500 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">{t('Min Rating')}</label>
              <select value={minRating} onChange={e => setMinRating(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-[#faf7f4] dark:bg-[#0d0e15] border border-[rgba(199,164,138,0.2)] dark:border-[#d4af37]/20 text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 transition-colors">
                {[0, 3, 3.5, 4, 4.5].map(r => <option key={r} value={r}>{r === 0 ? t('Any') : `${r}+`}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 bg-[rgba(199,164,138,0.1)] dark:bg-[#d4af37]/10 text-[#c7a48a] dark:text-[#d4af37] border border-transparent dark:border-[#d4af37]/20 hover:dark:bg-[#d4af37]/20">
                {t('Clear All')}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c7a48a] dark:border-[#d4af37]"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className={`px-6 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5a059] text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_25px_rgba(212,175,55,0.55)]' : 'bg-[#c7a48a] text-white'}`}>
              {t('Retry')}
            </button>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium mb-2 text-[#1a1a2e] dark:text-slate-100">{t('No vendors found')}</p>
            <p className="text-sm mb-6 text-[#b9a18e] dark:text-slate-400">{t('Try adjusting your filters')}</p>
            <button onClick={clearFilters} className={`px-6 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5a059] text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_25px_rgba(212,175,55,0.55)]' : 'bg-[#c7a48a] text-white'}`}>
              {t('Clear All Filters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map(vendor => {
              const img = getImg(vendor);
              return (
                <Link key={vendor.id} to={`/vendor/${vendor.id}`}
                  className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#121420]/80 border border-[rgba(199,164,138,0.12)] dark:border-[#d4af37]/20 hover:dark:border-[#d4af37] hover:shadow-lg hover:dark:shadow-[0_10px_30px_rgba(212,175,55,0.18)]">

                  {/* Image */}
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#f4e9dc] to-[#ecc0a4] dark:bg-[#1f2235] dark:bg-none">
                    {img ? (
                      <img src={img} alt={vendor.businessName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImgErrors(prev => new Set(prev).add(vendor.id))} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white dark:text-slate-950 bg-gradient-to-br from-[#c7a48a] to-[#e8c597] dark:from-[#d4af37] dark:via-[#f3e5ab] dark:to-[#c5a059]">
                          {vendor.businessName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    {/* Verified badge */}
                    {vendor.isVerified && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-white/90 dark:bg-[#0f111b]/90 text-emerald-500 dark:text-emerald-400 border border-transparent dark:border-[#d4af37]/15">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                    {/* Category */}
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-[#0f111b]/90 text-[#6b5e53] dark:text-slate-200 border border-transparent dark:border-[#d4af37]/15">
                      {vendor.vendorCategory}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-1 group-hover:opacity-80 transition-colors text-[#1a1a2e] dark:text-slate-100 dark:group-hover:text-[#d4af37]">
                      {vendor.businessName}
                    </h3>
                    <p className="text-xs mb-3 text-[#b9a18e] dark:text-slate-400">{vendor.ownerName}</p>

                    {/* Rating & Services */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <StarIcon className="text-amber-400" size={14} />
                        <span className="text-sm font-semibold text-[#1a1a2e] dark:text-slate-100">
                          {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}
                        </span>
                        {vendor.reviewCount > 0 && (
                          <span className="text-xs text-[#b9a18e] dark:text-slate-400">({vendor.reviewCount})</span>
                        )}
                      </div>
                      <span className="text-xs text-[#b9a18e] dark:text-slate-400">
                        {vendor.serviceCount} {vendor.serviceCount === 1 ? 'service' : 'services'}
                      </span>
                    </div>

                    {/* Price Range */}
                    <div className="flex items-center justify-between">
                      <div>
                        {vendor.minPrice > 0 && (
                          <span className="text-lg font-bold text-[#c7a48a] dark:text-[#d4af37]">
                            €{vendor.minPrice}{vendor.maxPrice > vendor.minPrice ? ` – €${vendor.maxPrice}` : ''}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all group-hover:shadow-sm bg-[rgba(199,164,138,0.1)] dark:bg-[#d4af37]/10 text-[#c7a48a] dark:text-[#d4af37] border border-transparent dark:border-[#d4af37]/20 group-hover:dark:bg-[#d4af37]/20">
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