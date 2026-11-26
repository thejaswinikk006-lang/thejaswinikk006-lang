import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();

  const navItems = [
    { to: '/', label: t.nav.home, end: true },
    { to: '/chatbot', label: t.nav.chatbot },
    { to: '/soil-npk', label: t.nav.soil },
    { to: '/crop-disease', label: t.nav.disease },
    { to: '/weather', label: t.nav.weather },
    { to: '/mandi-prices', label: t.nav.mandi },
    { to: '/schemes', label: t.nav.schemes },
    { to: '/auth', label: user ? t.nav.profile : t.nav.auth },
  ];

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-link" onClick={() => setMenuOpen(false)}>
          <Logo size={40} />
          <div className="brand-text">
            <span className="brand-name">{t.brandName}</span>
            <span className="brand-sub">{t.brandTagline}</span>
          </div>
        </Link>

        <nav className="nav-links" aria-label="Main Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <LanguageToggle />
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="mobile-drawer" aria-label="Mobile Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
