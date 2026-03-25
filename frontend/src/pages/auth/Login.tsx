import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useClient } from '../../context/ClientContext';

interface LoginFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useClient();
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
    <div style={{ background: '#f4e9dc', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-10" style={{ border: '1px solid rgba(199,164,138,0.15)' }}>
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="font-playfair text-3xl font-semibold" style={{ color: '#c7a48a' }}>
                ONEDAY
              </Link>
              <h2 className="font-playfair text-2xl mt-4 mb-1" style={{ color: '#1a1a2e', fontWeight: 500 }}>
                {t('Welcome Back')}
              </h2>
              <p className="text-sm" style={{ color: '#b9a18e' }}>
                {t('Sign in to your account')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b5e53' }}>
                  {t('Email')}
                </label>
                <input type="email" autoComplete="email" placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#faf7f4', border: '1.5px solid rgba(199,164,138,0.25)', color: '#1a1a2e' }}
                  {...register('email', {
                    required: t('Email is required'),
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('Invalid email') }
                  })}
                  onFocus={e => e.target.style.borderColor = '#c7a48a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(199,164,138,0.25)'}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b5e53' }}>
                  {t('Password')}
                </label>
                <input type="password" autoComplete="current-password" placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#faf7f4', border: '1.5px solid rgba(199,164,138,0.25)', color: '#1a1a2e' }}
                  {...register('password', {
                    required: t('Password is required'),
                    minLength: { value: 6, message: t('Minimum 6 characters') }
                  })}
                  onFocus={e => e.target.style.borderColor = '#c7a48a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(199,164,138,0.25)'}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: '#c7a48a' }}
                    {...register('rememberMe')} />
                  <span className="text-sm" style={{ color: '#a08b7a' }}>{t('Remember me')}</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-medium hover:opacity-70 transition-colors" style={{ color: '#c7a48a' }}>
                  {t('Forgot password?')}
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50"
                style={{ background: '#c7a48a' }}>
                {isLoading ? t('Signing in...') : t('Sign In')}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(199,164,138,0.2)' }}></div>
              <span className="text-xs" style={{ color: '#b9a18e' }}>{t('or')}</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(199,164,138,0.2)' }}></div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm" style={{ color: '#a08b7a' }}>
                {t("Don't have an account?")}{' '}
                <Link to="/register" className="font-semibold hover:opacity-70 transition-colors" style={{ color: '#c7a48a' }}>
                  {t('Create Account')}
                </Link>
              </p>
            </div>

            {/* Vendor Login Link */}
            <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid rgba(199,164,138,0.1)' }}>
              <p className="text-xs" style={{ color: '#b9a18e' }}>
                {t('Are you a vendor?')}{' '}
                <Link to="/vendor/login" className="font-semibold hover:opacity-70 transition-colors" style={{ color: '#7e99c4' }}>
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