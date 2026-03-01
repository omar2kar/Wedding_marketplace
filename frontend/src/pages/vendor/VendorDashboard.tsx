import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useVendor } from '../../context/VendorContext';
import type { VendorService, VendorData } from '../../context/VendorContext';
import VendorCalendar from '../../components/vendor/VendorCalendar';
import VendorReviews from '../../components/vendor/VendorReviews';
import AvailabilityManagement from '../../components/vendor/AvailabilityManagement';
import BookingsManagement from '../../components/vendor/BookingsManagement';

const VendorDashboard: React.FC = () => {
  // Welcome banner visibility
  const [showWelcome, setShowWelcome] = useState<boolean>(() => !sessionStorage.getItem('vendorWelcomeShown'));

  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('language') || 'de';
  });
  const { vendor, services, bookings, stats, isLoading, addService, updateService, deleteService, updateBookingStatus, updateVendorProfile } = useVendor();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'bookings' | 'calendar' | 'availability' | 'profile' | 'reviews' | 'reports' | 'finances' | 'messages' | 'settings'>('dashboard');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  // Profile form state
  const [profileData, setProfileData] = useState<VendorData | null>(null);

  useEffect(() => {
    if (vendor) {
      setProfileData(vendor);
    }
  }, [vendor]);

  // Apply saved language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'de';
    i18n.changeLanguage(savedLang);
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;
  }, [i18n]);
  // Bookings filter state
  const [bookingFilter, setBookingFilter] = useState<string>('');
  // Booking Details display state
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Hide welcome banner after timeout once vendor is loaded
  useEffect(() => {
    if (vendor && showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      sessionStorage.setItem('vendorWelcomeShown', 'true');
      return () => clearTimeout(timer);
    }
  }, [vendor, showWelcome]);

  // Days of the week
  const daysOfWeek = [t('Sunday'),t('Monday'),t('Tuesday'),t('Wednesday'),t('Thursday'),t('Friday'),t('Saturday')];

  // Days and Working Hours states (saved in LocalStorage)
  const [workingDays, setWorkingDays] = useState<number[]>(() => {
    const stored = localStorage.getItem('vendorWorkingDays');
    return stored ? JSON.parse(stored) as number[] : [0,1,2,3,4,5,6];
  });

  const [workingHours, setWorkingHours] = useState<{start:string,end:string}>(() => {
    const stored = localStorage.getItem('vendorWorkingHours');
    return stored ? JSON.parse(stored) as {start:string,end:string} : {start:'09:00', end:'18:00'};
  });

  const toggleDay = (idx:number) => {
    setWorkingDays(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const handleWorkingHourChange = (key:'start'|'end') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkingHours(prev => ({ ...prev, [key]: e.target.value }));
  };

  // Save Settings automatically when changed
  useEffect(() => {
    localStorage.setItem('vendorWorkingDays', JSON.stringify(workingDays));
    localStorage.setItem('vendorWorkingHours', JSON.stringify(workingHours));
    window.dispatchEvent(new Event('vendorWorkingChanged'));
  }, [workingDays, workingHours]);

  const handleSaveWorking = () => {
    localStorage.setItem('vendorWorkingDays', JSON.stringify(workingDays));
    localStorage.setItem('vendorWorkingHours', JSON.stringify(workingHours));
    alert(t('Availability settings saved'));
  };
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'Photography',
    price: '',
    images: [] as string[],
    isActive: true,
    pendingImages: undefined as File[] | undefined
  });

  const handleAddService = async () => {
    console.log('handleAddService called');
    console.log('Current newService:', newService);
    
    // Validate required fields
    if (!newService.name || !newService.description || !newService.category || !newService.price) {
      alert(t('Please fill all required fields'));
      return;
    }
    
    // Convert price to number before sending
    const numericPrice = Number(newService.price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      alert(t('Please enter a valid price'));
      return;
    }

    try {
      // First create the service
      const servicePayload = {
        name: newService.name,
        description: newService.description,
        category: newService.category,
        price: numericPrice,
        isActive: newService.isActive
      };
      
      console.log('Creating service:', servicePayload);
      
      const vendorToken = localStorage.getItem('vendorToken');
      if (!vendorToken) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('vendorToken');
        localStorage.removeItem('vendorData');
        navigate('/vendor/login');
        return;
      }

      const serviceResponse = await fetch('http://localhost:5000/api/vendor/services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vendorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(servicePayload)
      });
      
      if (!serviceResponse.ok) {
        // Handle authentication errors specifically
        if (serviceResponse.status === 401) {
          alert('Your session has expired or is invalid. Please login again.');
          localStorage.removeItem('vendorToken');
          localStorage.removeItem('vendorData');
          navigate('/vendor/login');
          return;
        }
        
        const errorText = await serviceResponse.text();
        let errorMessage = 'Service creation failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`${errorMessage}`);
      }
      
      const createdService = await serviceResponse.json();
      const serviceId = createdService.id;
      console.log('Service created with ID:', serviceId);
      
      // Upload images if any
      if (newService.pendingImages && newService.pendingImages.length > 0) {
        console.log('Uploading images for service:', serviceId);
        
        const formData = new FormData();
        newService.pendingImages.forEach((file, index) => {
          formData.append('images', file);
        });
        
        const imageResponse = await fetch(`http://localhost:5000/api/images/services/${serviceId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vendorToken}`
          },
          body: formData
        });
        
        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          console.log('Images uploaded successfully:', imageResult);
        } else {
          console.error('Failed to upload images:', await imageResponse.text());
          alert('Service created but some images failed to upload');
        }
      }
      
      alert('Service added successfully');
      
      // Reset form
      setNewService({
        name: '',
        description: '',
        category: '',
        price: '',
        images: [],
        isActive: true,
        pendingImages: undefined
      });
      
      // Refresh the page to show new service
      window.location.reload();
      
    } catch (error) {
      console.error('Error adding service:', error);
      alert(`${t('Failed to save service')}: ${error.message}`);
    }
  };

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      try {
        const files = Array.from(e.target.files);
        const uploadedImagePaths: string[] = [];
        
        // Store files temporarily for upload after service creation
        setNewService((prev) => ({ 
          ...prev, 
          pendingImages: files
        }));
        
        // Create preview URLs for immediate display
        const previewUrls = files.map(file => URL.createObjectURL(file));
        setNewService((prev) => ({ 
          ...prev, 
          images: [...prev.images, ...previewUrls]
        }));
        
        console.log('Images prepared for upload:', files.length);
        
      } catch (err) {
        console.error('Failed to prepare images', err);
        alert('حدث خطأ في تحضير الصور');
      }
    }
  };

  const handleRemoveImage = async (index: number) => {
    try {
      // Remove from local state (for preview images or uploaded images)
      setNewService((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
        pendingImages: prev.pendingImages ? prev.pendingImages.filter((_, i) => i !== index) : undefined
      }));
      
      console.log('Image removed from preview');
    } catch (error) {
      console.error('Error removing image:', error);
      alert('حدث خطأ في حذف الصورة');
    }
  };

  useEffect(() => {
    const vendorToken = localStorage.getItem('vendorToken');
    if (!vendorToken) {
      navigate('/vendor/login');
      return;
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vendor data not found</p>
          <button 
            onClick={() => navigate('/vendor/login')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Filter bookings
  const filteredBookings = bookingFilter ? bookings.filter(b => b.status === bookingFilter) : bookings;

  // Get recent bookings (last 3)
  const recentBookings = bookings
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorData');
    navigate('/vendor/login');
  };

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    // Change HTML direction for RTL/LTR
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Animated Welcome Banner */}
      {showWelcome && vendor && (
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-4 text-center shadow-lg animate-slide-down">
          <div className="container mx-auto px-4">
            <p className="text-lg font-semibold flex items-center justify-center gap-2">
              <span className="text-2xl">👋</span>
              <span>مرحباً {vendor.ownerName || vendor.businessName}!</span>
              <span className="text-xl">✨</span>
            </p>
          </div>
        </div>
      )}
      
      {/* Modern Top Navigation */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-playfair">
                  {t('Vendor Dashboard')}
                </h1>
                <p className="text-sm text-gray-500 font-medium">إدارة أعمالك بسهولة</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Vendor Info */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{vendor.businessName}</p>
                  <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                    <span>{vendor.category}</span>
                    <span className="text-yellow-500">⭐</span>
                    <span>{vendor.rating}</span>
                  </p>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {vendor.businessName?.charAt(0) || 'V'}
                </div>
              </div>
              
              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                <button 
                  onClick={() => changeLanguage('de')}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    currentLanguage === 'de' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  DE
                </button>
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    currentLanguage === 'en' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  EN
                </button>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-200"
              >
                <span className="hidden md:inline font-medium">Abmelden</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Modern Sidebar */}
          <div className="lg:w-72 w-full bg-white rounded-2xl shadow-xl h-fit flex-shrink-0 border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-6">
              <h3 className="text-white font-bold text-lg mb-1">{t('Navigation')}</h3>
              <p className="text-slate-300 text-sm">{t('Main Menu')}</p>
            </div>
            <nav className="p-4">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'dashboard' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="font-medium">{t('Dashboard')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'services' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="font-medium">{t('VendorServices')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'bookings' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{t('bookings')}</span>
                    {stats.pendingBookings > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                        {stats.pendingBookings}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'calendar' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{t('VendorCalendar')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('availability')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'availability' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="font-medium">{t('Availability Management')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'profile' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{t('profile')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'reviews' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="font-medium">{t('Reviews')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'reports' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">{t('VendorReports')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('finances')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'finances' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{t('VendorFinances')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'messages' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="font-medium">{t('VendorMessages')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'settings' 
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{t('settings')}</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-2xl p-8 text-white shadow-2xl">
                  <h1 className="text-3xl font-bold mb-2">Willkommen zurück, {vendor.businessName}!</h1>
                  <p className="text-purple-100">Hier ist eine Übersicht über Ihr Geschäft</p>
                </div>
                
                {/* Stats Cards - Unique Design */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1 - Dienstleistungen */}
                  <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-blue-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">↑ 12%</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium mb-1">Gesamte Dienstleistungen</p>
                      <p className="text-4xl font-bold text-gray-800">{stats.totalServices}</p>
                      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{width: '75%'}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 - Buchungen */}
                  <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-green-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">{stats.pendingBookings} neu</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium mb-1">Gesamte Buchungen</p>
                      <p className="text-4xl font-bold text-gray-800">{stats.totalBookings}</p>
                      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{width: '60%'}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 - Bewertung */}
                  <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-yellow-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                          <svg className="w-7 h-7 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">{stats.totalReviews} Bewertungen</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium mb-1">Durchschnittsbewertung</p>
                      <p className="text-4xl font-bold text-gray-800">{stats.averageRating}<span className="text-lg text-gray-400">/5</span></p>
                      <div className="mt-3 flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <svg key={star} className={`w-4 h-4 ${star <= stats.averageRating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card 4 - Finanzen */}
                  <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-purple-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">↑ 8%</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium mb-1">Monatliche Finanzen</p>
                      <p className="text-4xl font-bold text-gray-800">€{stats.monthlyRevenue || stats.totalRevenue}</p>
                      <p className="text-xs text-gray-400 mt-2">Gesamt: €{stats.totalRevenue}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Bookings */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Neueste Buchungen</h2>
                        <p className="text-sm text-gray-500">Letzte Aktivitäten</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('bookings')}
                        className="text-purple-600 hover:text-purple-700 text-sm font-semibold transition flex items-center gap-1"
                      >
                        <span>Alle anzeigen</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {recentBookings.length > 0 ? recentBookings.map((booking) => (
                        <div key={booking.id} className="group border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 font-bold text-sm">{booking.clientName?.charAt(0) || 'K'}</span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-800">{booking.clientName}</h3>
                                  <p className="text-xs text-gray-500">{booking.eventDate}</p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 ml-12">{booking.serviceName}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2 ${
                                booking.status === 'pending' 
                                  ? 'bg-blue-100 text-blue-700'
                                  : booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : booking.status === 'completed'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {booking.status === 'pending' ? 'Neu' : 
                                 booking.status === 'confirmed' ? 'Bestätigt' :
                                 booking.status === 'completed' ? 'Abgeschlossen' : 'Abgesagt'}
                              </span>
                              <p className="text-lg font-bold text-gray-800">€{booking.amount || booking.totalAmount}</p>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">Keine Buchungen verfügbar</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-800">Schnellaktionen</h2>
                      <p className="text-sm text-gray-500">Häufig verwendete Funktionen</p>
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          setActiveTab('services');
                          setShowAddServiceModal(true);
                        }}
                        className="w-full text-right px-4 py-3 glass bg-pink-500/20 text-white rounded-lg hover:bg-pink-500/30 transition flex items-center justify-between border border-pink-400/30"
                      >
                        <span className="text-2xl">➕</span>
                        <span>{t('Add New Service')}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTab('calendar');
                          // Add any additional calendar-related state initialization here
                        }}
                        className="w-full text-right px-4 py-3 glass border border-white/30 text-white rounded-lg hover:bg-white/10 transition flex items-center justify-between"
                      >
                        <span className="text-2xl">📅</span>
                        <span>{t('Update Availability')}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTab('profile');
                          // Add any additional profile-related state initialization here
                        }}
                        className="w-full text-right px-4 py-3 glass border border-white/30 text-white rounded-lg hover:bg-white/10 transition flex items-center justify-between"
                      >
                        <span className="text-2xl">✏️</span>
                        <span>{t('Update Profile')}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTab('reports');
                          // Add any additional reports-related state initialization here
                        }}
                        className="w-full text-right px-4 py-3 glass border border-white/30 text-white rounded-lg hover:bg-white/10 transition flex items-center justify-between"
                      >
                        <span className="text-2xl">📈</span>
                        <span>{t('View Reports')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="glass rounded-lg p-6 border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white font-playfair">{t('VendorServices')} ({services.length})</h2>
                  <button 
                    onClick={() => setShowAddServiceModal(true)}
                    className="glass bg-pink-500/20 text-white px-4 py-2 rounded-lg hover:bg-pink-500/30 transition flex items-center border border-pink-400/30"
                  >
                    <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t('Add New Service')}
                  </button>
                </div>
                
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-white">{t('No services yet')}</h3>
                    <p className="mt-1 text-sm text-white/70">{t('Start by adding your first services')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                      <div key={service.id} className="glass border border-white/20 rounded-lg p-6 hover:bg-white/10 transition">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-2">{service.name}</h3>
                            <p className="text-sm text-white/70 mb-2 line-clamp-2">{service.description}</p>
                            <span className="inline-block glass bg-white/10 text-white/80 text-xs px-2 py-1 rounded-full border border-white/20">
                              {service.category}
                            </span>
                          </div>
                          <div className="flex space-x-2 space-x-reverse">
                            <button className="text-blue-600 hover:text-blue-200 p-1 transition">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this service?')) {
                                  try {
                                    await deleteService(service.id);
                                  } catch (error) {
                                    console.error('Error deleting service:', error);
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-200 p-1 transition">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full ml-2 ${
                              service.isActive ? 'bg-green-400' : 'bg-red-400'
                            }`}></span>
                            <span className="text-sm text-white/70">
                              {service.isActive ? t('Active') : t('Inactive')}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-bold text-black dark:text-white">€{service.price}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex space-x-2 space-x-reverse">
                          <button 
                            onClick={() => {
                              setNewService({
                                name: service.name,
                                description: service.description,
                                category: service.category,
                                price: service.price.toString(),
                                images: Array.isArray(service.images) ? service.images : [],
                                isActive: service.isActive,
                                pendingImages: undefined
                              });
                              setEditingServiceId(service.id);
                              setShowAddServiceModal(true);
                              console.log('Edit service:', service.id);
                            }}
                            className="flex-1 glass bg-pink-500/20 text-white px-3 py-2 rounded-lg hover:bg-pink-500/30 transition text-sm flex items-center justify-center gap-1 border border-pink-400/30"
                          >
                            <span>{t('Edit')}</span>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await updateService(service.id, { isActive: !service.isActive });
                              } catch (error) {
                                console.error('Error updating service status:', error);
                              }
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg transition text-sm flex items-center justify-center gap-1 glass border ${
                              service.isActive 
                                ? 'bg-red-500/20 text-red-600 hover:bg-red-500/30 border-red-400/30' 
                                : 'bg-green-500/20 text-green-600 hover:bg-green-500/30 border-green-400/30'
                            }`}
                          >
                            <span>{service.isActive ? t('Deactivate') : t('Activate')}</span>
                            {service.isActive ? (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && vendor && (
              <BookingsManagement vendorId={vendor.id} />
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="glass rounded-lg p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Profile</h2>
                
                {/* Profile Image Section */}
                <div className="mb-8 flex items-center gap-6">
                  <div className="relative group">
                    {profileData?.profileImage ? (
                      <img 
                        src={profileData.profileImage.startsWith('http') ? profileData.profileImage : `http://localhost:5000${profileData.profileImage.startsWith('/') ? '' : '/'}${profileData.profileImage}`}
                        alt="Profile" 
                        className="w-28 h-28 rounded-2xl object-cover shadow-md"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <div className={`w-28 h-28 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-md ${profileData?.profileImage ? 'hidden' : ''}`}
                      style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
                      {(profileData?.businessName || 'V').charAt(0).toUpperCase()}
                    </div>
                    {/* Upload overlay */}
                    <label className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="text-center text-white">
                        <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-medium">Change</span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image must be less than 5MB');
                            return;
                          }
                          try {
                            const formData = new FormData();
                            formData.append('image', file);
                            const token = localStorage.getItem('vendorToken');
                            const res = await fetch('http://localhost:5000/api/upload-image', {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` },
                              body: formData
                            });
                            if (res.ok) {
                              const data = await res.json();
                              const imagePath = data.filePath;
                              console.log('Image uploaded to:', imagePath);
                              // Save profile_image directly to DB
                              const saveRes = await fetch('http://localhost:5000/api/vendor/profile', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ profile_image: imagePath })
                              });
                              if (saveRes.ok) {
                                setProfileData(prev => prev ? { ...prev, profileImage: imagePath } : prev);
                                alert('Profile image updated!');
                              } else {
                                alert('Image uploaded but failed to save to profile');
                              }
                            } else {
                              alert('Failed to upload image');
                            }
                          } catch (err) {
                            console.error('Upload error:', err);
                            alert('Error uploading image');
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{profileData?.businessName || 'Your Business'}</h3>
                    <p className="text-sm text-gray-500 mt-1">Click the image to upload a new profile photo</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WebP. Max 5MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Business Information - Vendor can edit freely */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                        <input
                          type="text"
                          value={profileData?.businessName || ''}
                          onChange={(e) => setProfileData(prev => prev ? { ...prev, businessName: e.target.value } : prev)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                        <input
                          type="text"
                          value={profileData?.ownerName || ''}
                          onChange={(e) => setProfileData(prev => prev ? { ...prev, ownerName: e.target.value } : prev)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                        <select
                          value={profileData?.category || ''}
                          onChange={(e) => setProfileData(prev => prev ? { ...prev, category: e.target.value } : prev)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Photography">Photography</option>
                          <option value="Videography">Videography</option>
                          <option value="Floristry">Floristry</option>
                          <option value="Venues">Venues</option>
                          <option value="Beauty">Beauty</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Cake & Sweets">Cake & Sweets</option>
                          <option value="Planning">Planning</option>
                          <option value="Car Rental">Car Rental</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                        <textarea
                          rows={4}
                          value={profileData?.description || ''}
                          onChange={(e) => setProfileData(prev => prev ? { ...prev, description: e.target.value } : prev)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="Write a short description about your company and services..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={profileData?.email || ''}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                          dir="ltr"
                        />
                        <p className="text-xs text-gray-400 mt-1">Contact admin to change your email</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={profileData?.phone || ''}
                          onChange={(e) => setProfileData(prev => prev ? { ...prev, phone: e.target.value } : prev)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={profileData?.city || ''}
                          onChange={(e) => setProfileData(prev => prev ? { ...prev, city: e.target.value } : prev)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          value={profileData?.website || ''}
                          onChange={(e) => setProfileData(prev => prev ? { ...prev, website: e.target.value } : prev)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="https://www.example.com"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                            vendor.isVerified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {vendor.isVerified ? (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Verified Account
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Pending Verification
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={async () => {
                      if (profileData) {
                        try {
                          await updateVendorProfile(profileData);
                          alert('Profile updated successfully');
                        } catch (err) {
                          console.error(err);
                          alert('Failed to update profile');
                        }
                      }
                    }}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="glass rounded-lg p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-6">Calendar & Appointment Management</h2>
                <div className="mb-6">
                  <VendorCalendar />
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  {/* Calendar View */}
                  <div className="lg:col-span-2 hidden">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">August 2025</h3>
                        <div className="flex space-x-2 space-x-reverse">
                          <button className="p-2 hover:bg-gray-100 rounded">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {daysOfWeek.map((day, idx) => (
                          <div key={day} className="p-2 text-sm font-medium text-gray-500">
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar Days */}
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                          const hasBooking = [15, 22].includes(day);
                          const isToday = day === 18;
                          
                          return (
                            <div
                              key={day}
                              className={`p-3 text-sm cursor-pointer rounded-lg transition ${
                                isToday 
                                  ? 'bg-purple-600 text-white font-bold'
                                  : hasBooking
                                  ? 'bg-green-100 text-green-800 font-medium'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Availability Settings */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Availability Settings</h3>
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium mb-3">Working Days</h4>
                        <div className="space-y-2">
                          {daysOfWeek.map((day, idx) => (
                            <label key={day} className="flex items-center">
                              <input type="checkbox" checked={workingDays.includes(idx)} onChange={() => toggleDay(idx)} className="ml-2" />
                              <span className="text-sm">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium mb-3">Working Hours</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">From</label>
                            <input type="time" value={workingHours.start} onChange={handleWorkingHourChange('start')} className="w-full px-3 py-2 border border-gray-300 rounded" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">To</label>
                            <input type="time" value={workingHours.end} onChange={handleWorkingHourChange('end')} className="w-full px-3 py-2 border border-gray-300 rounded" />
                          </div>
                        </div>
                      </div>

                      <button onClick={handleSaveWorking} className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Management Tab */}
            {activeTab === 'availability' && vendor && (
              <AvailabilityManagement vendorId={vendor.id} />
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <VendorReviews vendorId={vendor?.id} />
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="glass rounded-lg p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Reports & Statistics</h2>
                
                {/* Time Period Filter */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-4 space-x-reverse">
                    <select className="px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                    Export Report
                  </button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Bookings</p>
                        <p className="text-3xl font-bold">{stats.totalBookings}</p>
                      </div>
                      <svg className="h-8 w-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Total Finances</p>
                        <p className="text-3xl font-bold">€{stats.yearlyRevenue}</p>
                      </div>
                      <svg className="h-8 w-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Average Rating</p>
                        <p className="text-3xl font-bold">{vendor.rating}/5</p>
                      </div>
                      <svg className="h-8 w-8 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100">Number of Services</p>
                        <p className="text-3xl font-bold">{services.length}</p>
                      </div>
                      <svg className="h-8 w-8 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Charts and Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Revenue Chart */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Monthly Finances</h3>
                    <div className="h-64 flex items-end justify-between space-x-2 space-x-reverse">
                      {[
                        { month: 'Jan', amount: 2500 },
                        { month: 'Feb', amount: 3200 },
                        { month: 'Mar', amount: 2800 },
                        { month: 'Apr', amount: 4100 },
                        { month: 'May', amount: 3600 },
                        { month: 'Jun', amount: 5200 }
                      ].map((data, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div 
                            className="bg-purple-500 rounded-t w-full"
                            style={{ height: `${(data.amount / 5200) * 200}px` }}
                          ></div>
                          <div className="text-xs mt-2 text-gray-600">{data.month}</div>
                          <div className="text-xs font-medium">{data.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking Status Distribution */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Booking Status Distribution</h3>
                    <div className="space-y-4">
                      {[
                        { status: 'Completed', count: 45, color: 'bg-green-500', percentage: 60 },
                        { status: 'Confirmed', count: 18, color: 'bg-blue-500', percentage: 24 },
                        { status: 'New', count: 8, color: 'bg-yellow-500', percentage: 11 },
                        { status: 'Cancelled', count: 4, color: 'bg-red-500', percentage: 5 }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded ${item.color} ml-3`}></div>
                            <span className="text-sm">{item.status}</span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-sm font-medium">{item.count}</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Booking Acceptance Rate</p>
                          <p className="text-2xl font-bold text-green-600">94%</p>
                        </div>
                        <div className="text-green-500">
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Average Response Time</p>
                          <p className="text-2xl font-bold text-blue-600">2.5 hrs</p>
                        </div>
                        <div className="text-blue-500">
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Customer Satisfaction Rate</p>
                          <p className="text-2xl font-bold text-purple-600">98%</p>
                        </div>
                        <div className="text-purple-500">
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finances Tab */}
            {activeTab === 'finances' && (
              <div className="glass rounded-lg p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Finances</h2>
                
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-3 rounded-lg ml-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Available Finances</p>
                        <p className="text-2xl font-bold text-green-600">€12,450</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-3 rounded-lg ml-4">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Earnings This Month</p>
                        <p className="text-2xl font-bold text-blue-600">€3,200</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-3 rounded-lg ml-4">
                        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Commission Rate</p>
                        <p className="text-2xl font-bold text-purple-600">15%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Request Finances Withdrawal</h3>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Withdraw</label>
                          <input
                            type="number"
                            placeholder=""
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            dir="ltr"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimum withdrawal amount: €100</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
                          <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="">Select Withdrawal Method</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="paypal">PayPal</option>
                            <option value="wallet">E-Wallet</option>
                          </select>
                        </div>
                        <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition">
                          Request Withdrawal
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Transaction History</h3>
                    <div className="border border-gray-200 rounded-lg">
                      <div className="divide-y divide-gray-200">
                        {[
                          { type: 'earning', amount: '+€850', description: 'Wedding Photography Booking - Sarah Ahmad', date: '2025-08-15' },
                          { type: 'withdrawal', amount: '-€2000', description: 'Profit Withdrawal', date: '2025-08-10' },
                          { type: 'earning', amount: '+€1200', description: 'Engagement Photography Booking - Mohammad Ali', date: '2025-08-08' },
                          { type: 'commission', amount: '-€150', description: 'Platform Commission (15%)', date: '2025-08-08' }
                        ].map((transaction, index) => (
                          <div key={index} className="p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ml-3 ${
                                transaction.type === 'earning' ? 'bg-green-100' :
                                transaction.type === 'withdrawal' ? 'bg-blue-100' : 'bg-red-100'
                              }`}>
                                {transaction.type === 'earning' ? (
                                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                ) : transaction.type === 'withdrawal' ? (
                                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                                <p className="text-xs text-gray-500">{transaction.date}</p>
                              </div>
                            </div>
                            <div className={`text-sm font-bold ${
                              transaction.type === 'earning' ? 'text-green-600' : 
                              transaction.type === 'withdrawal' ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {transaction.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Details Modal */}
            {selectedBooking && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                  <h3 className="text-xl font-semibold mb-4">Booking Details</h3>
                  <p><strong>Client:</strong> {selectedBooking.clientName}</p>
                  <p><strong>Phone Number:</strong> {selectedBooking.clientPhone}</p>
                  <p><strong>Email:</strong> {selectedBooking.clientEmail}</p>
                  <p><strong>Company:</strong> {selectedBooking.clientCompany}</p>
                  <p><strong>Service:</strong> {selectedBooking.serviceName}</p>
                  <p><strong>Date:</strong> {selectedBooking.eventDate}</p>
                  <p><strong>Amount:</strong> €{selectedBooking.amount}</p>
                  <p className="mt-2"><strong>Notes:</strong> {selectedBooking.notes}</p>
                </div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {!['dashboard', 'services', 'bookings', 'profile', 'calendar', 'availability', 'reviews', 'reports', 'finances'].includes(activeTab) && (
              <div className="glass rounded-lg p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {activeTab === 'messages' && 'Messages & Communication'}
                  {activeTab === 'settings' && 'Settings'}
                </h2>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Under Development</h3>
                  <p className="text-gray-500">This section will be added soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-gradient-to-b from-pink-200 via-indigo-200 to-blue-400 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-300 via-indigo-200 to-blue-400 px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">{editingServiceId !== null ? 'Edit Service' : 'Add New Service'}</h3>
                  <p className="text-white/80 text-sm mt-1">Create or modify your service offering</p>
                </div>
                <button
                  onClick={() => { setShowAddServiceModal(false); setEditingServiceId(null); }}
                  className="text-white/80 hover:text-white hover:bg-white/20 transition-all p-2 rounded-full"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">

              <form onSubmit={(e) => { e.preventDefault(); handleAddService(); }} className="space-y-8">
                {/* Service Name */}
                <div className="space-y-2">
                  <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-gray-800 text-lg transition-all duration-300"
                    placeholder="Example: Wedding Photography Package"
                    required
                  />
                </div>

                {/* Service Description */}
                <div className="space-y-2">
                  <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Service Description
                  </label>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-gray-800 resize-none transition-all duration-300"
                    placeholder="Describe your service in detail. What makes it special? What's included?"
                    required
                  />
                </div>

                {/* Category and Price */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Service Category
                    </label>
                    <select
                      value={newService.category}
                      onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-gray-800 text-lg transition-all duration-300"
                    >
                      <option value="Photography">📸 Photography</option>
                      <option value="Videography">🎥 Videography</option>
                      <option value="Floristry">🌸 Floristry</option>
                      <option value="Venues">🏛️ Venues</option>
                      <option value="Beauty">💄 Beauty</option>
                      <option value="Entertainment">🎵 Entertainment</option>
                      <option value="Cake & Sweets">🎂 Cake & Sweets</option>
                      <option value="Planning">📋 Planning</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Price (EUR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-bold">€</span>
                      <input
                        type="number"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-gray-800 text-lg transition-all duration-300"
                        placeholder=""
                        min="0"
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Service Images */}
                <div className="space-y-4">
                  <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Service Images
                  </label>
                  <div className="border-3 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                      id="service-images"
                    />
                    <label htmlFor="service-images" className="cursor-pointer block">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-300 to-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-semibold text-lg mb-2">{t('Upload Service Images')}</p>
                      <p className="text-gray-500">{t('Drag and drop or click to browse')}</p>
                      <p className="text-gray-400 text-sm mt-2">PNG, JPG, GIF up to 10MB each</p>
                    </label>
                  </div>
                  {Array.isArray(newService.images) && newService.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {newService.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`service-${idx}`} className="w-full h-24 object-cover rounded-xl border-2 border-gray-200" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center">
                            <button 
                              onClick={() => handleRemoveImage(idx)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Activation Toggle */}
                <div className="bg-gradient-to-r from-pink-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-300 to-blue-400 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <label htmlFor="isActive" className="text-lg font-semibold text-gray-800 cursor-pointer">
                          Activate Service Immediately
                        </label>
                        <p className="text-gray-600 text-sm">Service will be visible to clients right away</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={newService.isActive}
                        onChange={(e) => setNewService({ ...newService, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-blue-400"></div>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-8 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowAddServiceModal(false); setEditingServiceId(null); }}
                    className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 border-2 border-gray-200 hover:border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-8 py-4 bg-gradient-to-r from-pink-400 via-indigo-300 to-blue-500 hover:from-pink-500 hover:via-indigo-400 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {editingServiceId !== null ? 'Save Changes' : 'Add Service'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;