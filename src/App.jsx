import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import SellerDashboard from './pages/SellerDashboard';
import SellerOnboarding from './pages/SellerOnboarding';
import SellerStore from './pages/SellerStore';
import VerifiedSellers from './pages/VerifiedSellers';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Wishlist from './pages/Wishlist';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ShippingPolicy from './pages/ShippingPolicy';
import RefundPolicy from './pages/RefundPolicy';
import SellerPolicy from './pages/SellerPolicy';
import FAQ from './pages/FAQ';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import CareGuides from './pages/CareGuides';
import BlogDetail from './pages/BlogDetail';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import GstManagement from './pages/GstManagement';
import SuperAdminShippingFees from './pages/SuperAdminShippingFees';
import Success from './pages/Success';
import Failure from './pages/Failure';
import MyOrders from './pages/MyOrders';
import OrderTracking from './pages/OrderTracking';
import TrackOrder from './pages/TrackOrder';
import Competition from './pages/Competition';
import RequireAuth from './components/RequireAuth';
import ScrollToTop from './components/ScrollToTop';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from './utils/analytics';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { OrderProvider } from './context/OrderContext';

/** Fires Meta Pixel PageView + PostHog $pageview on every SPA navigation */
function NavigationTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(window.location.href);
  }, [location.pathname, location.search]);
  return null;
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
      <NotificationProvider>
      <WishlistProvider>
        <ToastProvider>
        <CartProvider>
        <OrderProvider>
          <BrowserRouter>
            <NavigationTracker />
            <ScrollToTop />
            <Routes>
              {/* Buyer Storefront (Uses Navbar/Footer layout) */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="shop/:category?" element={<Shop />} />
                <Route path="product/:slug" element={<ProductDetails />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="store/:sellerName" element={<SellerStore />} />
                <Route path="sellers" element={<VerifiedSellers />} />
                <Route path="terms" element={<Terms />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="shipping-policy" element={<ShippingPolicy />} />
                <Route path="refund-policy" element={<RefundPolicy />} />
                <Route path="seller-policy" element={<SellerPolicy />} />
                <Route path="faq" element={<FAQ />} />
                <Route path="profile" element={<Profile />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="guides" element={<CareGuides />} />
                <Route path="blog/:slug" element={<BlogDetail />} />
                <Route path="checkout/success" element={<Success />} />
                <Route path="checkout/failure" element={<Failure />} />
                <Route path="orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
                <Route path="orders/:id" element={<RequireAuth><OrderTracking /></RequireAuth>} />
                <Route path="track" element={<TrackOrder />} />
                <Route path="competition" element={<Competition />} />
              </Route>
              
              {/* Auth Portals (Standalone) */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Seller Dashboard & Onboarding (Standalone) */}
              <Route path="/seller/onboarding" element={<SellerOnboarding />} />
              <Route path="/seller/dashboard" element={<SellerDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/gst" element={<GstManagement />} />
              <Route path="/super-admin/shipping-fees" element={<SuperAdminShippingFees />} />
            </Routes>
          </BrowserRouter>
        </OrderProvider>
        </CartProvider>
        </ToastProvider>
      </WishlistProvider>
      </NotificationProvider>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
