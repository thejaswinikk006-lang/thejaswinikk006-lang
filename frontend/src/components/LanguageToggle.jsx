import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      type="button"
      className="lang-toggle-btn"
      onClick={toggleLanguage}
      aria-label={`Switch language (${t.langToggle.en} / ${t.langToggle.kn})`}
      title={`Switch to ${language === 'en' ? 'ಕನ್ನಡ' : 'English'}`}
    >
      <Languages size={16} />
      <span>{language === 'en' ? 'EN | ಕನ್ನಡ' : 'ಕನ್ನಡ | EN'}</span>
    </button>
  );
}
