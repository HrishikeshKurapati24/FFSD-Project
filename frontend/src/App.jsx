import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import About from './pages/landing/About';
import RoleSelection from './pages/landing/RoleSelection';
import Signin from './pages/landing/Signin';
import InfluencerSignup from './pages/InfluencerSignup';
import BrandSignup from './pages/BrandSignup';
import SelectPlan from './pages/subscription/SelectPlan';
import Payment from './pages/subscription/Payment';
import PaymentSuccess from './pages/subscription/PaymentSuccess';
import Dashboard from './pages/influencer/Dashboard';
import Campaigns from './pages/influencer/Campaigns';
import CampaignDetails from './pages/influencer/CampaignDetails';
import CampaignHistory from './pages/influencer/CampaignHistory';
import Explore from './pages/influencer/Explore';
import Profile from './pages/influencer/Profile';
import BrandProfileView from './pages/influencer/BrandProfileView';

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
          <Route path="/subscription/select-plan" element={<SelectPlan />} />
          <Route path="/subscription/payment" element={<Payment />} />
          <Route path="/subscription/payment-success" element={<PaymentSuccess />} />
          {/* Influencer Routes */}
          <Route path="/influencer/home" element={<Dashboard />} />
          <Route path="/influencer/campaigns" element={<Campaigns />} />
          <Route path="/influencer/collab/:id" element={<CampaignDetails />} />
          <Route path="/influencer/campaign-history" element={<CampaignHistory />} />
          <Route path="/influencer/explore" element={<Explore />} />
          <Route path="/influencer/profile" element={<Profile />} />
          <Route path="/influencer/brand_profile/:id" element={<BrandProfileView />} />
          <Route path="/influencer/I_brand_profile/:id" element={<BrandProfileView />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;