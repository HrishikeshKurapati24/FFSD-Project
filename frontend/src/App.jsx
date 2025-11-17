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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;