import React, { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { parseISO, isAfter } from 'date-fns';

interface AvailabilityCalendarProps {
  availableDates: string[];
  bookedDates: string[];
  onSelect: (date: Date) => void;
  selected?: Date;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ availableDates, bookedDates, onSelect, selected }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Listen for localStorage changes to refresh calendar
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vendorAvailability') {
        setRefreshKey(prev => prev + 1);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const booked = bookedDates.map((d) => parseISO(d));
  const available = availableDates.map((d) => parseISO(d));

  const modifiers = {
    booked,
    available,
    disabled: (date: Date) => {
      const today = new Date();
      // Disable past dates and those not in available list
      return isAfter(today, date) || (!availableDates.includes(date.toISOString().slice(0, 10)));
    },
  } as const;

  const modifiersClassNames = {
    booked: 'bg-red-200 text-red-800',
    available: 'bg-green-200 text-green-800',
    disabled: 'text-gray-400 line-through cursor-not-allowed',
    selected: 'bg-primary-600 text-white',
  };

  return (
    <DayPicker
      key={refreshKey}
      mode="single"
      selected={selected}
      onSelect={onSelect}
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      weekStartsOn={6}
      className="border rounded-lg p-4"
    />
  );
};

export default AvailabilityCalendar;
