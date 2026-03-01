import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Booking {
  id: number;
  booking_number: string;
  client_id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_name: string;
  event_date: string;
  event_time: string;
  event_location: string;
  guest_count: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  client_notes: string;
  vendor_notes: string;
  created_at: string;
}

interface ClientWeddingData {
  client: { id: number; name: string; email: string; phone: string } | null;
  weddingProfile: {
    weddingDate: string;
    venueLocation: string;
    guestCount: number;
    budgetMin: number;
    budgetMax: number;
    preferredStyle: string;
    colorTheme: string;
    specialRequirements: string;
    servicesNeeded: string[];
  } | null;
  taskProgress: { total: number; completed: number };
  bookedVendors: { businessName: string; category: string; status: string; amount: number }[];
}

interface BookingsManagementProps {
  vendorId: number;
}

const BookingsManagement: React.FC<BookingsManagementProps> = ({ vendorId }) => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWeddingModal, setShowWeddingModal] = useState(false);
  const [weddingData, setWeddingData] = useState<ClientWeddingData | null>(null);
  const [weddingLoading, setWeddingLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [vendorId, filter]);

  const fetchBookings = async () => {
    try {
      const url = filter === 'all' 
        ? `http://localhost:5000/api/bookings/vendor/${vendorId}`
        : `http://localhost:5000/api/bookings/vendor/${vendorId}?status=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setBookings(Array.isArray(data) ? data : (data.bookings || []));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, vendorNotes: notes })
      });

      if (response.ok) {
        fetchBookings();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const fetchWeddingProfile = async (clientId: number) => {
    setWeddingLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/wedding-profile/vendor-view/${vendorId}/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setWeddingData(data);
        setShowWeddingModal(true);
      } else {
        alert('Could not load wedding profile for this client');
      }
    } catch (err) {
      console.error('Error fetching wedding profile:', err);
    }
    setWeddingLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-blue-100 text-blue-700 border-blue-300',
      confirmed: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-300',
      completed: 'bg-purple-100 text-purple-700 border-purple-300',
      rejected: 'bg-red-100 text-red-700 border-red-300'
    };

    const labels = {
      pending: t('Ausstehend'),
      confirmed: t('Bestätigt'),
      cancelled: t('Abgesagt'),
      completed: t('Abgeschlossen'),
      rejected: t('Abgelehnt')
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('Total')}</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('Ausstehend')}</p>
              <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('Bestätigt')}</p>
              <p className="text-3xl font-bold text-gray-800">{stats.confirmed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('Abgeschlossen')}</p>
              <p className="text-3xl font-bold text-gray-800">{stats.completed}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? t('All') : 
               status === 'pending' ? t('Ausstehend') :
               status === 'confirmed' ? t('Bestätigt') :
               status === 'completed' ? t('Abgeschlossen') : t('Abgesagt')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-lg">{t('No bookings found')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('Booking Number')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('Customer Name')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('Service')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('Date')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('Amount')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('Status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-purple-600">
                        {booking.booking_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">{booking.client_name}</p>
                        <p className="text-sm text-gray-500">{booking.client_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{booking.service_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800">{formatDate(booking.event_date)}</p>
                      {booking.event_time && (
                        <p className="text-sm text-gray-500">{booking.event_time}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-800">€{booking.total_amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium transition-colors"
                      >
                        {t('Details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-3xl p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Booking Details</h3>
                  <p className="text-purple-100">{selectedBooking.booking_number}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Information
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Name:</span> {selectedBooking.client_name}</p>
                  <p><span className="font-semibold">E-Mail:</span> {selectedBooking.client_email}</p>
                  {selectedBooking.client_phone && (
                    <p><span className="font-semibold">Telefon:</span> {selectedBooking.client_phone}</p>
                  )}
                </div>
              </div>

              {/* Event Info */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Event Details
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Service:</span> {selectedBooking.service_name}</p>
                  <p><span className="font-semibold">Date:</span> {formatDate(selectedBooking.event_date)}</p>
                  {selectedBooking.event_time && (
                    <p><span className="font-semibold">Time:</span> {selectedBooking.event_time}</p>
                  )}
                  <p><span className="font-semibold">Location:</span> {selectedBooking.event_location}</p>
                  {selectedBooking.guest_count && (
                    <p><span className="font-semibold">Guests:</span> {selectedBooking.guest_count}</p>
                  )}
                  <p><span className="font-semibold">Amount:</span> <span className="text-lg font-bold">€{selectedBooking.total_amount}</span></p>
                </div>
              </div>

              {/* Client Notes */}
              {selectedBooking.client_notes && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-800 mb-2">Client Notes</h4>
                  <p className="text-gray-700 text-sm">{selectedBooking.client_notes}</p>
                </div>
              )}

              {/* View Wedding Profile Button */}
              {selectedBooking.client_id && (
                <button
                  onClick={() => fetchWeddingProfile(selectedBooking.client_id)}
                  disabled={weddingLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {weddingLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      View Wedding Profile
                    </>
                  )}
                </button>
              )}

              {/* Status Actions */}
              {selectedBooking.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
                  >
                    ✓ Confirm
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'rejected')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-lg"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}

              {selectedBooking.status === 'confirmed' && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wedding Profile Modal */}
      {showWeddingModal && weddingData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-3xl p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    💍 {weddingData.client?.name || 'Client'}'s Wedding
                  </h3>
                  <p className="text-amber-100 text-sm">Wedding planning profile</p>
                </div>
                <button onClick={() => setShowWeddingModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {!weddingData.weddingProfile ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg mb-1">No wedding profile yet</p>
                  <p className="text-gray-400 text-sm">This client hasn't set up their wedding details.</p>
                </div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {weddingData.weddingProfile.weddingDate
                          ? Math.max(0, Math.ceil((new Date(weddingData.weddingProfile.weddingDate).getTime() - Date.now()) / (1000*60*60*24)))
                          : '—'}
                      </p>
                      <p className="text-xs text-purple-400 font-medium">Days Left</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{weddingData.taskProgress.completed}/{weddingData.taskProgress.total}</p>
                      <p className="text-xs text-green-400 font-medium">Tasks Done</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{weddingData.bookedVendors.length}</p>
                      <p className="text-xs text-blue-400 font-medium">Vendors</p>
                    </div>
                  </div>

                  {/* Wedding Details */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Wedding Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {weddingData.weddingProfile.weddingDate && (
                        <div>
                          <p className="text-gray-400 text-xs font-medium">Date</p>
                          <p className="font-semibold text-gray-800">{new Date(weddingData.weddingProfile.weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      )}
                      {weddingData.weddingProfile.venueLocation && (
                        <div>
                          <p className="text-gray-400 text-xs font-medium">Venue</p>
                          <p className="font-semibold text-gray-800">{weddingData.weddingProfile.venueLocation}</p>
                        </div>
                      )}
                      {weddingData.weddingProfile.guestCount && (
                        <div>
                          <p className="text-gray-400 text-xs font-medium">Guests</p>
                          <p className="font-semibold text-gray-800">{weddingData.weddingProfile.guestCount}</p>
                        </div>
                      )}
                      {weddingData.weddingProfile.preferredStyle && (
                        <div>
                          <p className="text-gray-400 text-xs font-medium">Style</p>
                          <p className="font-semibold text-gray-800">{weddingData.weddingProfile.preferredStyle}</p>
                        </div>
                      )}
                      {(weddingData.weddingProfile.budgetMin > 0 || weddingData.weddingProfile.budgetMax > 0) && (
                        <div>
                          <p className="text-gray-400 text-xs font-medium">Budget</p>
                          <p className="font-semibold text-gray-800">€{weddingData.weddingProfile.budgetMin.toLocaleString()} – €{weddingData.weddingProfile.budgetMax.toLocaleString()}</p>
                        </div>
                      )}
                      {weddingData.weddingProfile.colorTheme && (
                        <div>
                          <p className="text-gray-400 text-xs font-medium">Color Theme</p>
                          <p className="font-semibold text-gray-800">{weddingData.weddingProfile.colorTheme}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Services Needed */}
                  {weddingData.weddingProfile.servicesNeeded?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider">Services Needed</h4>
                      <div className="flex flex-wrap gap-2">
                        {weddingData.weddingProfile.servicesNeeded.map((s, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Requirements */}
                  {weddingData.weddingProfile.specialRequirements && (
                    <div className="bg-amber-50 rounded-2xl p-4">
                      <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider">Special Requirements</h4>
                      <p className="text-gray-700 text-sm">{weddingData.weddingProfile.specialRequirements}</p>
                    </div>
                  )}

                  {/* Other Booked Vendors */}
                  {weddingData.bookedVendors.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Other Booked Vendors</h4>
                      <div className="space-y-2">
                        {weddingData.bookedVendors.map((v, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{v.businessName}</p>
                              <p className="text-xs text-gray-400">{v.category}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                v.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>{v.status}</span>
                              <p className="text-sm font-semibold text-gray-800 mt-0.5">€{v.amount}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Contact Info */}
              {weddingData.client && (
                <div className="border-t pt-4 flex gap-3">
                  {weddingData.client.email && (
                    <a href={`mailto:${weddingData.client.email}`}
                      className="flex-1 text-center px-4 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition">
                      Email Client
                    </a>
                  )}
                  {weddingData.client.phone && (
                    <a href={`tel:${weddingData.client.phone}`}
                      className="flex-1 text-center px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition">
                      Call Client
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsManagement;