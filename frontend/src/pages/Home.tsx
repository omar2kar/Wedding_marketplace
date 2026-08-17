import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from "react-router-dom";
import { CameraIcon, VideoCameraIcon, FlowerIcon, LocationIcon, SparkleIcon, MicrophoneIcon, CakeIcon, ClipboardIcon } from '../components/icons';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext'; 

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const categories = [
  {
    id: 'photography',
    title: t('Photography'),
    icon: <CameraIcon />,
    to: '/search?category=Photography',
  },
  {
    id: 'videography',
    title: t('Videography'),
    icon: <VideoCameraIcon />,
    to: '/search?category=Videography',
  },
  {
    id: 'floristry-decoration',
    title: t('Floristry & Decoration'),
    icon: <FlowerIcon />,
    to: '/search?category=Floristry & Decoration',
  },
  {
    id: 'locations',
    title: t('Locations'),
    icon: <LocationIcon />,
    to: '/search?category=Locations',
  },
  {
    id: 'beauty-styling',
    title: t('Beauty & Styling'),
    icon: <SparkleIcon />,
    to: '/search?category=Beauty & Styling',
  },
  {
    id: 'music-show',
    title: t('Music & Show'),
    icon: <MicrophoneIcon />,
    to: '/search?category=Music & Show',
  },
  {
    id: 'wedding-cakes-sweets',
    title: t('Wedding Cakes & Sweets'),
    icon: <CakeIcon />,
    to: '/search?category=Wedding Cakes & Sweets',
  },
  {
    id: 'wedding-planner',
    title: t('Wedding Planner'),
    icon: <ClipboardIcon />,
    to: '/search?category=Wedding Planner',
  },
  {
    id: 'catering',
    title: t('Catering'),
    icon: <CakeIcon />,
    to: '/search?category=Catering',
  },
  {
    id: 'bridal-fashion',
    title: t('Bridal Fashion'),
    icon: <SparkleIcon />,
    to: '/search?category=Bridal Fashion',
  },
  {
    id: 'wedding-cars-transport',
    title: t('Wedding Cars & Transport'),
    icon: <LocationIcon />,
    to: '/search?category=Wedding Cars & Transport',
  },
  {
    id: 'wedding-rings-jewelry',
    title: t('Wedding Rings & Jewelry'),
    icon: <SparkleIcon />,
    to: '/search?category=Wedding Rings & Jewelry',
  },
];

  const [popularVendors, setPopularVendors] = useState<{id:number; businessName:string; category:string; profileImage:string|null}[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/featured-vendors`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPopularVendors(data);
        } else {
          setPopularVendors([
  {
    id: 0,
    businessName: "Elegant Ballroom",
    category: "Locations",
    profileImage: "/images/images.jpeg"
  },
  {
    id: 0,
    businessName: "Bridal Boutique",
    category: "Bridal Fashion",
    profileImage: "/images/ABB+Cover+3.1.webp"
  },
  {
    id: 0,
    businessName: "Capture the Moment",
    category: "Photography",
    profileImage: "/images/photo-1493863641943-9b68992a8d07.jpeg"
  },
]);
        }
      })
      .catch(() => {
        setPopularVendors([
  {
    id: 0,
    businessName: "Elegant Ballroom",
    category: "Locations",
    profileImage: "/images/images.jpeg"
  },
  {
    id: 0,
    businessName: "Bridal Boutique",
    category: "Bridal Fashion",
    profileImage: "/images/ABB+Cover+3.1.webp"
  },
  {
    id: 0,
    businessName: "Capture the Moment",
    category: "Photography",
    profileImage: "/images/photo-1493863641943-9b68992a8d07.jpeg"
  },
]);
      });
  }, []);

  const steps = [
    { num: '01', title: t('Browse & Discover'), desc: t('Explore hundreds of verified wedding vendors across all categories.'), icon: '🔍' },
    { num: '02', title: t('Compare & Choose'), desc: t('Compare prices, reviews and portfolios. Add favorites to your wishlist.'), icon: '⚖️' },
    { num: '03', title: t('Book & Celebrate'), desc: t('Book directly through the platform and plan your perfect day.'), icon: '🎉' },
  ];

  const getImageUrl = (path: string | null) => {
  if (!path) return "";
  // إذا كان رابطاً كاملاً، أرجعه كما هو
  if (path.startsWith('http')) return path;
  // إذا كان يبدأ بـ /، فهو على الأرجح من مجلد public، لا تضف SERVER_BASE
  if (path.startsWith('/')) return path;
  // إذا كان مساراً نسبياً من الخادم (مثل 'uploads/image.jpg')
  return `${SERVER_BASE}/${path}`;
};

  return (
    <div className="bg-[#f4e9dc] dark:bg-[#090a10] text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300">

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden transition-all duration-500" style={{
        background: isDark
          ? 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f101d 50%, #06070a 100%)'
          : 'linear-gradient(180deg, #ecc0a4 0%, #d4b8c7 35%, #a8b4d4 65%, #7e99c4 100%)',
        minHeight: '90vh', paddingTop: '80px'
      }}>
        <Particles />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ minHeight: 'calc(90vh - 80px)' }}>
          <motion.h1
            variants={heroTitle}
            initial="initial"
            animate="animate"
            className="font-playfair leading-tight max-w-3xl mx-auto text-white font-medium"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 4.8rem)' }}
          >
            {t('heroTitle')}
          </motion.h1>

          <motion.div
            variants={heroCTA}
            initial="initial"
            animate="animate"
            className="mt-10"
          >
            <button onClick={() => navigate('/search')}
              className={`relative px-8 py-3.5 rounded-lg font-semibold text-lg overflow-hidden group transition-all duration-300 ${
                isDark 
                  ? 'text-slate-950 shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.7)]' 
                  : 'text-white shadow-md'
              }`}
              style={{ background: isDark ? 'linear-gradient(to right, #d4af37, #f3e5ab, #c5a059)' : '#c7a48a' }}>
              <span className="relative z-10">{t('findVendors')}</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="absolute bottom-24"
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-white/50 rounded-full" style={{ animation: 'scrollBounce 2s ease-in-out infinite' }}></div>
            </div>
            <style>{`@keyframes scrollBounce { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(8px); opacity: 0.3; } }`}</style>
          </motion.div>
        </div>

        {/* Dynamic Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path d="M0 30C480 60 960 0 1440 30V60H0V30Z" className="fill-[#f4e9dc] dark:fill-[#090a10] transition-colors duration-300" />
          </svg>
        </div>
      </section>

      {/* ═══════ POPULAR VENDORS ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <h2 className="font-playfair text-4xl md:text-5xl text-center mb-14 text-[#1a1a2e] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#d4af37] dark:via-[#f3e5ab] dark:to-[#c5a059] font-medium">
            {t('Popular Vendors')}
          </h2>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-8" speed="slow">
          {popularVendors.map((v, i) => (
            <Link key={v.id || i} to={v.id ? `/vendor/${v.id}` : '/search'} className="group">
              <div className="overflow-hidden rounded-2xl mb-5 relative transition-all duration-300 dark:border dark:border-transparent dark:group-hover:border-[#d4af37]/80 dark:group-hover:shadow-[0_10px_30px_rgba(212,175,55,0.25)]" 
                style={{ aspectRatio: '4/5', background: isDark ? '#121420' : 'linear-gradient(135deg, #f4e9dc, #ecc0a4)' }}>
                {v.profileImage ? ( 
                  <img 
    src={getImageUrl(v.profileImage)}
    alt={v.businessName}
    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-white/60 font-playfair">{v.businessName.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <h3 className="text-xl font-semibold mb-1 transition-colors duration-300 text-[#1a1a2e] dark:text-slate-100 dark:group-hover:text-[#d4af37] group-hover:opacity-70">{v.businessName}</h3>
              <p className="text-sm text-[#c7a48a] dark:text-[#d4af37]/80">{v.category}</p>
            </Link>
          ))}
        </StaggerGrid>
      </section>

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <h2 className="font-playfair text-4xl md:text-5xl text-center mb-14 text-[#1a1a2e] dark:text-slate-100 font-medium">
            {t('What are you looking for?')}
          </h2>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5" hoverable={false}>
          {categories.map((cat) => (
            <Link key={cat.id} to={cat.to}
              /* تمت إضافة relative overflow-hidden هنا فقط لمنع خروج الأشكال خارج الكرت */
              className="group relative overflow-hidden flex flex-col items-center py-8 px-4 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl bg-white dark:bg-[#121420]/80 border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/20 hover:dark:border-[#d4af37] hover:dark:shadow-[0_0_25px_rgba(212,175,55,0.2)]">
              
              {/* ===== أشكال وديكورات الوضع الليلي فقط (لا تظهر في النهار) ===== */}
              <div className="hidden dark:block absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="hidden dark:block absolute -top-12 -right-12 w-28 h-28 rounded-full bg-[#d4af37]/10 blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
              <div className="hidden dark:block absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-[#d4af37]/5 blur-lg pointer-events-none" />
              <div className="hidden dark:block absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />

              {/* تم تغليف المحتوى الأصلي بـ relative z-10 ليبقى فوق الأشكال الديكورية */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-125 group-hover:rotate-6 bg-[rgba(232,197,151,0.1)] dark:bg-[#1f2235]">
                  <div className="w-8 h-8 text-[#e8c597] group-hover:dark:text-[#d4af37] transition-colors">{cat.icon}</div>
                </div>
                <span className="font-playfair font-medium text-base text-[#1a1a2e] dark:text-slate-100 group-hover:dark:text-[#f3e5ab] transition-colors">{cat.title}</span>
                <div className="mt-3 w-6 h-0.5 rounded-full transition-all duration-500 group-hover:w-10 bg-[#e8c597] dark:bg-[#d4af37]"></div>
              </div>
            </Link>
          ))}
        </StaggerGrid>
      </section>

      {/* ═══════ WEDDING PLANNER CTA ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <ScrollReveal direction="scale">
          <div 
            /* تمت إضافة relative overflow-hidden هنا */
            className="relative overflow-hidden text-center rounded-3xl py-16 px-8 bg-white dark:bg-gradient-to-b dark:from-[#131524] dark:to-[#0b0c14] border border-[rgba(199,164,138,0.15)] dark:border-[#d4af37]/30 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            
            {/* ===== أشكال وديكورات الوضع الليلي فقط ===== */}
            <div className="hidden dark:block absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="hidden dark:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#d4af37]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="hidden dark:block absolute -top-20 -left-20 w-60 h-60 border border-[#d4af37]/15 rounded-full pointer-events-none" />
            <div className="hidden dark:block absolute -bottom-20 -right-20 w-80 h-80 border border-[#d4af37]/15 rounded-full pointer-events-none" />
            <div className="hidden dark:block absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent" />

            {/* المحتوى الأصلي الخاص بك محاط بـ relative z-10 */}
            <div className="relative z-10">
              <h2 className="font-playfair text-3xl md:text-4xl mb-4 text-[#1a1a2e] dark:text-slate-100 font-medium">
  {t('Sit back and let a professional handle it.')}
</h2>
<h3 className="font-playfair text-2xl md:text-3xl mb-8 text-[#c7a48a] dark:text-[#d4af37] font-medium">
  {t('Hire a Wedding Planner')}
</h3>
<Link
  to="/search?category=Wedding Planner"
  className={`relative inline-block px-8 py-3.5 rounded-lg font-semibold overflow-hidden group transition-all duration-300 ${
    isDark 
      ? 'text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.7)] hover:scale-105' 
      : 'text-white shadow-md'
  }`}
  style={{
    background: isDark
      ? 'linear-gradient(to right, #d4af37, #f3e5ab, #c5a059)'
      : '#c7a48a'
  }}
>
  <span className="relative z-10">
    {t('Browse Planners')}
  </span>

  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
</Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-20 bg-white dark:bg-[#0c0d14]/80 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <h2 className="font-playfair text-4xl md:text-5xl text-center mb-14 text-[#1a1a2e] dark:text-slate-100 font-medium">
              {t('How It Works')}
            </h2>
          </ScrollReveal>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-10" hoverable={false}>
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-5 transition-transform duration-500 hover:scale-125 inline-block cursor-default">{step.icon}</div>
                <div className="text-xs font-bold uppercase tracking-widest mb-3 text-[#c7a48a] dark:text-[#d4af37]">{step.num}</div>
                <h3 className="text-xl font-semibold mb-3 text-[#1a1a2e] dark:text-slate-100">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{step.desc}</p>
              </div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center rounded-3xl py-16 px-8 shadow-xl"
            style={{
              background: isDark
                ? 'radial-gradient(circle at center, #1e1b4b 0%, #0f101d 60%, #06070a 100%)'
                : 'linear-gradient(180deg, #ecc0a4 0%, #d4b8c7 50%, #7e99c4 100%)'
            }}>
            <h2 className="font-playfair text-3xl md:text-4xl mb-4 text-white font-medium">
              {t('Ready to Plan Your Dream Wedding?')}
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              {t('Join thousands of happy couples who found their perfect vendors.')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/search"
                className={`relative px-8 py-3.5 rounded-lg font-semibold overflow-hidden group transition-all duration-300 ${
                  isDark 
                    ? 'text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.7)]' 
                    : 'bg-white text-[#1a1a2e] shadow-md'
                }`}
                style={isDark ? { background: 'linear-gradient(to right, #d4af37, #f3e5ab, #c5a059)' } : {}}>
                <span className="relative z-10">{t('Start Planning')}</span>
                <div className="absolute inset-0 transition-transform duration-500 translate-y-full group-hover:translate-y-0 bg-gray-100/30 dark:bg-white/20"></div>
              </Link>
              <Link to="/vendor/register"
                className="px-8 py-3.5 rounded-lg font-semibold transition-all duration-300 hover:bg-white/30 text-white border border-white/30 bg-white/20 dark:border-[#d4af37]/50 dark:text-[#f3e5ab] dark:hover:bg-[#d4af37]/20">
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