import React, { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';

// Types
export interface VendorService {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

export interface VendorBooking {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  serviceId: number;
  serviceName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  totalAmount: number;
  amount?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface AvailabilitySlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  start?: string;
  end?: string;
  type: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  bookingId?: number;
  serviceId?: number;
  vendorId?: number;
}

export interface VendorData {
  id: number;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  category: string;
  description?: string;
  location?: string;
  city?: string;
  ownerName?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  profileImage?: string;
  coverImage?: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  joinedDate: string;
}

export interface VendorStats {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  monthlyRevenue?: number;
  yearlyRevenue?: number;
  averageRating: number;
  totalReviews: number;
}

export interface VendorContextType {
  vendor: VendorData | null;
  services: VendorService[];
  bookings: VendorBooking[];
  availability: AvailabilitySlot[];
  stats: VendorStats;
  isLoading: boolean;
  loadVendorData: () => Promise<void>;
  addService: (serviceData: Omit<VendorService, 'id' | 'createdAt'>) => Promise<void>;
  updateService: (id: number, serviceData: Partial<VendorService>) => Promise<void>;
  deleteService: (id: number) => Promise<void>;
  updateBookingStatus: (bookingId: number, status: VendorBooking['status']) => Promise<void>;
  addBlockedSlot: (slot: { date?: string; startTime?: string; endTime?: string; start?: string; end?: string; vendorId?: number; serviceId?: number | null }) => Promise<void>;
  removeAvailability: (slotId: number) => Promise<void>;
  updateVendorProfile: (data: Partial<VendorData>) => Promise<void>;
}

interface VendorProviderProps {
  children: ReactNode;
}

// Create context
const VendorContext = createContext<VendorContextType | undefined>(undefined);

// Custom hook to use vendor context
export const useVendor = () => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

// Mock data
const mockVendor: VendorData = {
  id: 1,
  name: 'Ahmed Hassan',
  email: 'ahmed@example.com',
  phone: '+20123456789',
  businessName: 'Hassan Photography Studio',
  category: 'Photography',
  description: 'Professional wedding photographer with 10+ years of experience',
  location: 'Cairo, Egypt',
  website: 'https://hassanphoto.com',
  socialMedia: {
    instagram: '@hassanphoto',
    facebook: 'Hassan Photography',
  },
  profileImage: '/images/vendor-profile.jpg',
  coverImage: '/images/vendor-cover.jpg',
  rating: 4.8,
  totalReviews: 127,
  isVerified: true,
  joinedDate: '2023-01-15'
};

const defaultServices: VendorService[] = [
  {
    id: 1,
    name: 'Complete Wedding Photography',
    description: 'Professional wedding photography with delivery of 200+ edited photos',
    category: 'Photography',
    price: 800,
    images: ['/images/service1.jpg', '/images/service1-2.jpg'],
    isActive: true,
    createdAt: '2024-02-15'
  },
  {
    id: 2,
    name: 'Engagement Photo Session',
    description: 'Romantic engagement photo session at your choice of location',
    category: 'Photography',
    price: 300,
    images: ['/images/service2.jpg'],
    isActive: true,
    createdAt: '2024-02-10'
  }
];

// Provider component
const VendorProvider: FC<VendorProviderProps> = ({ children }) => {
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [services, setServices] = useState<VendorService[]>([]);
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(() => {
    const stored = localStorage.getItem('vendorAvailability');
    return stored ? JSON.parse(stored) : [];
  });
  const [stats, setStats] = useState<VendorStats>({
    totalServices: 0,
    activeServices: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadVendorData = async () => {
    try {
      setIsLoading(true);
      
      // Load services from backend API first, then fallback to localStorage
      let vendorServices: VendorService[] = [];
      const vendorToken = localStorage.getItem('vendorToken');
      
      if (vendorToken) {
        try {
          const response = await fetch('http://localhost:5000/api/vendor/services', {
            headers: {
              'Authorization': `Bearer ${vendorToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.status === 401) {
            // Token is invalid or expired
            console.error('Token expired or invalid, clearing session');
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorData');
            window.location.href = '/vendor/login';
            return;
          }
          
          if (response.ok) {
            vendorServices = await response.json();
            console.log('Loaded services from backend:', vendorServices);
            // Update localStorage with fresh data
            try {
              localStorage.setItem('vendorServices', JSON.stringify(vendorServices));
            } catch (error) {
              console.warn('Failed to save services to localStorage:', error);
            }
          } else {
            throw new Error('Failed to fetch services from backend');
          }
        } catch (error) {
          console.warn('Failed to load services from backend, trying localStorage:', error);
          // Fallback to localStorage
          try {
            const savedServices = localStorage.getItem('vendorServices');
            vendorServices = savedServices ? JSON.parse(savedServices) : defaultServices;
          } catch (localError) {
            console.warn('Failed to parse vendorServices from localStorage, using defaults:', localError);
            vendorServices = defaultServices;
          }
        }
      } else {
        // No token, try localStorage
        try {
          const savedServices = localStorage.getItem('vendorServices');
          vendorServices = savedServices ? JSON.parse(savedServices) : defaultServices;
        } catch (error) {
          console.warn('Failed to parse vendorServices from localStorage, using defaults:', error);
          vendorServices = defaultServices;
        }
      }
      
      setServices(vendorServices);

      // Load vendor profile from backend API
      if (vendorToken) {
        try {
          const profileRes = await fetch('http://localhost:5000/api/vendor/profile', {
            headers: {
              'Authorization': `Bearer ${vendorToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const vendorData: VendorData = {
              id: profileData.id,
              name: profileData.name || '',
              email: profileData.email || '',
              phone: profileData.phone || '',
              businessName: profileData.business_name || '',
              category: profileData.category || '',
              description: profileData.bio || '',
              city: profileData.city || '',
              ownerName: profileData.name || '',
              website: profileData.website || '',
              profileImage: profileData.profile_image || '',
              rating: parseFloat(profileData.rating) || 0,
              totalReviews: parseInt(profileData.total_reviews) || 0,
              isVerified: Boolean(profileData.is_verified),
              joinedDate: profileData.created_at || ''
            };
            setVendor(vendorData);
          } else {
            // Fallback to localStorage or mock
            const savedVendor = localStorage.getItem('vendorData');
            if (savedVendor) {
              setVendor(JSON.parse(savedVendor));
            } else {
              setVendor({ ...mockVendor, rating: 4.8 });
            }
          }
        } catch (err) {
          console.warn('Failed to load vendor profile from API:', err);
          const savedVendor = localStorage.getItem('vendorData');
          if (savedVendor) {
            setVendor(JSON.parse(savedVendor));
          } else {
            setVendor({ ...mockVendor, rating: 4.8 });
          }
        }
      } else {
        setVendor({ ...mockVendor, rating: 4.8 });
      }

      // Load mock bookings
      const mockBookings: VendorBooking[] = [
        {
          id: 1,
          clientName: 'Sarah Ahmed',
          clientEmail: 'sarah@example.com',
          clientPhone: '+20123456789',
          serviceId: 1,
          serviceName: 'Complete Wedding Photography',
          eventDate: '2024-03-15',
          eventTime: '14:00',
          eventLocation: 'Four Seasons Hotel, Cairo',
          totalAmount: 800,
          status: 'confirmed',
          notes: 'Outdoor ceremony preferred',
          createdAt: '2024-02-01'
        },
        {
          id: 2,
          clientName: 'Omar Mahmoud',
          clientEmail: 'omar@example.com',
          clientPhone: '+20987654321',
          serviceId: 2,
          serviceName: 'Engagement Photo Session',
          eventDate: '2024-02-28',
          eventTime: '16:00',
          eventLocation: 'Nile Corniche',
          totalAmount: 300,
          status: 'pending',
          createdAt: '2024-02-10'
        }
      ];

      setBookings(mockBookings);

      // Calculate stats
      const activeServices = vendorServices.filter(s => s.isActive).length;
      const totalRevenue = mockBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      const pendingBookings = mockBookings.filter(b => b.status === 'pending').length;
      const completedBookings = mockBookings.filter(b => b.status === 'completed').length;

      setStats({
        totalServices: vendorServices.length,
        activeServices,
        totalBookings: mockBookings.length,
        pendingBookings,
        completedBookings,
        totalRevenue,
        averageRating: 4.8,
        totalReviews: 127
      });

      // Safe localStorage update for bookings
      try {
        localStorage.setItem('vendorBookings', JSON.stringify(mockBookings));
      } catch (error) {
        console.warn('localStorage quota exceeded, clearing old data');
        localStorage.removeItem('vendorServices');
        localStorage.removeItem('vendorBookings');
        localStorage.removeItem('vendorAvailability');
        try {
          localStorage.setItem('vendorBookings', JSON.stringify(mockBookings));
        } catch (secondError) {
          console.error('Failed to save to localStorage even after clearing:', secondError);
        }
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addService = async (serviceData: Omit<VendorService, 'id' | 'createdAt'>) => {
    console.log('VendorContext addService called with:', serviceData);
    try {
      const vendorToken = localStorage.getItem('vendorToken');
      console.log('Token found:', vendorToken ? 'Yes' : 'No');
      
      if (!vendorToken) {
        throw new Error('No vendor token found');
      }

      console.log('Making API call to add service...');
      // API call to add service
      const response = await fetch('http://localhost:5000/api/vendor/services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vendorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceData)
      });

      console.log('API Response status:', response.status);
      
      if (response.status === 401) {
        // Token is invalid or expired
        console.error('Token expired or invalid');
        localStorage.removeItem('vendorToken');
        localStorage.removeItem('vendorData');
        throw new Error('Session expired. Please login again.');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        console.error('Parsed API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`);
      }

      const newService = await response.json();
      console.log('Service added successfully:', newService);
      
      setServices(prev => {
        const updated = [...prev, newService];
        // Safe localStorage update with error handling
        try {
          localStorage.setItem('vendorServices', JSON.stringify(updated));
        } catch (error) {
          console.warn('localStorage quota exceeded, clearing old data');
          // Clear old data and try again
          localStorage.removeItem('vendorServices');
          localStorage.removeItem('vendorBookings');
          localStorage.removeItem('vendorAvailability');
          try {
            localStorage.setItem('vendorServices', JSON.stringify(updated));
          } catch (secondError) {
            console.error('Failed to save to localStorage even after clearing:', secondError);
          }
        }
        return updated;
      });
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalServices: prev.totalServices + 1,
        activeServices: serviceData.isActive ? prev.activeServices + 1 : prev.activeServices
      }));

      console.log('Service added successfully:', newService);
    } catch (error) {
      console.error('Error adding service:', error);
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error occurred while adding service');
      }
    }
  };

  const updateService = async (id: number, serviceData: Partial<VendorService>) => {
    try {
      const vendorToken = localStorage.getItem('vendorToken');
      if (!vendorToken) {
        throw new Error('No vendor token found');
      }

      // API call to update service
      const response = await fetch(`http://localhost:5000/api/vendor/services/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${vendorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceData)
      });

      if (response.status === 401) {
        localStorage.removeItem('vendorToken');
        localStorage.removeItem('vendorData');
        throw new Error('Session expired. Please login again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service');
      }

      const updatedService = await response.json();
      
      setServices(prev => {
        const updated = prev.map(service => 
          service.id === id ? { ...service, ...updatedService } : service
        );
        // Safe localStorage update with error handling
        try {
          localStorage.setItem('vendorServices', JSON.stringify(updated));
        } catch (error) {
          console.warn('localStorage quota exceeded, clearing old data');
          // Clear old data and try again
          localStorage.removeItem('vendorServices');
          localStorage.removeItem('vendorBookings');
          localStorage.removeItem('vendorAvailability');
          try {
            localStorage.setItem('vendorServices', JSON.stringify(updated));
          } catch (secondError) {
            console.error('Failed to save to localStorage even after clearing:', secondError);
          }
        }
        return updated;
      });
      
      // Update stats if isActive status changed
      if ('isActive' in serviceData) {
        setStats(prev => {
          const oldService = services.find(s => s.id === id);
          if (oldService) {
            const activeChange = serviceData.isActive ? 1 : -1;
            const oldActiveChange = oldService.isActive ? -1 : 1;
            return {
              ...prev,
              activeServices: prev.activeServices + activeChange + oldActiveChange
            };
          }
          return prev;
        });
      }

      console.log('Service updated successfully:', updatedService);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  };

  const deleteService = async (id: number) => {
    try {
      const vendorToken = localStorage.getItem('vendorToken');
      if (!vendorToken) {
        throw new Error('No vendor token found');
      }

      // API call to delete service
      const response = await fetch(`http://localhost:5000/api/vendor/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${vendorToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('vendorToken');
        localStorage.removeItem('vendorData');
        throw new Error('Session expired. Please login again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete service');
      }

      setServices(prev => {
        const updated = prev.filter(service => service.id !== id);
        // Safe localStorage update with error handling
        try {
          localStorage.setItem('vendorServices', JSON.stringify(updated));
        } catch (error) {
          console.warn('localStorage quota exceeded, clearing old data');
          // Clear old data and try again
          localStorage.removeItem('vendorServices');
          localStorage.removeItem('vendorBookings');
          localStorage.removeItem('vendorAvailability');
          try {
            localStorage.setItem('vendorServices', JSON.stringify(updated));
          } catch (secondError) {
            console.error('Failed to save to localStorage even after clearing:', secondError);
          }
        }
        return updated;
      });
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalServices: prev.totalServices - 1
      }));

      console.log('Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  };

  const updateBookingStatus = async (bookingId: number, status: VendorBooking['status']) => {
    try {
      // TODO: API call to update booking status
      setBookings(prev =>
        prev.map(booking =>
          booking.id === bookingId ? { ...booking, status } : booking
        )
      );

      // Recalculate stats
      const updatedBookings = bookings.map(booking =>
        booking.id === bookingId ? { ...booking, status } : booking
      );
      
      setStats(prev => ({
        ...prev,
        pendingBookings: updatedBookings.filter(b => b.status === 'pending').length,
        completedBookings: updatedBookings.filter(b => b.status === 'completed').length
      }));
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  };

  const addBlockedSlot = async (slot: { date?: string; startTime?: string; endTime?: string; start?: string; end?: string; vendorId?: number; serviceId?: number | null }) => {
    const newSlot: AvailabilitySlot = { 
      ...slot, 
      id: Date.now(), 
      type: 'BLOCKED',
      date: slot.date || slot.start?.split('T')[0] || '',
      startTime: slot.startTime || slot.start?.split('T')[1] || '',
      endTime: slot.endTime || slot.end?.split('T')[1] || ''
    };
    setAvailability(prev => {
      const updated = [...prev, newSlot];
      localStorage.setItem('vendorAvailability', JSON.stringify(updated));
      return updated;
    });
  };

  const removeAvailability = async (slotId: number) => {
    setAvailability(prev => {
      const updated = prev.filter(s => s.id !== slotId);
      localStorage.setItem('vendorAvailability', JSON.stringify(updated));
      return updated;
    });
  };

  const updateVendorProfile = async (data: Partial<VendorData>) => {
    try {
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Filter out undefined and null values to prevent overwriting existing data
      const cleanData: Partial<VendorData> = {};
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof VendorData];
        if (value !== undefined && value !== null && value !== '') {
          (cleanData as any)[key] = value;
        }
      });

      // API call to update vendor profile
      const response = await fetch('http://localhost:5000/api/vendor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: cleanData.name,
          business_name: cleanData.businessName,
          phone: cleanData.phone,
          category: cleanData.category,
          bio: cleanData.description,
          profile_image: cleanData.profileImage,
          city: cleanData.city,
          website: cleanData.website
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedVendor = await response.json();
      
      // Map backend fields to frontend fields
      const mappedVendor: VendorData = {
        id: updatedVendor.id,
        name: updatedVendor.name,
        email: updatedVendor.email,
        phone: updatedVendor.phone,
        businessName: updatedVendor.business_name,
        category: updatedVendor.category,
        description: updatedVendor.bio,
        profileImage: updatedVendor.profile_image,
        rating: updatedVendor.rating || 0,
        totalReviews: 0,
        isVerified: updatedVendor.status === 'approved',
        joinedDate: updatedVendor.created_at,
        location: vendor?.location,
        city: updatedVendor.city || vendor?.city,
        ownerName: updatedVendor.name || vendor?.ownerName,
        website: updatedVendor.website || vendor?.website,
        socialMedia: vendor?.socialMedia,
        coverImage: vendor?.coverImage
      };
      
      setVendor(mappedVendor);
      localStorage.setItem('vendorData', JSON.stringify(mappedVendor));

      // Update stats if rating or totalReviews provided
      setStats(prev => {
        const newStats = { ...prev };
        if (typeof data.rating === 'number') newStats.averageRating = data.rating;
        return newStats;
      });
    } catch (error) {
      console.error('Error updating vendor profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'vendorBookings') {
        try {
          setBookings(JSON.parse(e.newValue || '[]'));
        } catch {}
      }
      if (e.key === 'vendorAvailability') {
        try {
          setAvailability(JSON.parse(e.newValue || '[]'));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const vendorToken = localStorage.getItem('vendorToken');
    if (vendorToken) {
      loadVendorData();
    }
  }, []);

  const value: VendorContextType = {
    vendor,
    services,
    bookings,
    availability,
    stats,
    isLoading,
    loadVendorData,
    addService,
    updateService,
    deleteService,
    updateBookingStatus,
    addBlockedSlot,
    removeAvailability,
    updateVendorProfile
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
};

export { VendorProvider };
export default VendorProvider;