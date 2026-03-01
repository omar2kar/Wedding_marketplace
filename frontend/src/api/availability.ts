import { request } from './request';

export interface AvailabilitySlot {
  date: string; // YYYY-MM-DD
  status: 'available' | 'booked' | 'blocked';
}

export interface VendorAvailabilitySlot {
  date: string;
  status: 'available' | 'booked' | 'blocked';
  service_id: number;
  service_name?: string;
}

// ---------- Local fallback helpers ----------

/**
 * Fallback: build availability from data saved by vendor dashboard in localStorage.
 * This is only for demo/offline usage when backend endpoint is not available.
 */
const buildLocalAvailability = (serviceId: number): AvailabilitySlot[] => {
  // read slots saved by vendor dashboard
  const storedSlots = localStorage.getItem('vendorAvailability');
  const rawSlots: any[] = storedSlots ? JSON.parse(storedSlots) : [];

  // read working days (array of numbers 0-6), default all days
  const workingDays: number[] = (() => {
    const saved = localStorage.getItem('vendorWorkingDays');
    return saved ? JSON.parse(saved) : [0,1,2,3,4,5,6];
  })();

  // convert booked dates to set for quick lookup
  const bookedSet = new Set(
    rawSlots
      .filter((s) => (s.serviceId === serviceId || serviceId === -1) && s.type === 'BOOKED')
      .map((s) => s.start.slice(0, 10))
  );
  // blockedSet to exclude
  const blockedSet = new Set(
    rawSlots
      .filter((s) => s.type === 'BLOCKED')
      .map((s) => s.start.slice(0, 10))
  );

  const today = new Date();
  const result: AvailabilitySlot[] = [];
  // Generate availability for next 90 days
  for (let offset = 0; offset < 90; offset++) {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const dateStr = dt.toISOString().slice(0, 10);
    // skip blocked days
    if (blockedSet.has(dateStr)) continue;
    if (!workingDays.includes(dt.getDay())) continue;

    if (bookedSet.has(dateStr)) {
      result.push({ date: dateStr, status: 'booked' });
    } else {
      result.push({ date: dateStr, status: 'available' });
    }
  }
  return result;
};

/**
 * Get availability for a specific service by ID.
 * Backend endpoint should return an array of { date: string, status: 'available' | 'booked' }
 */
export const getAvailability = async (serviceId: number): Promise<AvailabilitySlot[]> => {
  try {
    return await request<AvailabilitySlot[]>(`/services/${serviceId}/availability`);
  } catch (err) {
    console.warn('Falling back to local availability. API error:', err);
    return buildLocalAvailability(serviceId);
  }
};

export interface BookingRequest {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientCompany?: string;
  notes?: string;
}

/**
 * Request booking on a specific date.
 * Depending on backend design this may create a pending booking or return confirmation directly.
 */
export const requestBooking = async (
  serviceId: number,
  date: string,
  bookingData?: BookingRequest,
): Promise<void> => {
  try {
    await request<void>(`/services/${serviceId}/availability`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  } catch (err) {
    console.warn('Falling back to local booking. API error:', err);
    // ----- Local fallback: mark date as BOOKED in localStorage -----
    const stored = localStorage.getItem('vendorAvailability');
    const slots: any[] = stored ? JSON.parse(stored) : [];
    // avoid duplicates
    const exists = slots.some(
      (s) => s.serviceId === serviceId && s.start?.slice(0, 10) === date,
    );
    if (!exists) {
      slots.push({
        id: Date.now(),
        serviceId,
        vendorId: -1,
        start: `${date}T00:00:00.000Z`,
        end: `${date}T23:59:59.999Z`,
        type: 'BOOKED',
      });
      localStorage.setItem('vendorAvailability', JSON.stringify(slots));
      
      // Force refresh of availability data by clearing any cached data
      window.dispatchEvent(new StorageEvent('storage', {key: 'vendorAvailability', newValue: JSON.stringify(slots)}));

      // --- also store booking record for vendor ---
      const bookingList = (() => {
        try {
          return JSON.parse(localStorage.getItem('vendorBookings') || '[]');
        } catch {
          return [];
        }
      })();
      
      // Get service name from vendor services
      const vendorServices = localStorage.getItem('vendorServices');
      let serviceName = 'Service';
      let servicePrice = 0;
      if (vendorServices) {
        const services = JSON.parse(vendorServices);
        const service = services.find((s: any) => s.id === serviceId);
        if (service) {
          serviceName = service.name || service.title || 'Service';
          servicePrice = typeof service.price === 'number' ? service.price : Number(service.price) || 0;
        }
      }
      
      bookingList.push({
        id: Date.now(),
        clientName: bookingData?.clientName || 'Unregistered Client',
        clientPhone: bookingData?.clientPhone || '',
        clientEmail: bookingData?.clientEmail || '',
        clientCompany: bookingData?.clientCompany || '',
        serviceId,
        serviceName,
        eventDate: date,
        status: 'pending',
        amount: servicePrice,
        notes: bookingData?.notes || '',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('vendorBookings', JSON.stringify(bookingList));
      // notify other tabs
      window.dispatchEvent(new StorageEvent('storage', {key: 'vendorBookings', newValue: JSON.stringify(bookingList)}));
    }
  }
};

// ---------- Vendor Availability Management ----------

/**
 * Get all availability for vendor's services
 */
export const getVendorAvailability = async (): Promise<VendorAvailabilitySlot[]> => {
  try {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      throw new Error('No vendor token found');
    }

    const response = await fetch('http://localhost:5000/api/availability/vendor', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vendor availability:', error);
    return [];
  }
};

/**
 * Update availability for a specific service and date
 */
export const updateServiceAvailability = async (
  serviceId: number, 
  date: string, 
  status: 'available' | 'booked' | 'blocked'
): Promise<boolean> => {
  try {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      throw new Error('No vendor token found');
    }

    const response = await fetch(`http://localhost:5000/api/availability/service/${serviceId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date, status })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error updating service availability:', error);
    return false;
  }
};

/**
 * Bulk update availability for multiple dates
 */
export const bulkUpdateServiceAvailability = async (
  serviceId: number,
  dates: string[],
  status: 'available' | 'booked' | 'blocked'
): Promise<boolean> => {
  try {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      throw new Error('No vendor token found');
    }

    const response = await fetch(`http://localhost:5000/api/availability/service/${serviceId}/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dates, status })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error bulk updating service availability:', error);
    return false;
  }
};

/**
 * Delete availability for a specific service and date
 */
export const deleteServiceAvailability = async (
  serviceId: number,
  date: string
): Promise<boolean> => {
  try {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      throw new Error('No vendor token found');
    }

    const response = await fetch(`http://localhost:5000/api/availability/service/${serviceId}/${date}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting service availability:', error);
    return false;
  }
};
