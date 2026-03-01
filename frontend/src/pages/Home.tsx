// src/pages/Home.tsx
import React from "react";
import { useTranslation } from 'react-i18next';
import CategoryCard from "../components/CategoryCard"; // Adjust path if needed
import { Link } from "react-router-dom";
import { CameraIcon, VideoCameraIcon, FlowerIcon, LocationIcon, SparkleIcon, MicrophoneIcon, CakeIcon, ClipboardIcon } from '../components/icons';


/* Simple icons that use currentColor */
const VenueIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M3 10l9-6 9 6" />
    <path d="M5 10v7a1 1 0 0 0 1 1h3V11H5z" />
    <path d="M14 18h3a1 1 0 0 0 1-1v-7h-4v8z" />
    <path d="M8 14v4" />
    <path d="M16 14v4" />
  </svg>
);

const PhotographerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="3" y="7" width="18" height="14" rx="2" />
    <circle cx="12" cy="13" r="3.5" />
    <path d="M7 7L9 5h6l2 2" />
  </svg>
);

const CateringIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M3 21h18" />
    <path d="M6 21V11a6 6 0 0112 0v10" />
    <path d="M8 7h8" />
    <path d="M10 3h4" />
  </svg>
);

const DressIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M6 3l3 5-1 13h8l-1-13 3-5" />
    <path d="M9 8h6" />
  </svg>
);

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M9 19V6l10-2v13" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="15" r="2" />
  </svg>
);

const FloristIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M12 3v6" />
    <circle cx="12" cy="11" r="4" />
    <path d="M3 21s3-7 9-7 9 7 9 7" />
  </svg>
);


const Home: React.FC = () => {
  const { t } = useTranslation();

  /* Popular vendors data */
  const popularVendors = [
    {
      id: 1,
      name: t("Elegant Ballroom"),
      category: t("Venue"),
      image: "/images/images.jpeg",
    },
    {
      id: 2,
      name: t("Capture the Moment"),
      category: t("Photographer"),
      image: "/images/photo-1493863641943-9b68992a8d07.jpeg",
    },
    {
      id: 3,
      name: t("Bridal Boutique"),
      category: t("Dress"),
      image: "/images/ABB+Cover+3.1.webp",
    },
    {
      id: 4,
      name: t("Luxury Florals"),
      category: t("Florist"),
      image: "/images/034-harrods-spring-boutique-varna-studios-_Z813322-(1).webp",
    },
  ];

  /* Categories array - same as Categories page */
  const categories = [
    { id: 'photography', title: t('Photography'), subtitle: t('Capture the Moment'), icon: <CameraIcon />, to: '/search?category=Photography' },
    { id: 'videography', title: t('Videography'), subtitle: t('Video Coverage'), icon: <VideoCameraIcon />, to: '/search?category=Videography' },
    { id: 'floristry', title: t('Floristry'), subtitle: t('Bouquets & Decor'), icon: <FlowerIcon />, to: '/search?category=Floristry' },
    { id: 'venues', title: t('Venues'), subtitle: t('Halls & Gardens'), icon: <LocationIcon />, to: '/search?category=Venues' },
    { id: 'beauty', title: t('Beauty'), subtitle: t('Makeup & Hair'), icon: <SparkleIcon />, to: '/search?category=Beauty' },
    { id: 'entertainment', title: t('Entertainment'), subtitle: t('Music & Shows'), icon: <MicrophoneIcon />, to: '/search?category=Entertainment' },
    { id: 'cake', title: t('Cake & Sweets'), subtitle: t('Desserts & Treats'), icon: <CakeIcon />, to: '/search?category=Cake & Sweets' },
    { id: 'planning', title: t('Planning'), subtitle: t('Event Coordination'), icon: <ClipboardIcon />, to: '/search?category=Planning' },
  ];

  return (
    <div className="bg-white">
      {/* Popular Vendors */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="font-playfair text-3xl md:text-4xl text-center mb-8" style={{ color: "#1f2640" }}>
          {t('Popular Vendors')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {popularVendors.map((v) => (
            <div key={v.id} className="flex flex-col items-center">
              <div
                className="w-full h-64 transition-transform duration-300 ease-out"
                style={{ perspective: "800px" }}
              >
                <img
                  src={v.image}
                  alt={v.name}
                  className="w-full h-full object-cover rounded-2xl transition-all duration-300 ease-out shadow-sm hover:shadow-2xl hover:-translate-y-3 hover:scale-105"
                  style={{ borderRadius: "1rem" }}
                />
              </div>
              <div className="text-center mt-6">
                <h3 className="text-2xl font-semibold mb-2" style={{ color: "#7e99c4" }}>{v.name}</h3>
                <p className="text-lg" style={{ color: "#c7a48a" }}>{v.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-playfair text-3xl md:text-4xl text-center mb-10" style={{ color: "#1f2640" }}>
            {t('What are you looking for?')}
          </h2>

          <div className="flex flex-wrap justify-center gap-6">
            {categories.map((cat) => (
              <Link key={cat.id} to={cat.to} className="block">
                <CategoryCard
                  title={cat.title}
                  subtitle={cat.subtitle}
                  icon={cat.icon}
                  to={cat.to}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
