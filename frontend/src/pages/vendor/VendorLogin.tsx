import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../../config/api';

const VendorLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/vendor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('vendorToken', data.token);
        localStorage.setItem('vendorData', JSON.stringify(data.vendor));
        navigate('/vendor/dashboard');
      } else {
        if (data.status === 'pending') {
          setError(t('Your account is pending admin approval. Please wait for approval before logging in.'));
        } else if (data.status === 'rejected') {
          setError(t('Your account has been rejected. Please contact support for more information.'));
        } else if (data.status === 'suspended') {
          setError(t('Your account has been suspended. Please contact support.'));
        } else {
          setError(data.error ? t(data.error) : t('Failed to login. Please check your credentials.'));
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('Failed to connect to server. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[linear-gradient(170deg,#e7bcab_0%,#c1b5cc_45%,#8ba4c9_100%)] overflow-hidden selection:bg-[#cca281] selection:text-white">
      
      {/* 🌊 التموج السفلي (Wave) باللون الكريمي ليتطابق مع تصميم الموقع */}
      <div className="absolute bottom-0 left-0 w-full z-0 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="#f7ebe0" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,144C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* زر تغيير اللغة - تصميم ناعم زجاجي */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1 bg-white/20 backdrop-blur-md p-1.5 rounded-xl border border-white/30 shadow-sm z-20">
        {[
          { code: 'en', label: 'EN' },
          { code: 'de', label: 'DE' }
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

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* الهيدر والعنوان */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#cca281]/10">
            <svg className="h-8 w-8 text-[#cca281]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <h2 className="text-4xl font-serif text-white tracking-wide mb-2 drop-shadow-sm">
            {t('Vendor Login')}
          </h2>
          <p className="text-white/80 text-sm font-medium">
            {t('Access your control panel')}
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-3xl shadow-xl shadow-black/5" onSubmit={handleSubmit}>
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* حقل البريد الإلكتروني */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('Email')}
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

            {/* حقل كلمة المرور */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1.5">
                {t('Password')}
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
          </div>

          {/* تذكرني & نسيت كلمة المرور */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#cca281] focus:ring-[#cca281] border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="mx-2 block text-gray-600 cursor-pointer">
                {t('Remember me')}
              </label>
            </div>

            <Link to="/vendor/forgot-password" className="font-semibold text-[#cca281] hover:text-[#b89172] transition-colors">
              {t('Forgot password?')}
            </Link>
          </div>

          {/* زر الدخول */}
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
                {t('Logging in...')}
              </div>
            ) : (
              t('Login')
            )}
          </button>

          {/* رابط التسجيل */}
          <div className="text-center pt-5 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {t("Don't have an account?")}{' '}
              <Link to="/vendor/register" className="font-semibold text-[#cca281] hover:text-[#b89172] transition-colors">
                {t('Register as new vendor')}
              </Link>
            </p>
          </div>

          {/* العودة للموقع */}
          <div className="text-center mt-2">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              {i18n.language === 'ar' ? `← ${t('Back to main site')}` : `← ${t('Back to main site')}`}
            </Link>
          </div>
        </form>

        {/* بيانات الدخول التجريبية */}
        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-center">
          <p className="text-sm text-white font-semibold mb-1">{t('Demo Credentials:')}</p>
          <p className="text-xs text-white/80">
            {t('Email')}: vendor@test.com | {t('Password')}: {t('any password')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;