import { Routes, Route } from 'react-router-dom';
import AnalyticsTracker from './components/AnalyticsTracker';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Ppf from './pages/Ppf/Ppf';
import LuxuryGloss from './pages/Ppf/LuxuryGloss';
import PrimeGloss from './pages/Ppf/PrimeGloss';
import FlowGloss from './pages/Ppf/FlowGloss';
import CoreGloss from './pages/Ppf/CoreGloss';
import Wrap from './pages/Wrap/Wrap';
import { NzwrapPremium, ShColors, Oracal970, Oracal651, Oracal670 } from './pages/Wrap/WrapProducts';
import Oracal670ColorPage from './pages/Wrap/Oracal670Colors';
import ShWrappingColors from './pages/Wrap/ShWrappingColors';
import FindInstaller from './pages/FindInstaller/FindInstaller';
import Company from './pages/Company/Company';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Admin/Dashboard';
import WarrantyRegistration from './pages/Warranty/WarrantyRegistration';
import WarrantyValidator from './pages/Warranty/WarrantyValidator';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Admin (without Navbar/Footer) */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Auth pages (without Footer, with Navbar) */}
        <Route path="/login" element={<><Navbar /><Login /></>} />
        <Route path="/cadastro" element={<><Navbar /><Register /></>} />

        {/* Public pages */}
        <Route path="*" element={
          <div className="app-layout">
            <AnalyticsTracker />
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/ppf" element={<Ppf />} />
                <Route path="/ppf/luxury-gloss" element={<LuxuryGloss />} />
                <Route path="/ppf/prime-gloss" element={<PrimeGloss />} />
                <Route path="/ppf/flow-gloss" element={<FlowGloss />} />
                <Route path="/ppf/core-gloss" element={<CoreGloss />} />
                <Route path="/wrap" element={<Wrap />} />
                <Route path="/wrap/nzwrap-premium" element={<NzwrapPremium />} />
                <Route path="/wrap/sh-colors" element={<ShColors />} />
                <Route path="/wrap/sh-colors/:colorCode" element={<ShWrappingColors />} />
                <Route path="/wrap/oracal-970ra" element={<Oracal970 />} />
                <Route path="/wrap/oracal-651" element={<Oracal651 />} />
                <Route path="/wrap/oracal-670ra" element={<Oracal670 />} />
                <Route path="/wrap/oracal-670ra/:colorCode" element={<Oracal670ColorPage />} />
                <Route path="/sobre" element={<Company />} />
                <Route path="/encontre-aplicador" element={<FindInstaller />} />
                <Route path="/registro-garantia" element={<WarrantyRegistration />} />
                <Route path="/validar-garantia" element={<WarrantyValidator />} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
