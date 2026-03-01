import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface AvailabilitySlot {
  id: number;
  date: string;
  timeSlot: string;
  isAvailable: boolean;
  price?: number;
}

const ManageAvailability: React.FC = () => {
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    { id: 1, date: '2024-06-15', timeSlot: '10:00 AM - 6:00 PM', isAvailable: true, price: 2500 },
    { id: 2, date: '2024-06-22', timeSlot: '2:00 PM - 10:00 PM', isAvailable: true, price: 3000 },
    { id: 3, date: '2024-06-29', timeSlot: '12:00 PM - 8:00 PM', isAvailable: false },
    { id: 4, date: '2024-07-06', timeSlot: '9:00 AM - 5:00 PM', isAvailable: true, price: 2800 }
  ]);

  const [newSlot, setNewSlot] = useState({
    date: '',
    timeSlot: '',
    price: ''
  });

  const toggleAvailability = (id: number) => {
    setAvailabilitySlots(slots =>
      slots.map(slot =>
        slot.id === id ? { ...slot, isAvailable: !slot.isAvailable } : slot
      )
    );
    toast.success('Availability updated');
  };

  const addNewSlot = () => {
    if (!newSlot.date || !newSlot.timeSlot) {
      toast.error('Please fill in all required fields');
      return;
    }

    const slot: AvailabilitySlot = {
      id: Date.now(),
      date: newSlot.date,
      timeSlot: newSlot.timeSlot,
      isAvailable: true,
      price: newSlot.price ? parseInt(newSlot.price) : undefined
    };

    setAvailabilitySlots([...availabilitySlots, slot]);
    setNewSlot({ date: '', timeSlot: '', price: '' });
    toast.success('New availability slot added');
  };

  const removeSlot = (id: number) => {
    setAvailabilitySlots(slots => slots.filter(slot => slot.id !== id));
    toast.success('Availability slot removed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6d8d8] to-[#5a9be7] py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-playfair text-4xl font-bold text-white mb-4">
              Manage Availability
            </h1>
            <p className="text-white/90">
              Set your available dates and time slots for bookings
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Add New Slot */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <h2 className="font-playfair text-xl font-semibold text-white mb-4">
                  Add New Slot
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newSlot.date}
                      onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                      className="w-full px-3 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Time Slot
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 10:00 AM - 6:00 PM"
                      value={newSlot.timeSlot}
                      onChange={(e) => setNewSlot({...newSlot, timeSlot: e.target.value})}
                      className="w-full px-3 py-2 bg-white/20 text-white placeholder-white/60 rounded-lg border border-white/30 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Price (Optional)
                    </label>
                    <input
                      type="number"
                      placeholder="€2500"
                      value={newSlot.price}
                      onChange={(e) => setNewSlot({...newSlot, price: e.target.value})}
                      className="w-full px-3 py-2 bg-white/20 text-white placeholder-white/60 rounded-lg border border-white/30 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <button
                    onClick={addNewSlot}
                    className="w-full bg-[#d4af37] hover:bg-[#b48a3b] text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Add Slot
                  </button>
                </div>
              </div>
            </div>

            {/* Current Availability */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <h2 className="font-playfair text-xl font-semibold text-white mb-6">
                  Current Availability
                </h2>

                <div className="space-y-4">
                  {availabilitySlots.map(slot => (
                    <div key={slot.id} className="bg-white/10 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-white">
                              {new Date(slot.date).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              slot.isAvailable 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {slot.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <p className="text-white/80 text-sm mb-1">{slot.timeSlot}</p>
                          {slot.price && (
                            <p className="text-white/80 text-sm">Price: €{slot.price}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAvailability(slot.id)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              slot.isAvailable
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                            }`}
                          >
                            {slot.isAvailable ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => removeSlot(slot.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {availabilitySlots.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-white/80">No availability slots set yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h3 className="font-playfair text-xl font-semibold text-white mb-4">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/vendor/dashboard"
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={() => {
                    const confirmed = window.confirm('Are you sure you want to clear all availability?');
                    if (confirmed) {
                      setAvailabilitySlots([]);
                      toast.success('All availability cleared');
                    }
                  }}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAvailability;
