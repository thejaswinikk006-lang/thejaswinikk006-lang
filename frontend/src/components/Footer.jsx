import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sprout size={20} color="#A5D6A7" />
              {t.footer.aboutTitle}
            </h3>
            <p>{t.footer.aboutDesc}</p>
          </div>

          <div>
            <h3>{t.footer.quickLinks}</h3>
            <ul className="footer-links">
              <li><Link to="/">{t.nav.home}</Link></li>
              <li><Link to="/chatbot">{t.nav.chatbot}</Link></li>
              <li><Link to="/soil-npk">{t.nav.soil}</Link></li>
              <li><Link to="/crop-disease">{t.nav.disease}</Link></li>
              <li><Link to="/weather">{t.nav.weather}</Link></li>
              <li><Link to="/mandi-prices">{t.nav.mandi}</Link></li>
              <li><Link to="/schemes">{t.nav.schemes}</Link></li>
              <li><Link to="/auth">{t.nav.auth}</Link></li>
            </ul>
          </div>

          <div>
            <h3>{t.footer.techStack}</h3>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.35rem' }}>
              {t.footer.techItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {t.brandName}</span>
          <span>{t.footer.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
