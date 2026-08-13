import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useClient } from '../../context/ClientContext';
import { useTheme } from '../../context/ThemeContext';

interface LoginFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div className="bg-[#f4e9dc] dark:bg-[#090a10] min-h-screen pt-[80px] transition-colors duration-300">
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white dark:bg-[#121420]/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-8 md:p-10 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 transition-all duration-300">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="font-playfair text-3xl font-semibold text-[#c7a48a] dark:text-[#d4af37] transition-colors">
                ONEDAY
              </Link>
              <h2 className="font-playfair text-2xl mt-4 mb-1 text-[#1a1a2e] dark:text-slate-100 font-medium">
                {t('Welcome Back')}
              </h2>
              <p className="text-sm text-[#b9a18e] dark:text-slate-400">
                {t('Sign in to your account')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">
                  {t('Email')}
                </label>
                <input type="email" autoComplete="email" placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#faf7f4] dark:bg-[#1a1d2e] border border-[rgba(199,164,138,0.25)] dark:border-[#d4af37]/30 text-[#1a1a2e] dark:text-slate-100 placeholder:dark:text-slate-500 focus:border-[#c7a48a] dark:focus:border-[#d4af37]"
                  {...register('email', {
                    required: t('Email is required'),
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('Invalid email') }
                  })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#6b5e53] dark:text-slate-300">
                  {t('Password')}
                </label>
                <input type="password" autoComplete="current-password" placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#faf7f4] dark:bg-[#1a1d2e] border border-[rgba(199,164,138,0.25)] dark:border-[#d4af37]/30 text-[#1a1a2e] dark:text-slate-100 placeholder:dark:text-slate-500 focus:border-[#c7a48a] dark:focus:border-[#d4af37]"
                  {...register('password', {
                    required: t('Password is required'),
                    minLength: { value: 6, message: t('Minimum 6 characters') }
                  })}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-[#c7a48a] dark:accent-[#d4af37]"
                    {...register('rememberMe')} />
                  <span className="text-sm text-[#a08b7a] dark:text-slate-400">{t('Remember me')}</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-medium hover:opacity-70 transition-colors text-[#c7a48a] dark:text-[#d4af37]">
                  {t('Forgot password?')}
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-md disabled:opacity-50 ${
                  isDark 
                    ? 'text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)]' 
                    : 'text-white hover:opacity-90'
                }`}
                style={{
                  background: isDark 
                    ? 'linear-gradient(to right, #d4af37, #f3e5ab, #c5a059)' 
                    : '#c7a48a'
                }}>
                {isLoading ? t('Signing in...') : t('Sign In')}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[rgba(199,164,138,0.2)] dark:bg-[#d4af37]/20"></div>
              <span className="text-xs text-[#b9a18e] dark:text-slate-500">{t('or')}</span>
              <div className="flex-1 h-px bg-[rgba(199,164,138,0.2)] dark:bg-[#d4af37]/20"></div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-[#a08b7a] dark:text-slate-400">
                {t("Don't have an account?")}{' '}
                <Link to="/register" className="font-semibold hover:opacity-70 transition-colors text-[#c7a48a] dark:text-[#d4af37]">
                  {t('Create Account')}
                </Link>
              </p>
            </div>

            {/* Vendor Login Link */}
            <div className="text-center mt-4 pt-4 border-t border-[rgba(199,164,138,0.1)] dark:border-[#d4af37]/15">
              <p className="text-xs text-[#b9a18e] dark:text-slate-500">
                {t('Are you a vendor?')}{' '}
                <Link to="/vendor/login" className="font-semibold hover:opacity-70 transition-colors text-[#7e99c4] dark:text-[#9bb8f0]">
                  {t('Vendor Login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;