import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, service, clientId }) => {
  const { t } = useTranslation();
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

  // ملاحظة: نظام الإتاحة معطل مؤقتاً - جميع التواريخ متاحة
  // سيتم إعادة تفعيله لاحقاً

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من تسجيل الدخول أولاً
    if (!clientId) {
      setError(t('You must be logged in to book') || 'يجب تسجيل الدخول للحجز');
      return;
    }
    
    if (!formData.eventDate || !formData.eventLocation) {
      setError(t('Please fill all required fields') || 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // ملاحظة: تم إلغاء التحقق من الإتاحة مؤقتاً
    // جميع التواريخ متاحة والبائع سيوافق أو يرفض الحجز
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
        // خطأ في الاستجابة
        if (response.status === 401) {
          setError(t('Session expired. Please login again') || 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
          setTimeout(() => {
            window.location.href = '/client/login';
          }, 2000);
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || errorData.error || t('Booking failed') || 'فشل الحجز');
        return;
      }
      
      if (data.success) {
        setSuccess(true);
        setBookingDetails(data.booking);
        
        // إعادة تحميل الصفحة بعد 3 ثواني
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            eventDate: '',
            eventTime: '10:00',
            eventLocation: '',
            guestCount: '',
            clientNotes: ''
          });
          // إعادة تحميل الصفحة لعرض الحجز الجديد
          window.location.reload();
        }, 3000);
      } else {
        setError(data.message || data.error || t('Booking failed') || 'فشل الحجز');
      }
    } catch (err: any) {
      setError(err.message || t('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // إذا لم يكن المستخدم مسجل دخول - عرض رسالة خاصة
  if (!clientId) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('Login Required')}</h3>
          <p className="text-gray-600 mb-6">
            {t('You must be logged in to book')}
          </p>
          
          <div className="space-y-3">
            <a
              href="/client/login"
              className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              {t('login')}
            </a>
            <a
              href="/client/register"
              className="block w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              {t('createAccount')}
            </a>
            <button
              onClick={onClose}
              className="block w-full px-6 py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('Booking successful')}!</h3>
          <p className="text-gray-600 mb-4">{t('Thank you for your booking')}</p>
          
          {bookingDetails && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">{t('Booking Number')}</p>
              <p className="text-xl font-bold text-purple-700">{bookingDetails.booking_number}</p>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            {t('The vendor will review your request')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-t-3xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{t('Book Service')}</h2>
              <p className="text-purple-100">{service.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm">{service.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-bold">€{service.price}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('Event Date')} *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Event Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('Event Time')}
              </label>
              <input
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>
          </div>

          {/* Event Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Event Location')} *
            </label>
            <input
              type="text"
              required
              placeholder={t('e.g. Grand Hotel, Berlin')}
              value={formData.eventLocation}
              onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>

          {/* Guest Count */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Number of Guests')} ({t('optional')})
            </label>
            <input
              type="number"
              min="1"
              placeholder="100"
              value={formData.guestCount}
              onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>

          {/* Client Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Special Requests')} ({t('optional')})
            </label>
            <textarea
              rows={4}
              placeholder={t('Share your special requests with the vendor')}
              value={formData.clientNotes}
              onChange={(e) => setFormData({ ...formData, clientNotes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">{t('Important Information')}:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• {t('This is a non-binding request')}</li>
                  <li>• {t('No payment required')}</li>
                  <li>• {t('The vendor will review your request')}</li>
                  <li>• {t('You will receive email confirmation')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.eventDate || !formData.eventLocation}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('Sending')}...
                </span>
              ) : (
                t('Book Service')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
