interface WishlistItem {
  id: number;
  name: string;
  category: string;
  provider: string;
  price: string;
  rating: number;
  image?: string;
}
import { request } from './request';

export const getWishlist = () => request<WishlistItem[]>('/api/wishlist');

export const deleteWishlistItem = (id: number) =>
  request<void>(`/api/wishlist/${id}`, { method: 'DELETE' });

export const addWishlistItem = (item: Partial<WishlistItem>) =>
  request<WishlistItem>('/api/wishlist', {
    method: 'POST',
    body: JSON.stringify(item),
  });
