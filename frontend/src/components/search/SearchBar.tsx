import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';

interface SearchSuggestion {
    type: 'service' | 'vendor' | 'category';
    text: string;
    category?: string;
}

export const SearchBar: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const fetchSuggestions = useCallback(
        debounce(async (searchQuery: string) => {
            if (searchQuery.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await fetch(
                    `http://localhost:5000/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`
                );
                const data = await response.json();
                if (data.success) {
                    setSuggestions(data.suggestions);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            }
        }, 300),
        []
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        setQuery(suggestion.text);
        setShowSuggestions(false);
        navigate(`/search?q=${encodeURIComponent(suggestion.text)}`);
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        fetchSuggestions(e.target.value);
                    }}
                    onFocus={() => query && suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={t('Search for services, vendors...')}
                    className="w-full px-12 py-4 rounded-full glass bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-white/40 focus:outline-none text-lg"
                />
                <button
                    type="submit"
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full glass bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 z-50">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-right hover:bg-white/20 transition flex items-center justify-between group first:rounded-t-xl last:rounded-b-xl"
                        >
                            <span className="text-gray-800 font-medium">{suggestion.text}</span>
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                {suggestion.type === 'service' ? t('Service') :
                                 suggestion.type === 'vendor' ? t('Vendor') : t('Category')}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </form>
    );
};
