import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from "react-router-dom";
import { CameraIcon, VideoCameraIcon, FlowerIcon, LocationIcon, SparkleIcon, MicrophoneIcon, CakeIcon, ClipboardIcon } from '../components/icons';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroLoaded(true), 100);
  }, []);

  const categories = [
    { id: 'venues', title: t('Venues'), icon: <LocationIcon />, to: '/search?category=Venues' },
    { id: 'photography', title: t('Photography'), icon: <CameraIcon />, to: '/search?category=Photography' },
    { id: 'videography', title: t('Videography'), icon: <VideoCameraIcon />, to: '/search?category=Videography' },
    { id: 'floristry', title: t('Floristry'), icon: <FlowerIcon />, to: '/search?category=Floristry' },
    { id: 'beauty', title: t('Beauty'), icon: <SparkleIcon />, to: '/search?category=Beauty' },
    { id: 'entertainment', title: t('Entertainment'), icon: <MicrophoneIcon />, to: '/search?category=Entertainment' },
    { id: 'cake', title: t('Cake & Sweets'), icon: <CakeIcon />, to: '/search?category=Cake & Sweets' },
    { id: 'planning', title: t('Planning'), icon: <ClipboardIcon />, to: '/search?category=Planning' },
  ];

  const popularVendors = [
    { id: 1, name: "Elegant Ballroom", category: t("Venue"), image: "/images/images.jpeg" },
    { id: 2, name: "Bridal Boutique", category: t("Dress"), image: "/images/ABB+Cover+3.1.webp" },
    { id: 3, name: "Capture the Moment", category: t("Photography"), image: "/images/photo-1493863641943-9b68992a8d07.jpeg" },
  ];

  return (
    <div style={{ background: '#f4e9dc' }}>

      {/* ═══════ HERO ═══════ */}
      {/* The header is fixed and transparent on home, so hero needs top padding */}
      <section className="relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #ecc0a4 0%, #d4b8c7 35%, #a8b4d4 65%, #7e99c4 100%)',
        minHeight: '90vh', paddingTop: '80px'
      }}>
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ minHeight: 'calc(90vh - 80px)' }}>
          {/* Main Heading */}
          <h1 className={`font-playfair leading-tight max-w-3xl mx-auto transition-all duration-1000 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ fontSize: 'clamp(2.5rem, 7vw, 4.8rem)', color: '#ffffff', fontWeight: 500 }}>
            For your special day —
            <br />and all the other
            <br />special days.
          </h1>

          {/* CTA Button */}
          <div className={`mt-10 transition-all duration-1000 delay-300 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button onClick={() => navigate('/search')}
              className="px-8 py-3.5 rounded-lg text-white font-semibold text-lg transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: '#c7a48a' }}>
              {t('Find Vendors')}
            </button>
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full"><path d="M0 30C480 60 960 0 1440 30V60H0V30Z" fill="#f4e9dc"/></svg>
        </div>
      </section>

      {/* ═══════ POPULAR VENDORS ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="font-playfair text-4xl md:text-5xl text-center mb-14" style={{ color: '#1a1a2e', fontWeight: 500 }}>
          {t('Popular Vendors')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {popularVendors.map((v, i) => (
            <Link key={v.id} to={`/search`}
              className={`group transition-all duration-700 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${400 + i * 150}ms` }}>
              <div className="overflow-hidden rounded-2xl mb-5" style={{ aspectRatio: '4/5' }}>
                <img src={v.image} alt={v.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <h3 className="text-xl font-semibold mb-1" style={{ color: '#1a1a2e' }}>{v.name}</h3>
              <p className="text-sm" style={{ color: '#c7a48a' }}>{v.category}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="font-playfair text-4xl md:text-5xl text-center mb-14" style={{ color: '#1a1a2e', fontWeight: 500 }}>
          {t('What are you looking for?')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map(cat => (
            <Link key={cat.id} to={cat.to}
              className="group flex flex-col items-center py-8 px-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ background: '#ffffff', border: '1px solid rgba(199,164,138,0.15)' }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'rgba(232,197,151,0.1)' }}>
                <div className="w-8 h-8" style={{ color: '#e8c597' }}>{cat.icon}</div>
              </div>
              <span className="font-playfair font-medium text-base" style={{ color: '#1a1a2e' }}>{cat.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ WEDDING PLANNER CTA ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center rounded-3xl py-16 px-8" style={{ background: '#ffffff', border: '1px solid rgba(199,164,138,0.15)' }}>
          <h2 className="font-playfair text-3xl md:text-4xl mb-4" style={{ color: '#1a1a2e', fontWeight: 500 }}>
            {t('Sit back and let a professional handle it.')}
          </h2>
          <h3 className="font-playfair text-2xl md:text-3xl mb-8" style={{ color: '#c7a48a', fontWeight: 500 }}>
            {t('Hire a Wedding Planner')}
          </h3>
          <Link to="/search?category=Planning"
            className="inline-block px-8 py-3.5 rounded-lg text-white font-semibold transition-all hover:opacity-90 hover:shadow-lg"
            style={{ background: '#c7a48a' }}>
            {t('Browse Planners')}
          </Link>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-20" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-playfair text-4xl md:text-5xl text-center mb-14" style={{ color: '#1a1a2e', fontWeight: 500 }}>
            {t('How It Works')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: '01', title: t('Browse & Discover'), desc: t('Explore hundreds of verified wedding vendors across all categories.'), icon: '🔍' },
              { num: '02', title: t('Compare & Choose'), desc: t('Compare prices, reviews and portfolios. Add favorites to your wishlist.'), icon: '⚖️' },
              { num: '03', title: t('Book & Celebrate'), desc: t('Book directly through the platform and plan your perfect day.'), icon: '🎉' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-5">{step.icon}</div>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#c7a48a' }}>{step.num}</div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center rounded-3xl py-16 px-8" style={{
          background: 'linear-gradient(180deg, #ecc0a4 0%, #d4b8c7 50%, #7e99c4 100%)'
        }}>
          <h2 className="font-playfair text-3xl md:text-4xl mb-4 text-white" style={{ fontWeight: 500 }}>
            {t('Ready to Plan Your Dream Wedding?')}
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            {t('Join thousands of happy couples who found their perfect vendors.')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/search"
              className="px-8 py-3.5 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ background: '#ffffff', color: '#1a1a2e' }}>
              {t('Start Planning')}
            </Link>
            <Link to="/vendor/register"
              className="px-8 py-3.5 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
              {t('Join as Vendor')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;