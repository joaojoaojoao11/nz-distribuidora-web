import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Ppf from './pages/Ppf/Ppf';
import LuxuryGloss from './pages/Ppf/LuxuryGloss';
import Wrap from './pages/Wrap/Wrap';
import Company from './pages/Company/Company';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ppf" element={<Ppf />} />
          <Route path="/ppf/luxury-gloss" element={<LuxuryGloss />} />
          <Route path="/wrap" element={<Wrap />} />
          <Route path="/sobre" element={<Company />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
