import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config/api';

const VendorRegister: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    category: '',
    city: '',
    acceptTerms: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('Passwords do not match'));
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError(t('You must accept the terms and conditions'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/vendor/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.ownerName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          business_name: formData.businessName,
          category: formData.category
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        navigate('/vendor/login', { 
          state: { 
            message: t('Account created successfully pending approval'),
            type: 'success'
          }
        });
      } else {
        setError(data.error ? t(data.error) : t('Failed to create account'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('Failed to connect to server'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8 bg-[linear-gradient(170deg,#e7bcab_0%,#c1b5cc_45%,#8ba4c9_100%)] overflow-hidden selection:bg-[#cca281] selection:text-white">
      
      {/* 🌊 التموج السفلي (Wave) باللون الكريمي */}
      <div className="absolute bottom-0 left-0 w-full z-0 pointer-events-none fixed">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="#f7ebe0" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,144C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* زر تغيير اللغة - تصميم زجاجي */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1 bg-white/20 backdrop-blur-md p-1.5 rounded-xl border border-white/30 shadow-sm z-20">
        {[
          { code: 'en', label: 'EN' },
          { code: 'de', label: 'DE' },
        ].map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => changeLanguage(lang.code)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              i18n.language === lang.code
                ? 'bg-white text-[#cca281] shadow-sm'
                : 'text-white hover:bg-white/20'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#cca281]/10">
            <svg className="h-8 w-8 text-[#cca281]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-4xl font-serif text-white tracking-wide mb-2 drop-shadow-sm">
            {t('Join as Vendor')}
          </h2>
          <p className="text-white/80 text-sm font-medium">
            {t('Start showcasing your services')}
          </p>
        </div>

        {/* Registration Form */}
        <form className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name */}
            <div className="md:col-span-2">
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('Business Name *')}
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                className="w-full px-4 py-3 bg-[#f7ebe0]/30 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#cca281] focus:border-transparent transition-all outline-none text-gray-700"
                placeholder={t('Example: Dream Studio Photography')}
                value={formData.businessName}
                onChange={handleInputChange}
              />
            </div>

            {/* Owner Name */}
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('Owner Name *')}
              </label>
              <input
                id="ownerName"
                name="ownerName"
                type="text"
                required
                className="w-full px-4 py-3 bg-[#f7ebe0]/30 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#cca281] focus:border-transparent transition-all outline-none text-gray-700"
                placeholder={t('Full Name')}
                value={formData.ownerName}
                onChange={handleInputChange}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('Email *')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-[#f7ebe0]/30 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#cca281] focus:border-transparent transition-all outline-none text-gray-700"
                placeholder="vendor@example.com"
                value={formData.email}
                onChange={handleInputChange}
                dir="ltr"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('Phone Number *')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="w-full px-4 py-3 bg-[#f7ebe0]/30 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#cca281] focus:border-transparent transition-all outline-none text-gray-700"
                placeholder={t('Phone Placeholder')}
                value={formData.phone}
                onChange={handleInputChange}
                dir="ltr"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('Service Type *')}
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-4 py-3 bg-[#f7ebe0]/30 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#cca281] focus:border-transparent transition-all outline-none text-gray-700"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">{t('Select Service Type')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {t(category)}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('City *')}
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                className="w-full px-4 py-3 bg-[#f7ebe0]/30 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#cca281] focus:border-transparent transition-all outline-none text-gray-700"
                placeholder={t('City placeholder')}
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('Password *')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-[#f7ebe0]/30 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#cca281] focus:border-transparent transition-all outline-none text-gray-700"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('Confirm Password *')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-3 bg-[#f7ebe0]/30 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#cca281] focus:border-transparent transition-all outline-none text-gray-700"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className="flex items-start">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              required
              className="h-4 w-4 text-[#cca281] focus:ring-[#cca281] border-gray-300 rounded mt-1 cursor-pointer"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
            />
            <label htmlFor="acceptTerms" className="mx-3 text-sm text-gray-600">
              {t('I agree to the')}{' '}
              <Link to="/terms" className="text-[#cca281] hover:text-[#b89172] underline">
                {t('Terms and Conditions')}
              </Link>
              {' '}{t('and')}{' '}
              <Link to="/privacy" className="text-[#cca281] hover:text-[#b89172] underline">
                {t('Privacy Policy')}
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-[#cca281]/20 text-sm font-semibold text-white bg-[#cca281] hover:bg-[#b89172] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cca281] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('Creating Account...')}
              </div>
            ) : (
              t('Create Vendor Account')
            )}
          </button>

          {/* Login Link */}
          <div className="text-center pt-5 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {t('Already have an account?')}{' '}
              <Link to="/vendor/login" className="font-semibold text-[#cca281] hover:text-[#b89172] transition-colors">
                {t('Login')}
              </Link>
            </p>
          </div>

          {/* Back to Main Site */}
          <div className="text-center mt-2">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              {i18n.language === 'ar' ? `← ${t('Back to main site')}` : `← ${t('Back to main site')}`}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorRegister;