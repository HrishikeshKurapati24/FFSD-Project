import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BrandProvider } from './contexts/BrandContext';
import { InfluencerProvider } from './contexts/InfluencerContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { CartProvider } from './contexts/CartContext';
import LandingPage from './pages/landing/LandingPage';
import About from './pages/landing/About';
import RoleSelection from './pages/landing/RoleSelection';
import Signin from './pages/landing/Signin';
import InfluencerSignup from './pages/landing/InfluencerSignup';
import BrandSignup from './pages/landing/BrandSignup';
import CustomerSignup from './pages/landing/CustomerSignup';
import SelectPlan from './pages/subscription/SelectPlan';
import Payment from './pages/subscription/Payment';
import PaymentSuccess from './pages/subscription/PaymentSuccess';
import Manage from './pages/subscription/Manage';
import Dashboard from './pages/admin/Dashboard';
import BrandAnalytics from './pages/admin/analytics/BrandAnalytics';
import CampaignAnalytics from './pages/admin/analytics/CampaignAnalytics';
import InfluencerAnalytics from './pages/admin/analytics/InfluencerAnalytics';
import AdvancedAnalytics from './pages/admin/analytics/AdvancedAnalytics';
import FeedbackAndModeration from './pages/admin/FeedbackAndModeration';
import PaymentVerification from './pages/admin/PaymentVerification';
import Settings from './pages/admin/Settings';
import UserManagement from './pages/admin/UserManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import CustomerMonitoring from './pages/admin/CustomerMonitoring';
import CollaborationMonitoring from './pages/admin/CollaborationMonitoring';
import BrandList from './pages/admin/BrandList';
import InfluencerList from './pages/admin/InfluencerList';
import CustomerList from './pages/admin/CustomerList';
import ProductAnalytics from './pages/admin/ProductAnalytics';
import Login from './pages/admin/Login';
import AllCampaigns from './pages/customer/AllCampaigns';
import CampaignShopping from './pages/customer/CampaignShopping';
import Cart from './pages/customer/Cart.jsx';
import Rankings from './pages/customer/Rankings';
import OrderHistory from './pages/customer/OrderHistory';
import BrandDashboard from './pages/brand/Dashboard';
import BrandExplore from './pages/brand/Explore';
import BrandProfile from './pages/brand/Profile';
import CreateCampaign from './pages/brand/CreateCampaign';
import ReceivedRequests from './pages/brand/ReceivedRequests';
import Transaction from './pages/brand/Transaction';
import CampaignHistory from './pages/brand/CampaignHistory';
import InfluencerProfileView from './pages/brand/InfluencerProfileView';


import InfluencerDashboard from './pages/influencer/Dashboard';
import Explore from './pages/influencer/Explore';
import Campaigns from './pages/influencer/Campaigns';
import CampaignDetails from './pages/influencer/CampaignDetails';
import InfluencerCampaignHistory from './pages/influencer/CampaignHistory';
import Profile from './pages/influencer/Profile';
import BrandProfileView from './pages/influencer/BrandProfileView';
import NotificationCenter from './components/notifications/NotificationCenter';
import ProtectedRoute from './components/ProtectedRoute';
import UserFeedback from './pages/common/UserFeedback';
import NotFound from './pages/NotFound';
import { Navigate } from 'react-router-dom';

function App() {

  return (
    <BrandProvider>
      <InfluencerProvider>
        <CustomerProvider>
          <CartProvider>
            <BrowserRouter>
              <NotificationCenter />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/role-selection" element={<RoleSelection />} />
                <Route path="/signin" element={<Signin />} />
                <Route path="/influencer/Signup" element={<InfluencerSignup />} />
                <Route path="/brand/Signup" element={<BrandSignup />} />
                <Route path="/customer/signup" element={<CustomerSignup />} />
                <Route path="/subscription/select-plan" element={<SelectPlan />} />
                <Route path="/subscription/payment" element={<Payment />} />
                <Route path="/subscription/payment-success" element={<PaymentSuccess />} />
                <Route path="/subscription/manage" element={<Manage />} />
                <Route path="/admin" element={<Navigate replace to="/admin/login" />} />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/brand-analytics" element={<BrandAnalytics />} />
                <Route path="/admin/campaign-analytics" element={<CampaignAnalytics />} />
                <Route path="/admin/influencer-analytics" element={<InfluencerAnalytics />} />
                <Route path="/admin/advanced-analytics" element={<AdvancedAnalytics />} />
                <Route path="/admin/feedback_and_moderation" element={<FeedbackAndModeration />} />
                <Route path='/admin/collaboration_monitoring' element={<CollaborationMonitoring />} />
                <Route path="/admin/user_management" element={<UserManagement />} />
                <Route path="/admin/customer-management" element={<CustomerManagement />} />
                <Route path="/admin/customer-monitoring" element={<CustomerMonitoring />} />
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin/payment_verification" element={<PaymentVerification />} />
                <Route path="/admin/settings" element={<Settings />} />
                <Route path="/admin/brand-list" element={<BrandList />} />
                <Route path="/admin/influencer-list" element={<InfluencerList />} />
                <Route path="/admin/customer-list" element={<CustomerList />} />
                <Route path="/admin/product-analytics" element={<ProductAnalytics />} />

                {/* Brand Routes */}
                <Route path="/brand/home" element={<ProtectedRoute requiredRole="brand"><BrandDashboard /></ProtectedRoute>} />
                <Route path="/brand/explore" element={<ProtectedRoute requiredRole="brand"><BrandExplore /></ProtectedRoute>} />
                <Route path="/brand/profile" element={<ProtectedRoute requiredRole="brand"><BrandProfile /></ProtectedRoute>} />
                <Route path="/brand/create_campaign" element={<ProtectedRoute requiredRole="brand"><CreateCampaign /></ProtectedRoute>} />
                <Route path="/brand/recievedRequests" element={<ProtectedRoute requiredRole="brand"><ReceivedRequests /></ProtectedRoute>} />
                <Route path="/brand/:requestId1/:requestId2/transaction" element={<ProtectedRoute requiredRole="brand"><Transaction /></ProtectedRoute>} />
                <Route path="/brand/campaigns/history" element={<ProtectedRoute requiredRole="brand"><CampaignHistory /></ProtectedRoute>} />
                <Route path="/brand/influencer_profile/:influencerId" element={<ProtectedRoute requiredRole="brand"><InfluencerProfileView /></ProtectedRoute>} />

                {/* Influencer Routes */}
                <Route path="/influencer/home" element={<ProtectedRoute requiredRole="influencer"><InfluencerDashboard /></ProtectedRoute>} />
                <Route path="/influencer/explore" element={<ProtectedRoute requiredRole="influencer"><Explore /></ProtectedRoute>} />
                <Route path="/influencer/profile" element={<ProtectedRoute requiredRole="influencer"><Profile /></ProtectedRoute>} />
                <Route path="/influencer/campaigns" element={<ProtectedRoute requiredRole="influencer"><Campaigns /></ProtectedRoute>} />
                <Route path="/influencer/collab/:id" element={<ProtectedRoute requiredRole="influencer"><CampaignDetails /></ProtectedRoute>} />
                <Route path="/influencer/campaign-history" element={<ProtectedRoute requiredRole="influencer"><InfluencerCampaignHistory /></ProtectedRoute>} />
                <Route path="/influencer/brand_profile/:id" element={<ProtectedRoute requiredRole="influencer"><BrandProfileView /></ProtectedRoute>} />

                {/* Customer Routes */}
                <Route path="/customer" element={<AllCampaigns />} />
                <Route path="/customer/campaign/:campaignId/shop" element={<CampaignShopping />} />
                <Route path="/customer/cart" element={<ProtectedRoute requiredRole="customer"><Cart /></ProtectedRoute>} />
                <Route path="/customer/rankings" element={<ProtectedRoute requiredRole="customer"><Rankings /></ProtectedRoute>} />
                <Route path="/customer/orders" element={<ProtectedRoute requiredRole="customer"><OrderHistory /></ProtectedRoute>} />
                <Route path="/feedback" element={<UserFeedback />} />

                {/* 404 Fallback */}
                <Route path="/not-found" element={<NotFound />} />
                <Route path="*" element={<Navigate replace to="/not-found" />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </CustomerProvider>
      </InfluencerProvider>
    </BrandProvider>
  );
}

export default App;