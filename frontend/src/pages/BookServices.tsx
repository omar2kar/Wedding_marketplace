import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  vendor: string;
  available: boolean;
}

const BookServices: React.FC = () => {
  const { t } = useTranslation();
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [bookingStep, setBookingStep] = useState(1);

  const availableServices: Service[] = [
    {
      id: 1,
      name: 'Premium Wedding Photography',
      category: 'Photography',
      price: 2500,
      rating: 4.9,
      image: 'https://picsum.photos/300/200?random=1',
      vendor: 'Capture Moments Studio',
      available: true
    },
    {
      id: 2,
      name: 'Elegant Garden Venue',
      category: 'Venues',
      price: 5000,
      rating: 4.8,
      image: 'https://picsum.photos/300/200?random=2',
      vendor: 'Garden Paradise',
      available: true
    },
    {
      id: 3,
      name: 'Gourmet Wedding Catering',
      category: 'Catering',
      price: 3500,
      rating: 4.7,
      image: 'https://picsum.photos/300/200?random=3',
      vendor: 'Delicious Delights',
      available: true
    },
    {
      id: 4,
      name: 'Bridal Beauty Package',
      category: 'Beauty',
      price: 800,
      rating: 4.9,
      image: 'https://picsum.photos/300/200?random=4',
      vendor: 'Beauty Bliss',
      available: false
    }
  ];

  const addToBooking = (service: Service) => {
    if (!selectedServices.find(s => s.id === service.id)) {
      setSelectedServices([...selectedServices, service]);
      toast.success(`${service.name} added to booking!`);
    } else {
      toast.error('Service already selected');
    }
  };

  const removeFromBooking = (serviceId: number) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
    toast.success('Service removed from booking');
  };

  const proceedToBooking = () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    setBookingStep(2);
  };

  const confirmBooking = () => {
    // Simulate booking process
    const booking = {
      id: Date.now(),
      services: selectedServices,
      totalAmount: selectedServices.reduce((sum, service) => sum + service.price, 0),
      bookingDate: new Date().toISOString(),
      status: 'confirmed'
    };

    // Save to localStorage for demo
    const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    existingBookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(existingBookings));

    toast.success('Booking confirmed successfully!');
    setSelectedServices([]);
    setBookingStep(1);
  };

  if (bookingStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6d8d8] to-[#5a9be7] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="font-playfair text-4xl font-bold text-white mb-4">
                Confirm Your Booking
              </h1>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
              <h2 className="font-playfair text-2xl font-semibold text-white mb-6">
                Selected Services
              </h2>

              <div className="space-y-4 mb-8">
                {selectedServices.map(service => (
                  <div key={service.id} className="bg-white/10 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white">{service.name}</h3>
                      <p className="text-white/80 text-sm">{service.vendor}</p>
                      <p className="text-white/80 text-sm">{service.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">€{service.price}</p>
                      <button
                        onClick={() => removeFromBooking(service.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/20 pt-6 mb-8">
                <div className="flex justify-between items-center text-xl font-semibold text-white">
                  <span>Total Amount:</span>
                  <span>€{selectedServices.reduce((sum, service) => sum + service.price, 0)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setBookingStep(1)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Back to Services
                </button>
                <button
                  onClick={confirmBooking}
                  className="flex-1 bg-[#d4af37] hover:bg-[#b48a3b] text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6d8d8] to-[#5a9be7] py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
              Book Wedding Services
            </h1>
            <p className="text-xl text-white/90">
              Select and book your perfect wedding services
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Available Services */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <h2 className="font-playfair text-2xl font-semibold text-white mb-6">
                  Available Services
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {availableServices.map(service => (
                    <div key={service.id} className="bg-white/10 rounded-lg overflow-hidden">
                      <img 
                        src={service.image} 
                        alt={service.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-1">{service.name}</h3>
                        <p className="text-white/80 text-sm mb-1">{service.vendor}</p>
                        <p className="text-white/80 text-sm mb-2">{service.category}</p>
                        <div className="flex items-center mb-3">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white ml-1 text-sm">{service.rating}</span>
                        </div>
                        <p className="font-semibold text-white mb-3">€{service.price}</p>
                        <button
                          onClick={() => addToBooking(service)}
                          disabled={!service.available}
                          className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                            service.available
                              ? 'bg-[#d4af37] hover:bg-[#b48a3b] text-white'
                              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {service.available ? 'Add to Booking' : 'Not Available'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 sticky top-6">
                <h2 className="font-playfair text-2xl font-semibold text-white mb-4">
                  Your Booking
                </h2>

                {selectedServices.length === 0 ? (
                  <p className="text-white/80 text-center py-8">
                    No services selected yet
                  </p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {selectedServices.map(service => (
                      <div key={service.id} className="bg-white/10 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-white text-sm">{service.name}</h4>
                            <p className="text-white/80 text-xs">{service.vendor}</p>
                            <p className="text-white/80 text-xs">€{service.price}</p>
                          </div>
                          <button
                            onClick={() => removeFromBooking(service.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedServices.length > 0 && (
                  <div className="border-t border-white/20 pt-4 mb-6">
                    <div className="flex justify-between items-center text-white font-semibold">
                      <span>Total:</span>
                      <span>€{selectedServices.reduce((sum, service) => sum + service.price, 0)}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={proceedToBooking}
                  disabled={selectedServices.length === 0}
                  className="w-full bg-[#d4af37] hover:bg-[#b48a3b] disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Proceed to Booking
                </button>

                <Link
                  to="/search"
                  className="block w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg font-semibold text-center mt-3 transition-colors"
                >
                  Browse More Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookServices;
