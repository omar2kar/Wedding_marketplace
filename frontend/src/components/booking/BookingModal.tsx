import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: number;
    name: string;
    price: number;
    category: string;
    vendor_id: number;  
    business_name?: string;
  };
  clientId: number | null;
}

interface UnavailableDate {
  date: string;
  status: 'blocked' | 'booked';
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, service, clientId }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    eventDate: '',
    eventTime: '10:00',
    eventLocation: '',
    guestCount: '',
    clientNotes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Availability
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [dateError, setDateError] = useState('');

  // Fetch unavailable dates when modal opens
  useEffect(() => {
    if (isOpen && service.id) {
      fetchUnavailableDates();
    }
  }, [isOpen, service.id]);

  const fetchUnavailableDates = async () => {
    try {
      const res = await fetch(`${API_BASE}/availability/service/${service.id}`);
      if (res.ok) {
        const data = await res.json();
        const blocked = (Array.isArray(data) ? data : [])
          .filter((d: any) => d.status === 'blocked' || d.status === 'booked')
          .map((d: any) => ({
            date: new Date(d.date).toISOString().split('T')[0],
            status: d.status as 'blocked' | 'booked'
          }));
        setUnavailableDates(blocked);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  };

  const isDateUnavailable = (dateStr: string) => {
    return unavailableDates.find(d => d.date === dateStr);
  };

  const handleDateChange = (dateStr: string) => {
    setDateError('');
    const unavailable = isDateUnavailable(dateStr);
    if (unavailable) {
      if (unavailable.status === 'booked') {
        setDateError('This date is already booked by another client.');
      } else {
        setDateError('This date is not available. The vendor has blocked it.');
      }
      setFormData({ ...formData, eventDate: '' });
      return;
    }
    setFormData({ ...formData, eventDate: dateStr });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      setError('You must be logged in to book');
      return;
    }

    if (!formData.eventDate || !formData.eventLocation) {
      setError('Please fill all required fields');
      return;
    }

    // Double-check availability
    const unavailable = isDateUnavailable(formData.eventDate);
    if (unavailable) {
      setError('Selected date is not available. Please choose another date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          serviceId: service.id,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          eventLocation: formData.eventLocation,
          guestCount: parseInt(formData.guestCount) || null,
          clientNotes: formData.clientNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError('This date is no longer available. Please choose another date.');
          fetchUnavailableDates(); // Refresh
          return;
        }
        setError(data.error || data.message || 'Booking failed');
        return;
      }

      if (data.success) {
        setSuccess(true);
        setBookingDetails(data.booking);

        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({ eventDate: '', eventTime: '10:00', eventLocation: '', guestCount: '', clientNotes: '' });
          window.location.reload();
        }, 3000);
      } else {
        setError(data.message || data.error || 'Booking failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Not logged in UI
  if (!clientId) {
    return (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#121420] border border-transparent dark:border-[#d4af37]/20 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center transition-colors">
          <div className="mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner"
              style={{ background: isDark ? 'linear-gradient(135deg, #2a2416, #d4af37)' : 'linear-gradient(135deg, #c7a48a, #e8c597)' }}
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#1a1a2e] dark:text-slate-100 mb-3">Login Required</h3>
          <p className="text-[#6b5e53] dark:text-slate-400 mb-6">You must be logged in to book a service.</p>
          <div className="space-y-3">
            <a 
              href="/client/login" 
              className={`block w-full px-6 py-3 font-semibold rounded-xl transition-all ${
                isDark 
                  ? 'text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                  : 'bg-[#c7a48a] text-white hover:bg-[#b59278]'
              }`}
              style={isDark ? { background: 'linear-gradient(to right, #d4af37, #f3e5ab, #c5a059)' } : {}}
            >
              Login
            </a>
            <a 
              href="/client/register" 
              className="block w-full px-6 py-3 border border-[rgba(199,164,138,0.4)] dark:border-[#d4af37]/30 text-[#6b5e53] dark:text-slate-300 font-semibold rounded-xl hover:bg-[#faf7f4] dark:hover:bg-white/5 transition-all"
            >
              Create Account
            </a>
            <button 
              onClick={onClose} 
              className="block w-full px-6 py-3 text-gray-400 hover:text-[#1a1a2e] dark:hover:text-slate-200 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success UI
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#121420] border border-transparent dark:border-[#d4af37]/20 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center transition-colors">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#10b981] to-[#059669] dark:from-[#34d399] dark:to-[#10b981] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-10 h-10 text-white dark:text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#1a1a2e] dark:text-slate-100 mb-2">Booking Successful!</h3>
          <p className="text-[#6b5e53] dark:text-slate-400 mb-4">Thank you for your booking.</p>
          {bookingDetails && (
            <div className="bg-[#faf7f4] dark:bg-[#0b0c14] border border-[#c7a48a]/20 dark:border-[#d4af37]/30 rounded-2xl p-4 mb-4">
              <p className="text-sm text-[#6b5e53] dark:text-slate-400 mb-1">Booking Number</p>
              <p className="text-xl font-bold text-[#c7a48a] dark:text-[#d4af37]">{bookingDetails.bookingNumber}</p>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">The vendor will review your request.</p>
        </div>
      </div>
    );
  }

  // Get today as local string
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const blockedCount = unavailableDates.filter(d => d.status === 'blocked').length;
  const bookedCount = unavailableDates.filter(d => d.status === 'booked').length;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#121420] border border-transparent dark:border-[#d4af37]/20 rounded-3xl shadow-2xl max-w-2xl w-full my-8 transition-colors">
        
        {/* Header */}
        <div 
          className={`rounded-t-3xl p-6 ${
            isDark 
              ? 'bg-[#131524] border-b border-[#d4af37]/20' 
              : 'bg-[#c7a48a] text-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-[#d4af37]' : 'text-white'}`}>Book Service</h2>
              <p className={isDark ? 'text-slate-300' : 'text-white/90'}>{service.name}</p>
            </div>
            <button 
              onClick={onClose} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className={`flex items-center gap-4 mt-4 pt-4 border-t ${isDark ? 'border-[#d4af37]/20 text-slate-300' : 'border-white/20 text-white/90'}`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm">{service.category}</span>
            </div>
            <div className={`flex items-center gap-2 ${isDark ? 'text-[#d4af37]' : 'text-white'}`}>
              <span className="text-lg font-bold">€{service.price}</span>
            </div>
            {service.business_name && (
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-80">{service.business_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Date */}
            <div>
              <label className="block text-sm font-semibold text-[#6b5e53] dark:text-slate-400 mb-2">Event Date *</label>
              <input 
                type="date" 
                required 
                min={todayStr}
                value={formData.eventDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] text-[#1a1a2e] dark:text-slate-100 ${
                  dateError 
                    ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20' 
                    : 'border-[rgba(199,164,138,0.3)] dark:border-[#d4af37]/30 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-2 focus:ring-[rgba(199,164,138,0.2)] dark:focus:ring-[#d4af37]/20'
                }`}
              />
              {dateError && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1.5 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {dateError}
                </p>
              )}
              {/* Availability hint */}
              {(blockedCount > 0 || bookedCount > 0) && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  {blockedCount > 0 && <span className="text-red-400 dark:text-red-500/80">{blockedCount} blocked</span>}
                  {blockedCount > 0 && bookedCount > 0 && ' · '}
                  {bookedCount > 0 && <span className="text-blue-400 dark:text-blue-500/80">{bookedCount} booked</span>}
                  {' dates for this service'}
                </p>
              )}
            </div>

            {/* Event Time */}
            <div>
              <label className="block text-sm font-semibold text-[#6b5e53] dark:text-slate-400 mb-2">Event Time</label>
              <input 
                type="time" 
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                className="w-full px-4 py-3 border border-[rgba(199,164,138,0.3)] dark:border-[#d4af37]/30 rounded-xl outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-2 focus:ring-[rgba(199,164,138,0.2)] dark:focus:ring-[#d4af37]/20"
              />
            </div>
          </div>

          {/* Event Location */}
          <div>
            <label className="block text-sm font-semibold text-[#6b5e53] dark:text-slate-400 mb-2">Event Location *</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Grand Hotel, Berlin"
              value={formData.eventLocation}
              onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
              className="w-full px-4 py-3 border border-[rgba(199,164,138,0.3)] dark:border-[#d4af37]/30 rounded-xl outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-2 focus:ring-[rgba(199,164,138,0.2)] dark:focus:ring-[#d4af37]/20"
            />
          </div>

          {/* Guest Count */}
          <div>
            <label className="block text-sm font-semibold text-[#6b5e53] dark:text-slate-400 mb-2">Number of Guests (optional)</label>
            <input 
              type="number" 
              min="1" 
              placeholder="100"
              value={formData.guestCount}
              onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
              className="w-full px-4 py-3 border border-[rgba(199,164,138,0.3)] dark:border-[#d4af37]/30 rounded-xl outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-2 focus:ring-[rgba(199,164,138,0.2)] dark:focus:ring-[#d4af37]/20"
            />
          </div>

          {/* Client Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#6b5e53] dark:text-slate-400 mb-2">Special Requests (optional)</label>
            <textarea 
              rows={3} 
              placeholder="Share your special requests with the vendor"
              value={formData.clientNotes}
              onChange={(e) => setFormData({ ...formData, clientNotes: e.target.value })}
              className="w-full px-4 py-3 border border-[rgba(199,164,138,0.3)] dark:border-[#d4af37]/30 rounded-xl outline-none transition-all bg-[#faf7f4] dark:bg-[#0b0c14] text-[#1a1a2e] dark:text-slate-100 focus:border-[#c7a48a] dark:focus:border-[#d4af37] focus:ring-2 focus:ring-[rgba(199,164,138,0.2)] dark:focus:ring-[#d4af37]/20 resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-[#faf7f4] dark:bg-[#131524] border border-[rgba(199,164,138,0.3)] dark:border-[#d4af37]/30 rounded-2xl p-4 transition-colors">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#c7a48a] dark:text-[#d4af37] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-semibold mb-1 text-[#1a1a2e] dark:text-slate-100">Important:</p>
                <p className="text-[#6b5e53] dark:text-slate-400">This is a non-binding request. No payment required now. The vendor will review and confirm your booking.</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-[rgba(199,164,138,0.4)] dark:border-[#d4af37]/30 text-[#6b5e53] dark:text-slate-300 font-semibold rounded-xl hover:bg-[#faf7f4] dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !formData.eventDate || !formData.eventLocation}
              className={`flex-1 px-6 py-3 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                isDark 
                  ? 'text-slate-950 shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                  : 'bg-[#c7a48a] text-white hover:bg-[#b59278]'
              }`}
              style={isDark && !(loading || !formData.eventDate || !formData.eventLocation) ? { background: 'linear-gradient(to right, #d4af37, #f3e5ab, #c5a059)' } : (isDark ? { background: '#d4af37' } : {})}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : 'Book Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;