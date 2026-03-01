import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  profileImage?: string;
  createdAt?: string;
}

interface ClientContextType {
  client: Client | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Client>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

interface ClientProviderProps {
  children: ReactNode;
}

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('clientToken');
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/client/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            // Backend returns { success: true, user: {...} }
            const userData = data.user || data;
            console.log('🔍 checkAuth - userData:', JSON.stringify(userData, null, 2));
            // Map snake_case from backend to camelCase for frontend
            const mappedClient: Client = {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              address: userData.address,
              city: userData.city,
              country: userData.country,
              profileImage: userData.profile_image,
              createdAt: userData.created_at
            };
            console.log('🔍 checkAuth - mappedClient:', JSON.stringify(mappedClient, null, 2));
            setClient(mappedClient);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('clientToken');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('clientToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/client/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('clientToken', data.token);
      // Map snake_case from backend to camelCase for frontend
      const mappedUser: Client = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        address: data.user.address,
        city: data.user.city,
        country: data.user.country,
        profileImage: data.user.profile_image,
        createdAt: data.user.created_at
      };
      setClient(mappedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('clientToken');
    setClient(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const updateProfile = async (data: Partial<Client>) => {
    const token = localStorage.getItem('clientToken');
    if (!token) throw new Error('Not authenticated');

    console.log('🚀 updateProfile called with:', JSON.stringify(data, null, 2));

    try {
      const response = await fetch('http://localhost:5000/api/client/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedClient = await response.json();
      console.log('📥 Updated client from API:', JSON.stringify(updatedClient, null, 2));
      
      // Backend returns { message: "...", user: {...} }
      const userData = updatedClient.user || updatedClient;
      console.log('🔍 updateProfile - userData:', JSON.stringify(userData, null, 2));
      
      // Map snake_case from backend to camelCase for frontend
      const mappedClient: Client = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        country: userData.country,
        profileImage: userData.profile_image || userData.avatar_url,
        createdAt: userData.created_at
      };
      
      console.log('✅ Mapped client for state:', JSON.stringify(mappedClient, null, 2));
      setClient(mappedClient);
      console.log('🔄 Client state updated');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem('clientToken');
    if (!token) throw new Error('Not authenticated');

    try {
      const response = await fetch('http://localhost:5000/api/client/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  return (
    <ClientContext.Provider value={{
      client,
      isAuthenticated,
      isLoading,
      login,
      logout,
      updateProfile,
      changePassword
    }}>
      {children}
    </ClientContext.Provider>
  );
};
