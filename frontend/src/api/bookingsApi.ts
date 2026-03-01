import { request } from './request';

export interface Booking {
  id: number;
  serviceName: string;
  providerName: string;
  date: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rejected';
  price: string;
  bookingNumber?: string;
}

export const getBookings = (clientId?: number) => {
  // إضافة clientId كـ query parameter
  const params = clientId ? `?clientId=${clientId}` : '';
  return request<Booking[]>(`/api/bookings${params}`);
};

export const patchBooking = (id: number, payload: Partial<Booking>) =>
  request<Booking>(`/api/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteBooking = (id: number) =>
  request<void>(`/api/bookings/${id}`, { method: 'DELETE' });
