import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClient } from '../context/ClientContext';
import BookingModal from '../components/booking/BookingModal';

interface ServicePackage {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface VendorService {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  isActive: boolean;
  createdAt: string;
  packages: ServicePackage[];
}

interface VendorReview {
  rating: number;
  comment: string;
  created_at: string;
  client_name: string;
  service_name: string;
}

interface VendorProfileData {
  id: number;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  category: string;
  description: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  serviceCount: number;
  minPrice: number;
  maxPrice: number;
  createdAt: string;
  services: VendorService[];
  reviews: VendorReview[];
}

const VendorProfile: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client } = useClient();
  const [vendor, setVendor] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'about'>('services');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingService, setBookingService] = useState<VendorService | null>(null);
  const [imageError, setImageError] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) fetchVendorProfile();
  }, [id]);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/services/vendor/${id}`);
      const data = await res.json();
      if (res.ok) setVendor(data);
    } catch (err) {
      console.error('Error fetching vendor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (service: VendorService) => {
    setBookingService(service);
    setShowBookingModal(true);
  };

  const getImg = (service: VendorService) => {
    if (service.images?.length > 0) {
      const img = service.images[0];
      if (imageError.has(img)) return null;
      return img.startsWith('http') ? img : `http://localhost:5000${img.startsWith('/') ? '' : '/'}${img}`;
    }
    return null;
  };

  const Stars = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ${i < Math.round(rating) ? 'text-yellow-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#c7a48a' }}></div>
          <p style={{ color: '#1f2640' }} className="text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  /* ── Not Found ── */
  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-10 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(199,164,138,0.15)' }}>
            <svg className="w-8 h-8" style={{ color: '#c7a48a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1f2640' }}>Vendor Not Found</h2>
          <p className="mb-6" style={{ color: '#7e99c4' }}>This vendor profile doesn't exist or has been removed.</p>
          <Link to="/search" className="inline-block text-white font-semibold px-8 py-3 rounded-xl transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
            Browse Vendors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 font-medium transition-colors group" style={{ color: '#7e99c4' }}>
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to results
        </button>

        {/* ════════════════ VENDOR HEADER CARD ════════════════ */}
        <div className="glass rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">

            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
              {vendor.businessName.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-playfair text-3xl font-bold" style={{ color: '#1f2640' }}>
                  {vendor.businessName}
                </h1>
                {vendor.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                )}
              </div>

              <p className="text-lg mb-4" style={{ color: '#7e99c4' }}>
                {vendor.ownerName} &middot; {vendor.category}
              </p>

              {vendor.description && (
                <p className="mb-5 max-w-2xl leading-relaxed" style={{ color: '#4a4a4a' }}>{vendor.description}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-5 mb-6">
                <div className="flex items-center gap-2">
                  <Stars rating={vendor.rating} />
                  <span className="font-bold text-lg" style={{ color: '#1f2640' }}>
                    {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}
                  </span>
                  {vendor.reviewCount > 0 && (
                    <span style={{ color: '#7e99c4' }}>({vendor.reviewCount} reviews)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5" style={{ color: '#7e99c4' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  {vendor.serviceCount} {vendor.serviceCount === 1 ? 'Service' : 'Services'}
                </div>
                {vendor.minPrice > 0 && (
                  <div className="font-semibold" style={{ color: '#c7a48a' }}>
                    {vendor.minPrice === vendor.maxPrice ? `€${vendor.minPrice}` : `€${vendor.minPrice} – €${vendor.maxPrice}`}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="inline-flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-xl transition-all hover:opacity-90 hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Call Now
                  </a>
                )}
                {vendor.email && (
                  <a href={`mailto:${vendor.email}`} className="inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl border-2 transition-all hover:shadow-md" style={{ color: '#7e99c4', borderColor: '#7e99c4' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Send Email
                  </a>
                )}
                <Link to="/chat" className="inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl border-2 transition-all hover:shadow-md" style={{ color: '#c7a48a', borderColor: '#c7a48a' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Message
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════ TABS ════════════════ */}
        <div className="flex gap-2 mb-8">
          {(['services', 'reviews', 'about'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'services' ? `Services (${vendor.services.length})` : tab === 'reviews' ? `Reviews (${vendor.reviews.length})` : 'About';
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={isActive
                  ? { background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)', color: 'white' }
                  : { background: 'rgba(255,255,255,0.4)', color: '#7e99c4', border: '1px solid rgba(126,153,196,0.2)' }
                }>
                {label}
              </button>
            );
          })}
        </div>

        {/* ════════════════ SERVICES TAB ════════════════ */}
        {activeTab === 'services' && (
          <div className="space-y-6 pb-12">
            {vendor.services.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-lg" style={{ color: '#7e99c4' }}>No services available yet.</p>
              </div>
            ) : (
              vendor.services.map(service => (
                <div key={service.id} className="glass rounded-2xl overflow-hidden">
                  <div className="flex flex-col lg:flex-row">

                    {/* Image */}
                    <div className="lg:w-72 h-56 lg:h-auto flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
                      {getImg(service) ? (
                        <img src={getImg(service)!} alt={service.name} className="w-full h-full object-cover"
                          onError={() => setImageError(prev => new Set(prev).add(service.images[0]))} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-14 h-14 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                        {service.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 lg:p-8">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-playfair text-2xl font-bold" style={{ color: '#1f2640' }}>{service.name}</h3>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-2xl font-bold" style={{ color: '#c7a48a' }}>€{service.price}</div>
                          <span className="text-xs" style={{ color: '#7e99c4' }}>starting from</span>
                        </div>
                      </div>

                      {service.description && (
                        <p className="mb-5 leading-relaxed line-clamp-2" style={{ color: '#4a4a4a' }}>{service.description}</p>
                      )}

                      {/* Packages */}
                      {service.packages && service.packages.length > 0 ? (
                        <div className="mb-5">
                          <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#c7a48a' }}>Available Packages</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {service.packages.map((pkg, idx) => (
                              <div key={pkg.id}
                                className="rounded-xl p-5 transition-all hover:shadow-lg"
                                style={{
                                  background: idx === 1 ? 'linear-gradient(135deg, rgba(147,51,234,0.06), rgba(236,72,153,0.06))' : 'rgba(255,255,255,0.5)',
                                  border: idx === 1 ? '2px solid rgba(147,51,234,0.3)' : '1px solid rgba(0,0,0,0.06)'
                                }}>
                                {idx === 1 && (
                                  <span className="inline-block text-xs font-bold uppercase tracking-wider mb-2 px-2 py-0.5 rounded-full" style={{ background: 'rgba(147,51,234,0.1)', color: '#9333ea' }}>
                                    Popular
                                  </span>
                                )}
                                <h5 className="font-semibold text-base mb-1" style={{ color: '#1f2640' }}>{pkg.name}</h5>
                                <div className="text-xl font-bold mb-2" style={{ color: '#c7a48a' }}>€{pkg.price}</div>
                                {pkg.description && <p className="text-sm mb-3" style={{ color: '#7e99c4' }}>{pkg.description}</p>}
                                {pkg.features?.length > 0 && (
                                  <ul className="space-y-1.5 mb-4">
                                    {pkg.features.map((f, fi) => (
                                      <li key={fi} className="flex items-start gap-2 text-sm" style={{ color: '#4a4a4a' }}>
                                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        {f}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                <button onClick={() => handleBookNow(service)}
                                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                                  style={idx === 1
                                    ? { background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)', color: 'white' }
                                    : { background: 'transparent', color: '#9333ea', border: '1.5px solid #9333ea' }
                                  }>
                                  Book This Package
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => handleBookNow(service)}
                          className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-xl transition-all hover:opacity-90 hover:shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Book Now
                        </button>
                      )}

                      {/* Thumbnails */}
                      {service.images?.length > 1 && (
                        <div className="flex gap-2 mt-4">
                          {service.images.slice(0, 4).map((img, idx) => {
                            const src = img.startsWith('http') ? img : `http://localhost:5000${img.startsWith('/') ? '' : '/'}${img}`;
                            return <div key={idx} className="w-14 h-14 rounded-lg overflow-hidden opacity-70 hover:opacity-100 transition-opacity cursor-pointer border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}><img src={src} alt="" className="w-full h-full object-cover" /></div>;
                          })}
                          {service.images.length > 4 && (
                            <div className="w-14 h-14 rounded-lg flex items-center justify-center text-sm font-semibold" style={{ background: 'rgba(126,153,196,0.1)', color: '#7e99c4' }}>+{service.images.length - 4}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ════════════════ REVIEWS TAB ════════════════ */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 pb-12">
            {vendor.reviews.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-lg" style={{ color: '#7e99c4' }}>No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <>
                {/* Rating Summary */}
                <div className="glass rounded-2xl p-8 mb-2">
                  <div className="flex items-center gap-5">
                    <div className="text-5xl font-bold" style={{ color: '#1f2640' }}>
                      {vendor.rating > 0 ? vendor.rating.toFixed(1) : '—'}
                    </div>
                    <div>
                      <Stars rating={vendor.rating} size="lg" />
                      <p className="mt-1" style={{ color: '#7e99c4' }}>{vendor.reviewCount} reviews</p>
                    </div>
                  </div>
                </div>

                {/* Review List */}
                {vendor.reviews.map((review, index) => (
                  <div key={index} className="glass rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                          {(review.client_name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#1f2640' }}>{review.client_name || 'Guest'}</p>
                          <Stars rating={review.rating} />
                        </div>
                      </div>
                      <span className="text-sm" style={{ color: '#7e99c4' }}>
                        {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="leading-relaxed" style={{ color: '#4a4a4a' }}>{review.comment}</p>
                    {review.service_name && <p className="text-sm mt-2" style={{ color: '#7e99c4' }}>Service: {review.service_name}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ════════════════ ABOUT TAB ════════════════ */}
        {activeTab === 'about' && (
          <div className="pb-12">
            <div className="glass rounded-2xl p-8">
              <h3 className="font-playfair text-2xl font-bold mb-8" style={{ color: '#1f2640' }}>About {vendor.businessName}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left column */}
                <div className="space-y-5">
                  {[
                    { label: 'Owner', value: vendor.ownerName, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                    { label: 'Category', value: vendor.category, icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
                    ...(vendor.city ? [{ label: 'Location', value: vendor.city, icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' }] : []),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.08), rgba(236,72,153,0.08))' }}>
                        <svg className="w-5 h-5" style={{ color: '#9333ea' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7e99c4' }}>{item.label}</p>
                        <p className="font-medium text-base" style={{ color: '#1f2640' }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right column */}
                <div className="space-y-5">
                  {[
                    ...(vendor.phone ? [{ label: 'Phone', value: vendor.phone, icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' }] : []),
                    ...(vendor.email ? [{ label: 'Email', value: vendor.email, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }] : []),
                    { label: 'Member Since', value: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.08), rgba(236,72,153,0.08))' }}>
                        <svg className="w-5 h-5" style={{ color: '#9333ea' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7e99c4' }}>{item.label}</p>
                        <p className="font-medium text-base" style={{ color: '#1f2640' }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {vendor.description && (
                <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7e99c4' }}>Description</p>
                  <p className="leading-relaxed" style={{ color: '#4a4a4a' }}>{vendor.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingService && vendor && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => { setShowBookingModal(false); setBookingService(null); }}
          service={{ id: bookingService.id, name: bookingService.name, price: bookingService.price, category: bookingService.category, vendor_id: vendor.id, business_name: vendor.businessName }}
          clientId={client?.id || null}
        />
      )}
    </div>
  );
};

export default VendorProfile;