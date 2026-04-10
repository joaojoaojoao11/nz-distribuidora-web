import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Ppf from './pages/Ppf/Ppf';
import LuxuryGloss from './pages/Ppf/LuxuryGloss';
import PrimeGloss from './pages/Ppf/PrimeGloss';
import Wrap from './pages/Wrap/Wrap';
import Company from './pages/Company/Company';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Admin/Dashboard';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
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
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/ppf" element={<Ppf />} />
                <Route path="/ppf/luxury-gloss" element={<LuxuryGloss />} />
                <Route path="/ppf/prime-gloss" element={<PrimeGloss />} />
                <Route path="/wrap" element={<Wrap />} />
                <Route path="/sobre" element={<Company />} />
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
