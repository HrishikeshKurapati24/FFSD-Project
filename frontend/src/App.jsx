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
import FeedbackAndModeration from './pages/admin/FeedbackAndModeration';
import PaymentVerification from './pages/admin/PaymentVerification';
import Settings from './pages/admin/Settings';
import UserManagement from './pages/admin/UserManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import CollaborationMonitoring from './pages/admin/CollaborationMonitoring';
import Login from './pages/admin/Login';
import AllCampaigns from './pages/customer/AllCampaigns';
import CampaignShopping from './pages/customer/CampaignShopping';
import Cart from './pages/customer/Cart.jsx';
import Rankings from './pages/customer/Rankings';
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
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/brand-analytics" element={<BrandAnalytics />} />
                <Route path="/admin/campaign-analytics" element={<CampaignAnalytics />} />
                <Route path="/admin/influencer-analytics" element={<InfluencerAnalytics />} />
                <Route path="/admin/feedback_and_moderation" element={<FeedbackAndModeration />} />
                <Route path='/admin/collaboration_monitoring' element={<CollaborationMonitoring />} />
                <Route path="/admin/user_management" element={<UserManagement />} />
                <Route path="/admin/customer-management" element={<CustomerManagement />} />
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin/payment_verification" element={<PaymentVerification />} />
                <Route path="/admin/settings" element={<Settings />} />
                {/* Brand Routes */}
                <Route path="/brand/home" element={<BrandDashboard />} />
                <Route path="/brand/explore" element={<BrandExplore />} />
                <Route path="/brand/profile" element={<BrandProfile />} />
                <Route path="/brand/create_campaign" element={<CreateCampaign />} />
                <Route path="/brand/recievedRequests" element={<ReceivedRequests />} />
                <Route path="/brand/:requestId1/:requestId2/transaction" element={<Transaction />} />
                <Route path="/brand/campaigns/history" element={<CampaignHistory />} />
                <Route path="/brand/influencer_profile/:influencerId" element={<InfluencerProfileView />} />
                {/* Influencer Routes */}
                <Route path="/influencer/home" element={<InfluencerDashboard />} />
                <Route path="/influencer/explore" element={<Explore />} />
                <Route path="/influencer/profile" element={<Profile />} />
                <Route path="/influencer/campaigns" element={<Campaigns />} />
                <Route path="/influencer/collab/:id" element={<CampaignDetails />} />
                <Route path="/influencer/campaign-history" element={<InfluencerCampaignHistory />} />
                <Route path="/influencer/brand_profile/:id" element={<BrandProfileView />} />
                {/*
              
              
              <Route path="/influencer/campaign-history" element={<CampaignHistory />} />
              
              
              <Route path="/influencer/brand_profile/:id" element={<BrandProfileView />} />
              <Route path="/influencer/I_brand_profile/:id" element={<BrandProfileView />} /> */}
                <Route path="/customer" element={<AllCampaigns />} />
                <Route path="/customer/campaign/:campaignId/shop" element={<CampaignShopping />} />
                <Route path="/customer/cart" element={<Cart />} />
                <Route path="/customer/rankings" element={<Rankings />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </CustomerProvider>
      </InfluencerProvider>
    </BrandProvider>
  );
}

export default App;