import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
// English locale for date-fns
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useVendor } from '../../context/VendorContext';
import { 
  getVendorAvailability, 
  updateServiceAvailability, 
  deleteServiceAvailability,
  VendorAvailabilitySlot 
} from '../../api/availability';

// Custom CSS styles for better calendar appearance
const calendarStyles = `
  .rbc-event {
    border: none !important;
    border-radius: 8px !important;
    font-weight: bold !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
    transition: all 0.2s ease !important;
  }
  
  .rbc-event:hover {
    transform: scale(1.02) !important;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
    cursor: pointer !important;
  }
  
  .rbc-event-content {
    font-size: 11px !important;
    padding: 2px !important;
  }
  
  .rbc-month-view .rbc-event {
    border-radius: 6px !important;
    margin: 1px !important;
  }
  
  .rbc-calendar {
    background: white !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
    overflow: hidden !important;
  }
  
  .rbc-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    font-weight: bold !important;
    padding: 12px 8px !important;
    border: none !important;
  }
  
  .rbc-month-view .rbc-date-cell {
    padding: 8px !important;
  }
  
  .rbc-today {
    background-color: rgba(147, 51, 234, 0.1) !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = calendarStyles;
  if (!document.head.querySelector('style[data-calendar-styles]')) {
    styleElement.setAttribute('data-calendar-styles', 'true');
    document.head.appendChild(styleElement);
  }
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }), // Sunday start
  getDay,
  locales,
});

interface CalendarEvent extends Event {
  resource: any;
}

const VendorCalendar: React.FC = () => {
  // Read availability settings from LocalStorage and make them updateable
  const getWorkingSettings = () => {
    const storedDays = localStorage.getItem('vendorWorkingDays');
    const storedHours = localStorage.getItem('vendorWorkingHours');
    return {
      days: storedDays ? JSON.parse(storedDays) as number[] : [0,1,2,3,4,5,6],
      hours: storedHours ? JSON.parse(storedHours) as {start:string,end:string} : { start: '00:00', end: '23:59' },
    };
  };

  const [{ days: workingDays, hours: workingHours }, setWorking] = useState(getWorkingSettings());
  const [availability, setAvailability] = useState<VendorAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Listen for settings changes
  useEffect(() => {
    const handler = () => setWorking(getWorkingSettings());
    window.addEventListener('vendorWorkingChanged', handler);
    return () => window.removeEventListener('vendorWorkingChanged', handler);
  }, []);

  // Load availability data from database
  useEffect(() => {
    const loadAvailability = async () => {
      setLoading(true);
      try {
        const data = await getVendorAvailability();
        setAvailability(data);
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, []);

  const { start, end } = workingHours;

  // Convert HH:MM to today's date
  const today = new Date();
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const minTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, startMinute);
  const maxTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endHour, endMinute);

  const { services } = useVendor();
  const [serviceFilter, setServiceFilter] = useState<'all' | number>('all');

  // Refresh availability when service filter changes
  const refreshAvailability = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching vendor availability...');
      const data = await getVendorAvailability();
      console.log('📊 Received availability data:', data);
      console.log('📊 Data length:', data.length);
      setAvailability(data);
    } catch (error) {
      console.error('❌ Error refreshing availability:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert periods to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    console.log('🎯 Converting availability to events...');
    console.log('🎯 Total availability slots:', availability.length);
    console.log('🎯 Service filter:', serviceFilter);
    
    const filtered = availability.filter(slot => (serviceFilter === 'all' || slot.service_id === serviceFilter));
    console.log('🎯 Filtered slots:', filtered.length);
    
    return filtered.map((slot, index) => {
        const serviceName = slot.service_name || `خدمة ${slot.service_id}`;
        let title = '';
        let icon = '';
        
        switch (slot.status) {
          case 'booked':
            title = `🔴 محجوز - ${serviceName}`;
            icon = '🔴';
            break;
          case 'blocked':
            title = `⚫ محجوب - ${serviceName}`;
            icon = '⚫';
            break;
          case 'available':
            title = `🟢 متاح - ${serviceName}`;
            icon = '🟢';
            break;
          default:
            title = `📅 ${serviceName}`;
            icon = '📅';
        }
        
        // Fix date parsing - slot.date comes as ISO string from database
        const dateStr = slot.date.split('T')[0]; // Extract YYYY-MM-DD part
        const startDate = new Date(dateStr + 'T00:00:00');
        const endDate = new Date(dateStr + 'T23:59:59');
        
        console.log('🗓️ Original date:', slot.date);
        console.log('🗓️ Parsed dateStr:', dateStr);
        console.log('🗓️ Start date:', startDate);
        console.log('🗓️ End date:', endDate);
        
        const event = {
          id: `${slot.service_id}-${dateStr}-${index}`,
          title,
          start: startDate,
          end: endDate,
          allDay: true,
          resource: { ...slot, icon },
        };
        
        console.log('🎯 Created event:', event);
        return event;
      });
  }, [availability, serviceFilter]);

  // Custom style for colors with better visibility
  const eventPropGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor, borderColor, textColor, boxShadow;
    
    switch (status) {
      case 'booked':
        backgroundColor = '#DC2626'; // Dark red
        borderColor = '#991B1B';
        textColor = '#FFFFFF';
        boxShadow = '0 2px 4px rgba(220, 38, 38, 0.3)';
        break;
      case 'blocked':
        backgroundColor = '#6B7280'; // Dark gray/silver
        borderColor = '#374151';
        textColor = '#FFFFFF';
        boxShadow = '0 2px 4px rgba(107, 114, 128, 0.3)';
        break;
      case 'available':
        backgroundColor = '#059669'; // Dark green
        borderColor = '#047857';
        textColor = '#FFFFFF';
        boxShadow = '0 2px 4px rgba(5, 150, 105, 0.3)';
        break;
      default:
        backgroundColor = '#6366F1'; // Purple
        borderColor = '#4F46E5';
        textColor = '#FFFFFF';
        boxShadow = '0 2px 4px rgba(99, 102, 241, 0.3)';
    }
    
    return {
      style: {
        backgroundColor,
        borderColor,
        color: textColor,
        borderRadius: '6px',
        border: `2px solid ${borderColor}`,
        boxShadow,
        fontWeight: 'bold',
        fontSize: '12px',
        padding: '2px 4px',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
      }
    };
  };

  // When selecting an event, allow status changes
  const handleSelectEvent = async (event: CalendarEvent) => {
    const slot = event.resource as VendorAvailabilitySlot;
    const serviceName = slot.service_name || `Service ${slot.service_id}`;
    
    let message = `إدارة التوفر لـ ${serviceName} في تاريخ ${slot.date}\n\n`;
    message += `الحالة الحالية: ${slot.status === 'available' ? 'متاح' : slot.status === 'blocked' ? 'محجوب' : 'محجوز'}\n\n`;
    message += `اختر الإجراء:\n`;
    
    const actions = [];
    if (slot.status === 'blocked') {
      actions.push('إلغاء الحجب (جعله متاح)');
      actions.push('حذف هذا التاريخ من التقويم');
    } else if (slot.status === 'available') {
      actions.push('حجب هذا التاريخ');
      actions.push('حذف هذا التاريخ من التقويم');
    } else if (slot.status === 'booked') {
      actions.push('إلغاء الحجز (جعله متاح)');
      actions.push('حجب هذا التاريخ');
    }
    
    actions.forEach((action, index) => {
      message += `${index + 1}. ${action}\n`;
    });
    
    const choice = window.prompt(message + '\nأدخل رقم الخيار:');
    
    if (choice && parseInt(choice) > 0 && parseInt(choice) <= actions.length) {
      const selectedAction = actions[parseInt(choice) - 1];
      
      if (selectedAction.includes('حذف')) {
        // Delete the availability entry
        const success = await deleteServiceAvailability(slot.service_id, slot.date);
        if (success) {
          alert('تم حذف التاريخ من التقويم بنجاح');
          await refreshAvailability();
        } else {
          alert('فشل في حذف التاريخ');
        }
      } else {
        // Update status
        let newStatus: 'available' | 'blocked' | 'booked' = 'available';
        
        if (selectedAction.includes('حجب')) {
          newStatus = 'blocked';
        } else if (selectedAction.includes('متاح')) {
          newStatus = 'available';
        }
        
        const success = await updateServiceAvailability(slot.service_id, slot.date, newStatus);
        if (success) {
          alert('تم تحديث حالة التوفر بنجاح');
          await refreshAvailability();
        } else {
          alert('فشل في تحديث حالة التوفر');
        }
      }
    }
  };

  // When selecting an empty period, allow setting availability
  const handleSelectSlot = async (slotInfo: { start: Date; end: Date }) => {
    // Allow selection only on working days
    if (!workingDays.includes(slotInfo.start.getDay())) {
      alert('اليوم المحدد خارج أيام العمل');
      return;
    }
    
    const dateStr = slotInfo.start.toISOString().split('T')[0];
    
    // Check if there's already availability set for this date
    const existingSlot = availability.find(slot => slot.date === dateStr);
    if (existingSlot) {
      alert('يوجد بالفعل إعداد توفر لهذا التاريخ. انقر على الحدث لتعديله.');
      return;
    }
    
    // Ask which service and status
    let message = `إضافة توفر جديد للتاريخ ${dateStr}\n\n`;
    message += `اختر الخدمة:\n`;
    
    const activeServices = services.filter(s => s.isActive);
    if (activeServices.length === 0) {
      alert('لا توجد خدمات نشطة. يرجى إضافة خدمة أولاً.');
      return;
    }
    
    activeServices.forEach((service, index) => {
      message += `${index + 1}. ${service.name}\n`;
    });
    
    const serviceChoice = window.prompt(message + '\nأدخل رقم الخدمة:');
    
    if (!serviceChoice || isNaN(parseInt(serviceChoice)) || parseInt(serviceChoice) < 1 || parseInt(serviceChoice) > activeServices.length) {
      return;
    }
    
    const selectedService = activeServices[parseInt(serviceChoice) - 1];
    
    const statusMessage = `اختر حالة التوفر للخدمة "${selectedService.name}":\n\n1. متاح\n2. محجوب\n\nأدخل رقم الخيار:`;
    const statusChoice = window.prompt(statusMessage);
    
    let statusValue: 'available' | 'blocked' = 'available';
    
    if (statusChoice === '2') {
      statusValue = 'blocked';
    } else if (statusChoice !== '1') {
      return;
    }
    
    const success = await updateServiceAvailability(selectedService.id, dateStr, statusValue);
    
    if (success) {
      alert(`تم إضافة التوفر بنجاح!\nالخدمة: ${selectedService.name}\nالتاريخ: ${dateStr}\nالحالة: ${statusValue === 'available' ? 'متاح' : 'محجوب'}`);
      await refreshAvailability();
    } else {
      alert('فشل في إضافة التوفر');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">جاري تحميل بيانات التوفر...</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 space-y-4">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Service:</label>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="all">All Services</option>
            {services.filter(s => s.isActive).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="font-semibold mb-2">كيفية استخدام التقويم:</p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              انقر على التواريخ الفارغة لإضافة توفر جديد للخدمات
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              انقر على الأحداث الموجودة لتعديل حالتها أو حذفها
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">🟢</span>
              <span className="inline-block w-5 h-5 bg-green-600 border-2 border-green-800 rounded ml-1 mr-2 shadow-sm"></span>
              <span className="font-medium">أخضر = متاح للحجز</span>
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">🔴</span>
              <span className="inline-block w-5 h-5 bg-red-600 border-2 border-red-800 rounded ml-1 mr-2 shadow-sm"></span>
              <span className="font-medium">أحمر = محجوز</span>
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">⚫</span>
              <span className="inline-block w-5 h-5 bg-gray-600 border-2 border-gray-800 rounded ml-1 mr-2 shadow-sm"></span>
              <span className="font-medium">رمادي فضي = محجوب</span>
            </li>
          </ul>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            إجمالي التواريخ المضافة: <span className="font-semibold text-purple-600">{availability.length}</span>
          </div>
          <button
            onClick={async () => {
              await refreshAvailability();
              alert('تم تحديث التقويم بنجاح');
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
          >
            تحديث التقويم
          </button>
        </div>
      </div>

      <Calendar
        culture="en-US"
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        selectable
        min={minTime}
        max={maxTime}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        eventPropGetter={eventPropGetter}
        views={['month', 'week', 'day']}
        defaultView="month"
      />
    </>
  );
};

export default VendorCalendar;
