import React, { useEffect, useState } from 'react';
import { getBookings, patchBooking, deleteBooking } from '../../api/bookingsApi';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface BookingItem {
  id: number;
  serviceName: string;
  providerName: string;
  date: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rejected';
  price: string;
  bookingNumber?: string;
}

const Booking: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // الحصول على clientId من localStorage
        const userStr = localStorage.getItem('user');
        const clientId = userStr ? JSON.parse(userStr).id : null;
        
        if (!clientId) {
          setError(t('pleaseLoginToViewBookings') || 'يرجى تسجيل الدخول لعرض الحجوزات');
          setLoading(false);
          return;
        }
        
        const data = await getBookings(clientId);
        setBookings(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [t]);

  const formatDate = (dateStr: string) => new Intl.DateTimeFormat(i18n.language || undefined, { dateStyle: 'medium' }).format(new Date(dateStr));
  const formatPrice = (price: string) => {
    const num = Number(price.replace(/[^0-9.-]+/g, ''));
    return new Intl.NumberFormat(i18n.language || undefined, {
      style: 'currency',
      currency: 'EUR',
    }).format(num);
  };

  const handleEdit = async (booking: BookingItem) => {
    const newDate = prompt(t('enterNewDate'), booking.date);
    if (!newDate || newDate === booking.date) return;
    try {
      await patchBooking(booking.id, { date: newDate });
      setBookings(prev => prev.map(b => (b.id === booking.id ? { ...b, date: newDate } : b)));
    } catch (err) {
      alert(t('actionFailed'));
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm(t('areYouSureCancel'))) return;
    try {
      await deleteBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert(t('actionFailed'));
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return t('confirmed') || 'مؤكد';
      case 'pending': return t('pending') || 'قيد الانتظار';
      case 'completed': return t('completed') || 'مكتمل';
      case 'cancelled': return t('cancelled') || 'ملغي';
      case 'rejected': return t('rejected') || 'مرفوض';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('myBookings')}</h1>
        <p className="text-gray-600">{t('manageYourWeddingServiceBookings')}</p>
      </div>

      {loading ? (
        <p>{t('loading')}...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : bookings.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('service')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('provider')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('price')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking: BookingItem) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.serviceName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.providerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(booking.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(booking.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/booking/${booking.id}`} className="text-primary-600 hover:text-primary-900 mr-3">
                      {t('view')}
                    </Link>
                    {booking.status === 'pending' && (
                      <button onClick={() => handleEdit(booking)} className="text-yellow-600 hover:text-yellow-900 mr-3">
                        {t('edit')}
                      </button>
                    )}
                    {booking.status === 'pending' && (
                      <button onClick={() => handleCancel(booking.id)} className="text-red-600 hover:text-red-900">
                        {t('cancel')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noBookings')}</h3>
          <p className="mt-1 text-gray-500">{t('youHaventMadeAnyBookingsYet')}</p>
          <Link 
            to="/" 
            className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
          >
            {t('browseServices')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default Booking;
