export interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  isActive: boolean;
  createdAt: string;
  vendorId: number;
  vendor?: {
    id: number;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    category: string;
    description: string;
    website: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
    isVerified: boolean;
    rating: number;
    reviewCount: number;
  };
}

const API_BASE_URL = 'http://localhost:5000/api';

export const getServiceById = async (id: number): Promise<Service> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching service:', error);
    throw error;
  }
};

export const getAllServices = async (): Promise<Service[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

export const getServicesByCategory = async (category: string): Promise<Service[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services?category=${encodeURIComponent(category)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching services by category:', error);
    throw error;
  }
};

export const searchServices = async (query: string): Promise<Service[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
};
