import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { API_BASE } from '../../config/api';
import { useTheme } from '../../context/ThemeContext'; // أضفنا استدعاء الثيم

interface RegisterFormInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormInputs>();
  const password = watch('password');

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/client/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || null
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // تم حذف الكائن inputStyle واستبداله بكلاسات Tailwind في الأسفل

  return (
    <div className="min-h-screen pt-20 transition-colors duration-300 bg-[#f4e9dc] dark:bg-[#090a10]">
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#121420] rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)] p-8 md:p-10 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 transition-colors">
            
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="font-playfair text-3xl font-semibold text-[#c7a48a] dark:text-[#d4af37] transition-colors">
                ONEDAY
              </Link>
              <h2 className="font-playfair text-2xl mt-4 mb-1 font-medium text-[#1a1a2e] dark:text-slate-100">
                {t('Create Account')}
              </h2>
              <p className="text-sm text-[#b9a18e] dark:text-slate-400">
                {t('Start planning your dream wedding')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">
                  {t('Full Name')}
                </label>
                <input type="text" placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] border border-[rgba(199,164,138,0.25)] dark:border-[#d4af37]/30 text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#c7a48a] dark:focus:ring-[#d4af37]/50"
                  {...register('name', { required: t('Name is required') })}
                />
                {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">
                  {t('Email')}
                </label>
                <input type="email" autoComplete="email" placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] border border-[rgba(199,164,138,0.25)] dark:border-[#d4af37]/30 text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#c7a48a] dark:focus:ring-[#d4af37]/50"
                  {...register('email', {
                    required: t('Email is required'),
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('Invalid email') }
                  })}
                />
                {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">
                  {t('Phone')} <span className="text-xs font-normal text-[#b9a18e] dark:text-slate-500">({t('optional')})</span>
                </label>
                <input type="tel" placeholder="+49 123 456 789" dir="ltr"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] border border-[rgba(199,164,138,0.25)] dark:border-[#d4af37]/30 text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#c7a48a] dark:focus:ring-[#d4af37]/50"
                  {...register('phone')}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">
                  {t('Password')}
                </label>
                <input type="password" autoComplete="new-password" placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] border border-[rgba(199,164,138,0.25)] dark:border-[#d4af37]/30 text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#c7a48a] dark:focus:ring-[#d4af37]/50"
                  {...register('password', {
                    required: t('Password is required'),
                    minLength: { value: 6, message: t('Minimum 6 characters') }
                  })}
                />
                {errors.password && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">
                  {t('Confirm Password')}
                </label>
                <input type="password" autoComplete="new-password" placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] border border-[rgba(199,164,138,0.25)] dark:border-[#d4af37]/30 text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#c7a48a] dark:focus:ring-[#d4af37]/50"
                  {...register('confirmPassword', {
                    required: t('Please confirm your password'),
                    validate: (value) => value === password || t('Passwords do not match')
                  })}
                />
                {errors.confirmPassword && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50 mt-2 flex justify-center items-center gap-2 ${
                  isDark 
                    ? 'bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5a059] text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                    : 'bg-[#c7a48a] text-white'
                }`}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('Creating Account...')}
                  </>
                ) : (
                  t('Create Account')
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[rgba(199,164,138,0.2)] dark:bg-[#d4af37]/20"></div>
              <span className="text-xs text-[#b9a18e] dark:text-slate-400">{t('or')}</span>
              <div className="flex-1 h-px bg-[rgba(199,164,138,0.2)] dark:bg-[#d4af37]/20"></div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-[#a08b7a] dark:text-slate-400">
                {t('Already have an account?')}{' '}
                <Link to="/login" className="font-semibold transition-colors text-[#c7a48a] dark:text-[#d4af37] hover:text-[#b59278] dark:hover:text-[#f3e5ab]">
                  {t('Sign In')}
                </Link>
              </p>
            </div>

            {/* Vendor Register */}
            <div className="text-center mt-4 pt-4 border-t border-[rgba(199,164,138,0.1)] dark:border-[#d4af37]/20">
              <p className="text-xs text-[#b9a18e] dark:text-slate-400">
                {t('Want to offer your services?')}{' '}
                <Link to="/vendor/register" className="font-semibold transition-colors text-[#7e99c4] dark:text-[#94a3b8] hover:text-[#5f7ba6] dark:hover:text-[#cbd5e1]">
                  {t('Register as Vendor')}
                </Link>
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;