import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Order {
  id: number;
  vendorName: string;
  serviceName: string;
  category: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  orderDate: string;
  eventDate: string;
  totalAmount: number;
  image?: string;
}

const ClientOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Mock data for now - will be replaced with real API call
      const mockOrders: Order[] = [
        {
          id: 1,
          vendorName: 'Elegant Photography',
          serviceName: 'Premium Wedding Package',
          category: 'Photography',
          status: 'confirmed',
          orderDate: '2024-01-15',
          eventDate: '2024-06-20',
          totalAmount: 2500,
          image: 'https://via.placeholder.com/100'
        },
        {
          id: 2,
          vendorName: 'Bloom Florals',
          serviceName: 'Bridal Bouquet & Decorations',
          category: 'Floristry',
          status: 'pending',
          orderDate: '2024-01-20',
          eventDate: '2024-06-20',
          totalAmount: 1200,
          image: 'https://via.placeholder.com/100'
        },
        {
          id: 3,
          vendorName: 'Sweet Delights',
          serviceName: '3-Tier Wedding Cake',
          category: 'Cake & Sweets',
          status: 'completed',
          orderDate: '2023-12-10',
          eventDate: '2024-01-05',
          totalAmount: 800,
          image: 'https://via.placeholder.com/100'
        }
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'completed':
        return '✔️';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <Link
            to="/categories"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Book New Service
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-4">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${orders.length})`}
              {status !== 'all' && ` (${orders.filter(o => o.status === status).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "You haven't made any bookings yet."
              : `You don't have any ${filter} orders.`}
          </p>
          <Link
            to="/categories"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Start Browsing Services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start space-x-4">
                {/* Service Image */}
                <img
                  src={order.image}
                  alt={order.serviceName}
                  className="w-24 h-24 rounded-lg object-cover"
                />

                {/* Order Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.serviceName}
                      </h3>
                      <p className="text-sm text-gray-600">by {order.vendorName}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Category: {order.category}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Order Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Event Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(order.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-sm font-medium text-gray-900">
                        €{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-4">
                    <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                      View Details
                    </button>
                    {order.status === 'pending' && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                          Confirm Order
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                          Cancel Order
                        </button>
                      </>
                    )}
                    {order.status === 'completed' && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                          Leave Review
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientOrders;
