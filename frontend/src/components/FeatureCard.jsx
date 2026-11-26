import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FeatureCard({ icon: Icon, title, description, to, badge }) {
  const { t } = useLanguage();

  return (
    <article className="feature-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="feature-icon">
          <Icon size={24} />
        </div>
        {badge}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={to} className="feature-link">
        <span>{t.common.openTool}</span>
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}
