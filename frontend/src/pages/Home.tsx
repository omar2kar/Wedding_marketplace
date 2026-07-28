import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from "react-router-dom";
import { CameraIcon, VideoCameraIcon, FlowerIcon, LocationIcon, SparkleIcon, MicrophoneIcon, CakeIcon, ClipboardIcon } from '../components/icons';
import { motion } from 'motion/react';

import {
    ScrollReveal,
    StaggerGrid,
    heroTitle,
    heroCTA,
} from "../animations";
import { API_BASE, SERVER_BASE } from '../config/api';



/* ── Floating particles for hero ── */
const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 18 }).map((_, i) => {
      const size = 4 + Math.random() * 8;
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = 10 + Math.random() * 15;
      return (
        <div key={i} className="absolute rounded-full" style={{
          width: size, height: size,
          left: `${left}%`,
          bottom: '-10px',
          background: `rgba(255,255,255,${0.15 + Math.random() * 0.2})`,
          animation: `floatUp ${duration}s ${delay}s linear infinite`
        }} />
      );
    })}
    <style>{`
      @keyframes floatUp {
        0% { transform: translateY(0) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
      }
    `}</style>
  </div>
);

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();


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

  const [popularVendors, setPopularVendors] = useState<{id:number; businessName:string; category:string; profileImage:string|null}[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/featured-vendors`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPopularVendors(data);
        } else {
          // Fallback if no featured vendors set
          setPopularVendors([
            { id: 0, businessName: "Elegant Ballroom", category: "Venue", profileImage: "/images/images.jpeg" },
            { id: 0, businessName: "Bridal Boutique", category: "Dress", profileImage: "/images/ABB+Cover+3.1.webp" },
            { id: 0, businessName: "Capture the Moment", category: "Photography", profileImage: "/images/photo-1493863641943-9b68992a8d07.jpeg" },
          ]);
        }
      })
      .catch(() => {
        setPopularVendors([
          { id: 0, businessName: "Elegant Ballroom", category: "Venue", profileImage: "/images/images.jpeg" },
          { id: 0, businessName: "Bridal Boutique", category: "Dress", profileImage: "/images/ABB+Cover+3.1.webp" },
          { id: 0, businessName: "Capture the Moment", category: "Photography", profileImage: "/images/photo-1493863641943-9b68992a8d07.jpeg" },
        ]);
      });
  }, []);

  const steps = [
    { num: '01', title: t('Browse & Discover'), desc: t('Explore hundreds of verified wedding vendors across all categories.'), icon: '🔍' },
    { num: '02', title: t('Compare & Choose'), desc: t('Compare prices, reviews and portfolios. Add favorites to your wishlist.'), icon: '⚖️' },
    { num: '03', title: t('Book & Celebrate'), desc: t('Book directly through the platform and plan your perfect day.'), icon: '🎉' },
  ];

  return (

    <div style={{ background: '#f4e9dc' }}>

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #ecc0a4 0%, #d4b8c7 35%, #a8b4d4 65%, #7e99c4 100%)',
        minHeight: '90vh', paddingTop: '80px'
      }}>
        <Particles />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ minHeight: 'calc(90vh - 80px)' }}>
          <motion.h1
    variants={heroTitle}
    initial="initial"
    animate="animate"
    className="font-playfair leading-tight max-w-3xl mx-auto"
    style={{
        fontSize: 'clamp(2.5rem, 7vw, 4.8rem)',
        color: '#ffffff',
        fontWeight: 500
    }}
>
            For your special day —
            <br />and all the other
            <br />special days.
          </motion.h1>

          <motion.div
    variants={heroCTA}
    initial="initial"
    animate="animate"
    className="mt-10"
>
            <button onClick={() => navigate('/search')}
              className="relative px-8 py-3.5 rounded-lg text-white font-semibold text-lg overflow-hidden group"
              style={{ background: '#c7a48a' }}>
              <span className="relative z-10">{t('Find Vendors')}</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{
        delay: 1.2,
        duration: 1
    }}
    className="absolute bottom-24"
>
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-white/50 rounded-full" style={{ animation: 'scrollBounce 2s ease-in-out infinite' }}></div>
            </div>
            <style>{`@keyframes scrollBounce { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(8px); opacity: 0.3; } }`}</style>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full"><path d="M0 30C480 60 960 0 1440 30V60H0V30Z" fill="#f4e9dc"/></svg>
        </div>
      </section>

      {/* ═══════ POPULAR VENDORS ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <h2 className="font-playfair text-4xl md:text-5xl text-center mb-14"
            style={{ color: '#1a1a2e', fontWeight: 500 }}>
            {t('Popular Vendors')}
          </h2>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-8" speed="slow">
          {popularVendors.map((v, i) => (
            <Link key={v.id || i} to={v.id ? `/vendor/${v.id}` : '/search'} className="group">
              <div className="overflow-hidden rounded-2xl mb-5 relative" style={{ aspectRatio: '4/5', background: 'linear-gradient(135deg, #f4e9dc, #ecc0a4)' }}>
                {v.profileImage ? (
                  <img src={v.profileImage.startsWith('http') ? v.profileImage : `${SERVER_BASE}${v.profileImage.startsWith('/') ? '' : '/'}${v.profileImage}`}
                    alt={v.businessName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-white/60 font-playfair">{v.businessName.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <h3 className="text-xl font-semibold mb-1 transition-colors duration-300 group-hover:opacity-70" style={{ color: '#1a1a2e' }}>{v.businessName}</h3>
              <p className="text-sm" style={{ color: '#c7a48a' }}>{v.category}</p>
            </Link>
          ))}
        </StaggerGrid>
      </section>

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <h2 className="font-playfair text-4xl md:text-5xl text-center mb-14"
            style={{ color: '#1a1a2e', fontWeight: 500 }}>
            {t('What are you looking for?')}
          </h2>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5" hoverable={false}>
          {categories.map((cat) => (
            <Link key={cat.id} to={cat.to}
              className="group flex flex-col items-center py-8 px-4 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(199,164,138,0.15)',
              }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-125 group-hover:rotate-6"
                style={{ background: 'rgba(232,197,151,0.1)' }}>
                <div className="w-8 h-8" style={{ color: '#e8c597' }}>{cat.icon}</div>
              </div>
              <span className="font-playfair font-medium text-base" style={{ color: '#1a1a2e' }}>{cat.title}</span>
              <div className="mt-3 w-6 h-0.5 rounded-full transition-all duration-500 group-hover:w-10" style={{ background: '#e8c597' }}></div>
            </Link>
          ))}
        </StaggerGrid>
      </section>

      {/* ═══════ WEDDING PLANNER CTA ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <ScrollReveal direction="scale">
          <div className="text-center rounded-3xl py-16 px-8"
            style={{ background: '#ffffff', border: '1px solid rgba(199,164,138,0.15)' }}>
            <h2 className="font-playfair text-3xl md:text-4xl mb-4" style={{ color: '#1a1a2e', fontWeight: 500 }}>
              {t('Sit back and let a professional handle it.')}
            </h2>
            <h3 className="font-playfair text-2xl md:text-3xl mb-8" style={{ color: '#c7a48a', fontWeight: 500 }}>
              {t('Hire a Wedding Planner')}
            </h3>
            <Link to="/search?category=Planning"
              className="relative inline-block px-8 py-3.5 rounded-lg text-white font-semibold overflow-hidden group"
              style={{ background: '#c7a48a' }}>
              <span className="relative z-10">{t('Browse Planners')}</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-20" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <h2 className="font-playfair text-4xl md:text-5xl text-center mb-14"
              style={{ color: '#1a1a2e', fontWeight: 500 }}>
              {t('How It Works')}
            </h2>
          </ScrollReveal>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-10" hoverable={false}>
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-5 transition-transform duration-500 hover:scale-125 inline-block cursor-default">{step.icon}</div>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#c7a48a' }}>{step.num}</div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#1a1a2e' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>{step.desc}</p>
              </div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center rounded-3xl py-16 px-8"
            style={{ background: 'linear-gradient(180deg, #ecc0a4 0%, #d4b8c7 50%, #7e99c4 100%)' }}>
            <h2 className="font-playfair text-3xl md:text-4xl mb-4 text-white" style={{ fontWeight: 500 }}>
              {t('Ready to Plan Your Dream Wedding?')}
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              {t('Join thousands of happy couples who found their perfect vendors.')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/search"
                className="relative px-8 py-3.5 rounded-lg font-semibold overflow-hidden group"
                style={{ background: '#ffffff', color: '#1a1a2e' }}>
                <span className="relative z-10">{t('Start Planning')}</span>
                <div className="absolute inset-0 transition-transform duration-500 translate-y-full group-hover:translate-y-0"
                  style={{ background: 'rgba(199,164,138,0.15)' }}></div>
              </Link>
              <Link to="/vendor/register"
                className="px-8 py-3.5 rounded-lg font-semibold transition-all duration-300 hover:bg-white/30"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
                {t('Join as Vendor')}
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default Home;