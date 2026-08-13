import React, { useState } from 'react';
import { useCompare } from '../../context/CompareContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const ClientDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { add } = useCompare();
  const [activeTab, setActiveTab] = useState<'overview' | 'wishlist' | 'bookings' | 'messages'>('overview');

  // Mock data for demonstration
  const wishlistItems = [
    { id: 1, name: 'Elegant Wedding Dress', category: 'Dresses', provider: 'Bridal Boutique', price: '€460' },
    { id: 2, name: 'Professional DJ Service', category: 'Entertainment', provider: 'Party Masters', price: '€740' },
    { id: 3, name: 'Wedding Photography Package', category: 'Photography', provider: 'Capture Moments', price: '€1100' },
  ];

  const recentBookings = [
    { id: 1, service: 'Wedding Venue', provider: 'Grand Ballroom', date: '2025-09-15', status: 'Confirmed' },
    { id: 2, service: 'Catering Service', provider: 'Delicious Events', date: '2025-09-15', status: 'Pending' },
  ];

  const notifications = [
    { id: 1, message: 'New offer available for wedding dresses', time: '2 hours ago' },
    { id: 2, message: 'Your booking with Grand Ballroom is confirmed', time: '1 day ago' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('clientDashboard')}</h1>
        <p className="text-gray-600">{t('welcomeClient')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('overview')}
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'wishlist'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('wishlist')}
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('myBookings')}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messages'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('messages')}
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('searchForServices')}</h2>
              <div className="flex">
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button className="bg-primary-600 text-white px-6 py-2 rounded-r-lg hover:bg-primary-700 transition">
                  {t('search')}
                </button>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                  {t('dresses')}
                </span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                  {t('photography')}
                </span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                  {t('djServices')}
                </span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                  {t('venues')}
                </span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                  {t('catering')}
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('recentlyViewed')}</h2>
                <Link to="/wishlist" className="text-primary-600 hover:text-primary-800 text-sm">
                  {t('viewAll')}
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishlistItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.category}</p>
                    <p className="text-sm text-gray-600">{item.provider}</p>
                    <p className="text-lg font-bold text-primary-600 mt-2">{item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('notifications')}</h2>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="border-l-4 border-primary-500 pl-4 py-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">{t('quickActions')}</h2>
              <div className="space-y-3">
                <Link 
                  to="/wishlist" 
                  className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                >
                  {t('manageWishlist')}
                </Link>
                <Link 
                  to="/bookings" 
                  className="block w-full text-center px-4 py-2 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 transition"
                >
                  {t('viewBookings')}
                </Link>
                <Link 
                  to="/messages" 
                  className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  {t('sendMessage')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{t('myWishlist')}</h2>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition">
              {t('addNewItem')}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.category}</p>
                    <p className="text-sm text-gray-600">{item.provider}</p>
                  </div>
                  <button className="text-red-500 hover:text-red-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <p className="text-lg font-bold text-primary-600 mt-2">{item.price}</p>
                <div className="mt-4 flex space-x-2">
                  <button className="flex-grow px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm">
                    {t('bookNow')}
                  </button>
                  <button
                    onClick={() => add({ id: item.id, name: item.name, provider: item.provider, price: item.price })}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm"
                  >
                    {t('compare')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">{t('myBookings')}</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('service')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('provider')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'Confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        {t('viewDetails')}
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        {t('cancel')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">{t('messages')}</h2>
          <div className="border border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500">{t('noMessagesYet')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
