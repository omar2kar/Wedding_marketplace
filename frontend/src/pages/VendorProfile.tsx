import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClient } from '../context/ClientContext';
import BookingModal from '../components/booking/BookingModal';

interface ServicePackage { id: number; name: string; description: string; price: number; features: string[]; }
interface VendorService { id: number; name: string; description: string; category: string; price: number; images: string[]; isActive: boolean; packages: ServicePackage[]; }
interface VendorReview { rating: number; comment: string; created_at: string; client_name: string; service_name: string; }
interface VendorProfileData {
  id: number; businessName: string; ownerName: string; email: string; phone: string; city: string;
  category: string; description: string; isVerified: boolean; rating: number; reviewCount: number;
  serviceCount: number; minPrice: number; maxPrice: number; createdAt: string;
  services: VendorService[]; reviews: VendorReview[];
}

const Stars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i < Math.round(rating) ? '#f59e0b' : '#e5e7eb'}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const VendorProfile: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client } = useClient();
  const [vendor, setVendor] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'about'>('services');
  const [showBooking, setShowBooking] = useState(false);
  const [bookingService, setBookingService] = useState<VendorService | null>(null);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  useEffect(() => { if (id) fetchVendor(); }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/services/vendor/${id}`);
      const data = await res.json();
      if (res.ok) setVendor(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getImg = (path: string) => {
    if (imgErrors.has(path)) return null;
    return path.startsWith('http') ? path : `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleBook = (service: VendorService) => { setBookingService(service); setShowBooking(true); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4e9dc', paddingTop: '80px' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#c7a48a' }}></div>
    </div>
  );

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4e9dc', paddingTop: '80px' }}>
      <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid rgba(199,164,138,0.15)' }}>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1a1a2e' }}>Vendor Not Found</h2>
        <p className="mb-6" style={{ color: '#b9a18e' }}>This profile doesn't exist or has been removed.</p>
        <Link to="/search" className="px-6 py-2.5 rounded-xl text-white font-medium" style={{ background: '#c7a48a' }}>Browse Vendors</Link>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f4e9dc', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition-all hover:opacity-70 group"
          style={{ color: '#c7a48a' }}>
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to results
        </button>

        {/* ── VENDOR HEADER ── */}
        <div className="bg-white rounded-2xl p-8 mb-6" style={{ border: '1px solid rgba(199,164,138,0.12)' }}>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #c7a48a, #e8c597)' }}>
              {vendor.businessName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="font-playfair text-3xl font-semibold" style={{ color: '#1a1a2e' }}>{vendor.businessName}</h1>
                {vendor.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm mb-3" style={{ color: '#b9a18e' }}>{vendor.ownerName} · {vendor.category}</p>
              {vendor.description && <p className="mb-4 leading-relaxed max-w-2xl" style={{ color: '#6b5e53' }}>{vendor.description}</p>}

              {/* Stats */}
              <div className="flex flex-wrap gap-5 mb-5">
                <div className="flex items-center gap-2">
                  <Stars rating={vendor.rating} />
                  <span className="font-bold" style={{ color: '#1a1a2e' }}>{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                  {vendor.reviewCount > 0 && <span className="text-xs" style={{ color: '#b9a18e' }}>({vendor.reviewCount})</span>}
                </div>
                <span className="text-sm" style={{ color: '#b9a18e' }}>{vendor.serviceCount} services</span>
                {vendor.minPrice > 0 && <span className="font-semibold" style={{ color: '#c7a48a' }}>€{vendor.minPrice} – €{vendor.maxPrice}</span>}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 hover:shadow-md"
                    style={{ background: '#c7a48a' }}>
                    Call Now
                  </a>
                )}
                {vendor.email && (
                  <a href={`mailto:${vendor.email}`} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{ color: '#7e99c4', border: '1.5px solid #7e99c4' }}>
                    Send Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-2 mb-6">
          {(['services', 'reviews', 'about'] as const).map(tab => {
            const active = activeTab === tab;
            const label = tab === 'services' ? `Services (${vendor.services.length})` : tab === 'reviews' ? `Reviews (${vendor.reviews.length})` : 'About';
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
                style={{
                  background: active ? '#c7a48a' : '#ffffff',
                  color: active ? '#ffffff' : '#6b5e53',
                  border: active ? 'none' : '1px solid rgba(199,164,138,0.15)'
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── SERVICES ── */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {vendor.services.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid rgba(199,164,138,0.12)' }}>
                <p style={{ color: '#b9a18e' }}>No services available yet.</p>
              </div>
            ) : vendor.services.map(service => (
              <div key={service.id} className="bg-white rounded-2xl overflow-hidden transition-all hover:shadow-md"
                style={{ border: '1px solid rgba(199,164,138,0.12)' }}>
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="lg:w-64 h-48 lg:h-auto flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #f4e9dc, #ecc0a4)' }}>
                    {service.images?.length > 0 && getImg(service.images[0]) ? (
                      <img src={getImg(service.images[0])!} alt={service.name} className="w-full h-full object-cover"
                        onError={() => setImgErrors(prev => new Set(prev).add(service.images[0]))} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">📷</span></div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: 'rgba(199,164,138,0.1)', color: '#c7a48a' }}>{service.category}</span>
                        <h3 className="font-playfair text-xl font-semibold" style={{ color: '#1a1a2e' }}>{service.name}</h3>
                      </div>
                      <span className="text-xl font-bold flex-shrink-0 ml-4" style={{ color: '#c7a48a' }}>€{service.price}</span>
                    </div>
                    {service.description && <p className="text-sm mb-4 line-clamp-2 leading-relaxed" style={{ color: '#6b5e53' }}>{service.description}</p>}
                    <button onClick={() => handleBook(service)}
                      className="px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 hover:shadow-md"
                      style={{ background: '#c7a48a' }}>
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {vendor.reviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid rgba(199,164,138,0.12)' }}>
                <p style={{ color: '#b9a18e' }}>No reviews yet.</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="bg-white rounded-2xl p-6 flex items-center gap-5" style={{ border: '1px solid rgba(199,164,138,0.12)' }}>
                  <span className="text-4xl font-bold" style={{ color: '#1a1a2e' }}>{vendor.rating > 0 ? vendor.rating.toFixed(1) : '—'}</span>
                  <div>
                    <Stars rating={vendor.rating} size={18} />
                    <p className="text-sm mt-1" style={{ color: '#b9a18e' }}>{vendor.reviewCount} reviews</p>
                  </div>
                </div>
                {vendor.reviews.map((review, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(199,164,138,0.12)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #c7a48a, #e8c597)' }}>
                          {(review.client_name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: '#1a1a2e' }}>{review.client_name || 'Guest'}</p>
                          <Stars rating={review.rating} size={12} />
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: '#b9a18e' }}>
                        {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#6b5e53' }}>{review.comment}</p>
                    {review.service_name && <p className="text-xs mt-2" style={{ color: '#b9a18e' }}>Service: {review.service_name}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── ABOUT ── */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(199,164,138,0.12)' }}>
            <h3 className="font-playfair text-xl font-semibold mb-6" style={{ color: '#1a1a2e' }}>About {vendor.businessName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Owner', value: vendor.ownerName },
                { label: 'Category', value: vendor.category },
                ...(vendor.city ? [{ label: 'Location', value: vendor.city }] : []),
                ...(vendor.phone ? [{ label: 'Phone', value: vendor.phone }] : []),
                ...(vendor.email ? [{ label: 'Email', value: vendor.email }] : []),
                { label: 'Member Since', value: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A' },
              ].map((item, i) => (
                <div key={i}>
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#b9a18e' }}>{item.label}</p>
                  <p className="font-medium" style={{ color: '#1a1a2e' }}>{item.value}</p>
                </div>
              ))}
            </div>
            {vendor.description && (
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(199,164,138,0.1)' }}>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#b9a18e' }}>Description</p>
                <p className="leading-relaxed" style={{ color: '#6b5e53' }}>{vendor.description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingService && vendor && (
        <BookingModal isOpen={showBooking}
          onClose={() => { setShowBooking(false); setBookingService(null); }}
          service={{ id: bookingService.id, name: bookingService.name, price: bookingService.price, category: bookingService.category, vendor_id: vendor.id, business_name: vendor.businessName }}
          clientId={client?.id || null} />
      )}
    </div>
  );
};

export default VendorProfile;