import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AvailabilitySlot {
  id: number;
  service_id: number;
  date: string;
  status: 'available' | 'unavailable' | 'booked';
  notes?: string;
}

interface Service {
  id: number;
  name: string;
  category: string;
}

interface AvailabilityManagementProps {
  vendorId: number;
}

const AvailabilityManagement: React.FC<AvailabilityManagementProps> = ({ vendorId }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'available' | 'unavailable'>('available');
  const [notes, setNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch vendor services
  useEffect(() => {
    fetchServices();
  }, [vendorId]);

  // Fetch availability when service is selected
  useEffect(() => {
    if (selectedService) {
      fetchAvailability();
    }
  }, [selectedService, currentMonth]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/vendor/${vendorId}`);
      const data = await response.json();
      setServices(data);
      if (data.length > 0) {
        setSelectedService(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedService) return;
    
    try {
      setLoading(true);
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const response = await fetch(
        `http://localhost:5000/api/services/${selectedService}/availability?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      setAvailability(data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAvailability = async () => {
    if (!selectedService || !selectedDate) return;

    try {
      const response = await fetch(`http://localhost:5000/api/services/${selectedService}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: selectedDate,
          status: selectedStatus,
          notes: notes
        })
      });

      if (response.ok) {
        fetchAvailability();
        setSelectedDate('');
        setNotes('');
        alert(t('Availability updated successfully'));
      }
    } catch (error) {
      console.error('Error setting availability:', error);
      alert(t('Failed to update availability'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'unavailable':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'booked':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return t('Available');
      case 'unavailable':
        return t('Not Available');
      case 'booked':
        return t('Booked');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const getMonthDisplay = () => {
    return currentMonth.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const slot = availability.find(a => a.date === dateString);
      days.push({ day, date: dateString, slot });
    }
    
    return days;
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-2">📅 {t('Availability Management')}</h2>
        <p className="text-purple-100">{t('Manage your service availability and bookings')}</p>
      </div>

      {/* Service Selector */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('Select Service')}
        </label>
        <select
          value={selectedService || ''}
          onChange={(e) => setSelectedService(Number(e.target.value))}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.category})
            </option>
          ))}
        </select>
      </div>

      {/* Set Availability Form */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('Set Availability')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Date')}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Status')}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'available' | 'unavailable')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            >
              <option value="available">{t('Available')}</option>
              <option value="unavailable">{t('Not Available')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Notes')} ({t('optional')})
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('Add notes')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSetAvailability}
          disabled={!selectedDate}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {t('Update Availability')}
        </button>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium transition-colors"
          >
            ← {t('Previous')}
          </button>
          <h3 className="text-xl font-bold text-gray-800">{getMonthDisplay()}</h3>
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium transition-colors"
          >
            {t('Next')} →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {[t('Sunday'), t('Monday'), t('Tuesday'), t('Wednesday'), t('Thursday'), t('Friday'), t('Saturday')].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day.substring(0, 3)}
            </div>
          ))}
          
          {/* Calendar days */}
          {generateCalendarDays().map((dayInfo, index) => {
            if (!dayInfo) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const { day, date, slot } = dayInfo;
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <div
                key={date}
                className={`aspect-square border-2 rounded-lg p-2 text-center ${
                  isToday ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                } ${slot ? getStatusColor(slot.status) : 'bg-white hover:bg-gray-50'} transition-colors cursor-pointer`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="text-sm font-semibold">{day}</div>
                {slot && (
                  <div className="text-xs mt-1">
                    {getStatusLabel(slot.status)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Availability List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">{t('Current Month Availability')}</h3>
        </div>
        
        {availability.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg">{t('No availability set for this month')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {availability.map((slot) => (
              <div key={slot.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{formatDate(slot.date)}</p>
                    {slot.notes && (
                      <p className="text-sm text-gray-500 mt-1">{slot.notes}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(slot.status)}`}>
                    {getStatusLabel(slot.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityManagement;
