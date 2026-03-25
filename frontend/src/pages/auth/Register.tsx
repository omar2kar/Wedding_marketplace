import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormInputs>();
  const password = watch('password');

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/client/register', {
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

  const inputStyle = {
    background: '#faf7f4',
    border: '1.5px solid rgba(199,164,138,0.25)',
    color: '#1a1a2e'
  };

  return (
    <div style={{ background: '#f4e9dc', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-10" style={{ border: '1px solid rgba(199,164,138,0.15)' }}>
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="font-playfair text-3xl font-semibold" style={{ color: '#c7a48a' }}>
                ONEDAY
              </Link>
              <h2 className="font-playfair text-2xl mt-4 mb-1" style={{ color: '#1a1a2e', fontWeight: 500 }}>
                {t('Create Account')}
              </h2>
              <p className="text-sm" style={{ color: '#b9a18e' }}>
                {t('Start planning your dream wedding')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b5e53' }}>{t('Full Name')}</label>
                <input type="text" placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  {...register('name', { required: t('Name is required') })}
                  onFocus={e => e.target.style.borderColor = '#c7a48a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(199,164,138,0.25)'}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b5e53' }}>{t('Email')}</label>
                <input type="email" autoComplete="email" placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  {...register('email', {
                    required: t('Email is required'),
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('Invalid email') }
                  })}
                  onFocus={e => e.target.style.borderColor = '#c7a48a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(199,164,138,0.25)'}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b5e53' }}>
                  {t('Phone')} <span className="text-xs font-normal" style={{ color: '#b9a18e' }}>({t('optional')})</span>
                </label>
                <input type="tel" placeholder="+49 123 456 789" dir="ltr"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  {...register('phone')}
                  onFocus={e => e.target.style.borderColor = '#c7a48a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(199,164,138,0.25)'}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b5e53' }}>{t('Password')}</label>
                <input type="password" autoComplete="new-password" placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  {...register('password', {
                    required: t('Password is required'),
                    minLength: { value: 6, message: t('Minimum 6 characters') }
                  })}
                  onFocus={e => e.target.style.borderColor = '#c7a48a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(199,164,138,0.25)'}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b5e53' }}>{t('Confirm Password')}</label>
                <input type="password" autoComplete="new-password" placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  {...register('confirmPassword', {
                    required: t('Please confirm your password'),
                    validate: (value) => value === password || t('Passwords do not match')
                  })}
                  onFocus={e => e.target.style.borderColor = '#c7a48a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(199,164,138,0.25)'}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50 mt-2"
                style={{ background: '#c7a48a' }}>
                {isLoading ? t('Creating Account...') : t('Create Account')}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(199,164,138,0.2)' }}></div>
              <span className="text-xs" style={{ color: '#b9a18e' }}>{t('or')}</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(199,164,138,0.2)' }}></div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm" style={{ color: '#a08b7a' }}>
                {t('Already have an account?')}{' '}
                <Link to="/login" className="font-semibold hover:opacity-70 transition-colors" style={{ color: '#c7a48a' }}>
                  {t('Sign In')}
                </Link>
              </p>
            </div>

            {/* Vendor Register */}
            <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid rgba(199,164,138,0.1)' }}>
              <p className="text-xs" style={{ color: '#b9a18e' }}>
                {t('Want to offer your services?')}{' '}
                <Link to="/vendor/register" className="font-semibold hover:opacity-70 transition-colors" style={{ color: '#7e99c4' }}>
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