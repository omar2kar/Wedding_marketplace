import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ClientProvider } from './context/ClientContext';
import { ToastProvider } from './context/ToastContext';
import ToastRenderer from './components/ToastRenderer';

import Header from './components/Header';
import Footer from './components/Footer';
import useLocalizeDocumentAttributes from './hooks/useLocalizeDocumentAttributes';
import { AuthProvider } from './context/AuthContext';

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import ClientDashboard from './pages/client/ClientDashboard';
import Favorites from './pages/client/Favorites';
import ClientCompare from './pages/client/Compare';
import PlannerDashboard from './pages/planner/Dashboard';

import VendorLogin from './pages/vendor/VendorLogin';
import VendorRegister from './pages/vendor/VendorRegister';
import VendorDashboard from './pages/vendor/VendorDashboard';
import { VendorProvider } from './context/VendorContext';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingVendors from './pages/admin/PendingVendors';
import AllVendors from './pages/admin/AllVendors';
import AllClients from './pages/admin/AllClients';
import AdminReports from './pages/admin/AdminReports';
import AllServices from './pages/admin/AllServices';
import AllReviews from './pages/admin/AllReviews';
import AdminSettings from './pages/admin/AdminSettings';
import AdminPermissions from './pages/admin/AdminPermissions';
import FeaturedVendors from './pages/admin/FeaturedVendors';

import ServiceProfile from './pages/ServiceProfile';
import VendorProfile from './pages/VendorProfile';
import Wishlist from './pages/client/Wishlist';
import Search from './pages/Search';
import Profile from './pages/Profile';
import AccountSettings from './pages/AccountSettings';
import Help from './pages/Help';
import Chat from './components/Chat';
import Notifications from './components/Notifications';
import Compare from './pages/Compare';
import Categories from './pages/Categories';
import About from './pages/About';
import ForgotPassword from './pages/auth/ForgotPassword';
import VendorForgotPassword from './pages/vendor/VendorForgotPassword';
import BrowseServices from './pages/BrowseServices';
import CreateWishlist from './pages/CreateWishlist';
import BookServices from './pages/BookServices';
import ManageAvailability from './pages/ManageAvailability';

function App() {
  const { t } = useTranslation();
  useLocalizeDocumentAttributes();
  
  return (
    <AuthProvider>
      <ClientProvider>
        <ToastProvider>
          <Router>
          <Routes>
        {/* Admin Routes - No Header/Footer */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/vendors/pending" element={<PendingVendors />} />
        <Route path="/admin/vendors" element={<AllVendors />} />
        <Route path="/admin/clients" element={<AllClients />} />
        <Route path="/admin/services" element={<AllServices />} />
        <Route path="/admin/reviews" element={<AllReviews />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/permissions" element={<AdminPermissions />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        
        {/* Vendor Routes - No Header/Footer */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorRegister />} />
        <Route path="/vendor/forgot-password" element={<VendorForgotPassword />} />
        <Route path="/vendor/dashboard" element={
          <VendorProvider>
            <VendorDashboard />
          </VendorProvider>
        } />
        
        {/* Main Site Routes - With Header/Footer */}
        <Route path="/*" element={
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/search" element={<Search />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<AccountSettings />} />
                <Route path="/help" element={<Help />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/browse-services" element={<BrowseServices />} />
                <Route path="/create-wishlist" element={<CreateWishlist />} />
                <Route path="/book-services" element={<BookServices />} />
                <Route path="/manage-availability" element={<ManageAvailability />} />
                <Route path="/client/dashboard/*" element={<ClientDashboard />} />
                <Route path="/client/favorites" element={<Favorites />} />
                <Route path="/planner/dashboard" element={<PlannerDashboard />} />
                <Route path="/service/:id" element={<ServiceProfile />} />
                <Route path="/vendor/:id" element={<VendorProfile />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/compare" element={<ClientCompare />} />
              </Routes>
            </main>
            <Footer />
            <ToastRenderer />
          </div>
        } />
        </Routes>
          </Router>
        </ToastProvider>
      </ClientProvider>
    </AuthProvider>
  );
}

export default App;
