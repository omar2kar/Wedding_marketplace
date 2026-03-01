import axios from 'axios';

// Set base URL for all axios requests
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000; // 10 second timeout

// Add request interceptor to add auth token if available
axios.interceptors.request.use(
  (config) => {
    // Add admin token for admin routes
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken && config.url?.includes('/admin')) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    
    // Add vendor token if available
    const vendorToken = localStorage.getItem('vendorToken');
    if (vendorToken && config.url?.includes('/vendor')) {
      config.headers.Authorization = `Bearer ${vendorToken}`;
    }
    
    // Add client token if available (new secure implementation)
    const clientToken = localStorage.getItem('token');
    if (clientToken && !config.url?.includes('/vendor') && !config.url?.includes('/admin')) {
      config.headers.Authorization = `Bearer ${clientToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - clearing tokens');
      // Don't clear tokens automatically to avoid login loops
    }
    return Promise.reject(error);
  }
);

export default axios;
