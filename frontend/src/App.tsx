import React, { useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';

import { ClientProvider } from './context/ClientContext';
import { ToastProvider } from './context/ToastContext';
import ToastRenderer from './components/ToastRenderer';

import Header from './components/Header';
import Footer from './components/Footer';
import useLocalizeDocumentAttributes from './hooks/useLocalizeDocumentAttributes';
import { AuthProvider } from './context/AuthContext';
import PageTransition from './animations/PageTransition';

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

// ─── Layout للصفحات الرئيسية (Header + Footer) ─────
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-grow">
      {children}
    </main>
    <Footer />
    <ToastRenderer />
  </div>
);

// ─── ScrollToTop ────────────────────────────────────
// يمنع المتصفح من الاحتفاظ بموضع السكرول القديم عند
// الانتقال لصفحة جديدة (خصوصاً الصفحات التي تمت زيارتها سابقاً)
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// ─── AnimatedRoutes ─────────────────────────────────
// منفصل عن App لأن useLocation يحتاج يكون داخل <Router>
const AnimatedRoutes = () => {
  const location = useLocation();

  // نستخرج key ذكي — يمنع إعادة الأنيميشن داخل sub-routes
  // مثل /client/dashboard/bookings → /client/dashboard/settings
  const getRouteKey = (pathname: string) => {
    if (pathname.startsWith('/client/dashboard')) return '/client/dashboard';
    return pathname;
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={getRouteKey(location.pathname)}>

        {/* ═══════════════════════════════════════════ */}
        {/*  Admin Routes — بدون Header/Footer         */}
        {/* ═══════════════════════════════════════════ */}
        <Route path="/admin/login" element={
          <PageTransition><AdminLogin /></PageTransition>
        } />
        <Route path="/admin/dashboard" element={
          <PageTransition><AdminDashboard /></PageTransition>
        } />
        <Route path="/admin/vendors/pending" element={
          <PageTransition><PendingVendors /></PageTransition>
        } />
        <Route path="/admin/vendors" element={
          <PageTransition><AllVendors /></PageTransition>
        } />
        <Route path="/admin/clients" element={
          <PageTransition><AllClients /></PageTransition>
        } />
        <Route path="/admin/services" element={
          <PageTransition><AllServices /></PageTransition>
        } />
        <Route path="/admin/reviews" element={
          <PageTransition><AllReviews /></PageTransition>
        } />
        <Route path="/admin/settings" element={
          <PageTransition><AdminSettings /></PageTransition>
        } />
        <Route path="/admin/permissions" element={
          <PageTransition><AdminPermissions /></PageTransition>
        } />
        <Route path="/admin/reports" element={
          <PageTransition><AdminReports /></PageTransition>
        } />

        {/* ═══════════════════════════════════════════ */}
        {/*  Vendor Routes — بدون Header/Footer        */}
        {/* ═══════════════════════════════════════════ */}
        <Route path="/vendor/login" element={
          <PageTransition><VendorLogin /></PageTransition>
        } />
        <Route path="/vendor/register" element={
          <PageTransition><VendorRegister /></PageTransition>
        } />
        <Route path="/vendor/forgot-password" element={
          <PageTransition><VendorForgotPassword /></PageTransition>
        } />
        <Route path="/vendor/dashboard" element={
          <PageTransition>
            <VendorProvider>
              <VendorDashboard />
            </VendorProvider>
          </PageTransition>
        } />

        {/* ═══════════════════════════════════════════ */}
        {/*  Main Site — مع Header/Footer              */}
        {/* ═══════════════════════════════════════════ */}
        <Route path="/" element={
          <MainLayout><PageTransition><Home /></PageTransition></MainLayout>
        } />
        <Route path="/about" element={
          <MainLayout><PageTransition><About /></PageTransition></MainLayout>
        } />
        <Route path="/categories" element={
          <MainLayout><PageTransition><Categories /></PageTransition></MainLayout>
        } />
        <Route path="/search" element={
          <MainLayout><PageTransition><Search /></PageTransition></MainLayout>
        } />
        <Route path="/profile" element={
          <MainLayout><PageTransition><Profile /></PageTransition></MainLayout>
        } />
        <Route path="/settings" element={
          <MainLayout><PageTransition><AccountSettings /></PageTransition></MainLayout>
        } />
        <Route path="/help" element={
          <MainLayout><PageTransition><Help /></PageTransition></MainLayout>
        } />
        <Route path="/login" element={
          <MainLayout><PageTransition><Login /></PageTransition></MainLayout>
        } />
        <Route path="/register" element={
          <MainLayout><PageTransition><Register /></PageTransition></MainLayout>
        } />
        <Route path="/forgot-password" element={
          <MainLayout><PageTransition><ForgotPassword /></PageTransition></MainLayout>
        } />
        <Route path="/browse-services" element={
          <MainLayout><PageTransition><BrowseServices /></PageTransition></MainLayout>
        } />
        <Route path="/create-wishlist" element={
          <MainLayout><PageTransition><CreateWishlist /></PageTransition></MainLayout>
        } />
        <Route path="/book-services" element={
          <MainLayout><PageTransition><BookServices /></PageTransition></MainLayout>
        } />
        <Route path="/manage-availability" element={
          <MainLayout><PageTransition><ManageAvailability /></PageTransition></MainLayout>
        } />
        <Route path="/client/dashboard/*" element={
          <MainLayout><PageTransition><ClientDashboard /></PageTransition></MainLayout>
        } />
        <Route path="/client/favorites" element={
          <MainLayout><PageTransition><Favorites /></PageTransition></MainLayout>
        } />
        <Route path="/planner/dashboard" element={
          <MainLayout><PageTransition><PlannerDashboard /></PageTransition></MainLayout>
        } />
        <Route path="/service/:id" element={
          <MainLayout><PageTransition variant="slide"><ServiceProfile /></PageTransition></MainLayout>
        } />
        <Route path="/vendor/:id" element={
          <MainLayout><PageTransition variant="slide"><VendorProfile /></PageTransition></MainLayout>
        } />
        <Route path="/wishlist" element={
          <MainLayout><PageTransition><Wishlist /></PageTransition></MainLayout>
        } />
        <Route path="/chat" element={
          <MainLayout><PageTransition><Chat /></PageTransition></MainLayout>
        } />
        <Route path="/notifications" element={
          <MainLayout><PageTransition><Notifications /></PageTransition></MainLayout>
        } />
        <Route path="/compare" element={
          <MainLayout><PageTransition><ClientCompare /></PageTransition></MainLayout>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// ─── App ────────────────────────────────────────────
function App() {
  const { t } = useTranslation();
  useLocalizeDocumentAttributes();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <AuthProvider>
      <ClientProvider>
        <ToastProvider>
          <Router>
            <ScrollToTop />
            <AnimatedRoutes />
          </Router>
        </ToastProvider>
      </ClientProvider>
    </AuthProvider>
  );
}

export default App;