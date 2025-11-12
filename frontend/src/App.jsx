import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import About from './pages/landing/About';
import RoleSelection from './pages/landing/RoleSelection';
import Signin from './pages/landing/Signin';
import InfluencerSignup from './pages/InfluencerSignup';
import BrandSignup from './pages/BrandSignup';

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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;