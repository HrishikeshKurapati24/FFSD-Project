import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import About from './pages/landing/About';
import RoleSelection from './pages/landing/RoleSelection';
import Signin from './pages/landing/Signin';
import InfluencerSignup from './pages/InfluencerSignup';
import BrandSignup from './pages/BrandSignup';
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




function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/influencer/Signup" element={<InfluencerSignup />} />
          <Route path="/brand/Signup" element={<BrandSignup />} />
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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;