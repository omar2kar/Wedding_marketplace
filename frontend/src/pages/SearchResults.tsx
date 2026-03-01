import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/search/SearchBar';

interface ServiceResult {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    vendor_name: string;
    vendor_city: string;
    average_rating: number;
    total_reviews: number;
    primary_image: string;
}

const SearchResults: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [results, setResults] = useState<ServiceResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        minPrice: 0,
        maxPrice: 10000,
        minRating: 0,
        sortBy: 'rating',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    });

    const categories = [
        'Photography', 'Videography', 'Catering', 'DJ',
        'Venue', 'Decoration', 'Flowers', 'Cake',
        'Makeup', 'Dress', 'Invitation', 'Transportation'
    ];

    useEffect(() => {
        performSearch();
    }, [location.search, filters]);

    const performSearch = async (page = 1) => {
        setLoading(true);
        const urlParams = new URLSearchParams(location.search);
        const query = urlParams.get('q') || '';

        const searchParams = new URLSearchParams({
            q: query,
            category: filters.category,
            minPrice: filters.minPrice.toString(),
            maxPrice: filters.maxPrice.toString(),
            minRating: filters.minRating.toString(),
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            page: page.toString(),
            limit: '12'
        });

        try {
            const response = await fetch(`http://localhost:5000/api/search/services?${searchParams}`);
            const data = await response.json();
            
            if (data.success) {
                setResults(data.data || []);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <div className="glass backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <SearchBar />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex gap-6">
                    {/* Filters Sidebar */}
                    <div className="w-80 glass rounded-lg p-6 h-fit">
                        <h3 className="text-lg font-bold text-white mb-4">{t('Filters')}</h3>

                        {/* Category */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                {t('Category')}
                            </label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({...filters, category: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg glass bg-white/10 text-white border border-white/20"
                            >
                                <option value="">{t('All Categories')}</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{t(cat)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Range */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                {t('Price Range')}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={filters.minPrice}
                                    onChange={(e) => setFilters({...filters, minPrice: Number(e.target.value)})}
                                    className="flex-1 px-3 py-2 rounded-lg glass bg-white/10 text-white border border-white/20"
                                />
                                <span className="text-white/50 self-center">-</span>
                                <input
                                    type="number"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})}
                                    className="flex-1 px-3 py-2 rounded-lg glass bg-white/10 text-white border border-white/20"
                                />
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                {t('Minimum Rating')}
                            </label>
                            <div className="flex gap-2">
                                {[0, 3, 4, 5].map(rating => (
                                    <button
                                        key={rating}
                                        onClick={() => setFilters({...filters, minRating: rating})}
                                        className={`flex-1 py-2 rounded-lg text-sm ${
                                            filters.minRating === rating
                                                ? 'bg-white/30 text-white'
                                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                                        }`}
                                    >
                                        {rating === 0 ? t('All') : `${rating}★`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="flex-1">
                        {/* Sort Controls */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-white">
                                <span className="font-bold">{pagination.totalItems}</span> {t('results found')}
                            </div>
                            
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                                className="px-3 py-2 rounded-lg glass bg-white/10 text-white border border-white/20"
                            >
                                <option value="rating">{t('Rating')}</option>
                                <option value="price">{t('Price')}</option>
                                <option value="popularity">{t('Popularity')}</option>
                            </select>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                            </div>
                        )}

                        {/* Results Grid */}
                        {!loading && results.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results.map(service => (
                                    <div key={service.id} className="glass rounded-lg overflow-hidden hover:shadow-xl transition">
                                        {/* Image */}
                                        <div className="h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                                            {service.primary_image ? (
                                                <img
                                                    src={`http://localhost:5000${service.primary_image}`}
                                                    alt={service.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-white text-lg mb-1">{service.name}</h3>
                                            <p className="text-white/70 text-sm mb-2">{service.vendor_name}</p>
                                            
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-yellow-400">★</span>
                                                    <span className="text-white">{service.average_rating?.toFixed(1) || '0.0'}</span>
                                                    <span className="text-white/50 text-xs">({service.total_reviews || 0})</span>
                                                </div>
                                                <div className="text-white/70 text-sm">
                                                    📍 {service.vendor_city}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-xl font-bold text-white">${service.price}</span>
                                                <button
                                                    onClick={() => navigate(`/service/${service.id}`)}
                                                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition text-sm"
                                                >
                                                    {t('View')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!loading && results.length === 0 && (
                            <div className="text-center py-12">
                                <h3 className="text-xl font-bold text-white mb-2">{t('No results found')}</h3>
                                <p className="text-white/70">{t('Try adjusting your filters')}</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                {Array.from({length: pagination.totalPages}, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => performSearch(page)}
                                        className={`px-4 py-2 rounded-lg ${
                                            page === pagination.currentPage
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                                : 'glass bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchResults;
