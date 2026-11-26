import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ChatbotPage from './pages/ChatbotPage';
import SoilAdvisorPage from './pages/SoilAdvisorPage';
import DiseaseDetectionPage from './pages/DiseaseDetectionPage';
import WeatherAdvisoryPage from './pages/WeatherAdvisoryPage';
import MandiPricesPage from './pages/MandiPricesPage';
import SchemesPage from './pages/SchemesPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/chatbot" element={<ChatbotPage />} />
                <Route path="/soil-npk" element={<SoilAdvisorPage />} />
                <Route path="/crop-disease" element={<DiseaseDetectionPage />} />
                <Route path="/weather" element={<WeatherAdvisoryPage />} />
                <Route path="/mandi-prices" element={<MandiPricesPage />} />
                <Route path="/schemes" element={<SchemesPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
