import React from 'react';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t('Easy Search'),
      text: t('Find the perfect vendors with our advanced search and filtering system'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      title: t('Verified Vendors'),
      text: t('All our vendors are carefully vetted to ensure quality and reliability'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: t('Personal Support'),
      text: t('Our team is here to help you every step of the way to your perfect day'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ background: '#f4e9dc', minHeight: '100vh', paddingTop: '100px' }}>
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#c7a48a' }}>
            {t('About Us')}
          </p>
          <h1 className="font-playfair text-4xl md:text-5xl mb-4" style={{ color: '#1a1a2e', fontWeight: 500 }}>
            {t('About ONEDAY')}
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: '#a08b7a' }}>
            {t('Your trusted partner in creating unforgettable wedding experiences')}
          </p>
        </div>

        {/* Our Story */}
        <div className="rounded-2xl p-8 md:p-12 mb-8 grid md:grid-cols-2 gap-8 items-center"
          style={{ background: '#ffffff', border: '1px solid rgba(199,164,138,0.15)' }}>
          <div>
            <h2 className="font-playfair text-2xl md:text-3xl mb-4" style={{ color: '#1a1a2e', fontWeight: 500 }}>
              {t('Our Story')}
            </h2>
            <p className="mb-4 leading-relaxed" style={{ color: '#6b5e53' }}>
              {t("ONEDAY was born from a simple belief: every couple deserves their perfect wedding day. We understand that planning a wedding can be overwhelming, which is why we've created a platform that connects you with the best wedding vendors and services.")}
            </p>
            <p className="leading-relaxed" style={{ color: '#6b5e53' }}>
              {t('From photographers who capture your precious moments to venues that set the perfect scene, we bring together everything you need to make your special day truly magical.')}
            </p>
          </div>
          <div className="text-center">
            <div className="rounded-2xl w-48 h-48 mx-auto flex items-center justify-center"
              style={{ background: 'rgba(232,197,151,0.1)' }}>
              <svg className="w-24 h-24" style={{ color: '#e8c597' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: '#ffffff', border: '1px solid rgba(199,164,138,0.15)' }}>
              <div className="rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(232,197,151,0.1)' }}>
                <div style={{ color: '#e8c597' }}>{f.icon}</div>
              </div>
              <h3 className="font-playfair text-lg font-medium mb-2" style={{ color: '#1a1a2e' }}>
                {f.title}
              </h3>
              <p className="text-sm" style={{ color: '#b9a18e' }}>
                {f.text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center rounded-2xl py-14 px-8"
          style={{ background: '#ffffff', border: '1px solid rgba(199,164,138,0.15)' }}>
          <p className="font-playfair text-2xl md:text-3xl mb-2" style={{ color: '#1a1a2e', fontWeight: 500 }}>
            {t('Ready to Start Planning?')}
          </p>
          <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: '#a08b7a' }}>
            {t('Join thousands of couples who have found their perfect wedding vendors through ONEDAY')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.href = '/categories'}
              className="px-8 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: '#c7a48a' }}
            >
              {t('Browse Vendors')}
            </button>
            <button
              onClick={() => window.location.href = '/register'}
              className="px-8 py-3 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(199,164,138,0.1)', color: '#c7a48a' }}
            >
              {t('Get Started')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
