import { Link } from 'react-router-dom';
import {
  Bot,
  FlaskConical,
  ScanSearch,
  CloudSun,
  IndianRupee,
  Landmark,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import AgricultureIllustration from '../components/AgricultureIllustration';
import FeatureCard from '../components/FeatureCard';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();

  const featureItems = [
    {
      key: 'chatbot',
      icon: Bot,
      title: t.home.features.chatbotTitle,
      description: t.home.features.chatbotDesc,
      to: '/chatbot',
      badge: <span className="badge badge-green">Gemini AI</span>,
    },
    {
      key: 'soil',
      icon: FlaskConical,
      title: t.home.features.soilTitle,
      description: t.home.features.soilDesc,
      to: '/soil-npk',
    },
    {
      key: 'disease',
      icon: ScanSearch,
      title: t.home.features.diseaseTitle,
      description: t.home.features.diseaseDesc,
      to: '/crop-disease',
      badge: <span className="badge badge-green">Vision AI</span>,
    },
    {
      key: 'weather',
      icon: CloudSun,
      title: t.home.features.weatherTitle,
      description: t.home.features.weatherDesc,
      to: '/weather',
      badge: <span className="badge badge-green">{t.weather.liveBadge}</span>,
    },
    {
      key: 'mandi',
      icon: IndianRupee,
      title: t.home.features.mandiTitle,
      description: t.home.features.mandiDesc,
      to: '/mandi-prices',
      badge: <span className="badge badge-demo">{t.common.demoBadge}</span>,
    },
    {
      key: 'schemes',
      icon: Landmark,
      title: t.home.features.schemesTitle,
      description: t.home.features.schemesDesc,
      to: '/schemes',
    },
    {
      key: 'auth',
      icon: UserCheck,
      title: t.home.features.authTitle,
      description: t.home.features.authDesc,
      to: '/auth',
      badge: <span className="badge badge-neutral">{t.home.features.authBadge}</span>,
    },
  ];

  return (
    <div>
      {/* Welcome / Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-badge">
                <Sparkles size={16} />
                <span>{t.home.heroBadge}</span>
              </div>
              <h1 className="hero-title">{t.home.heroTitle}</h1>
              <p className="hero-subtitle">{t.home.heroSubtitle}</p>
              <div className="hero-actions">
                <Link to="/chatbot" className="btn btn-primary">
                  <Bot size={18} />
                  <span>{t.home.heroPrimaryBtn}</span>
                </Link>
                <Link to="/soil-npk" className="btn btn-secondary">
                  <FlaskConical size={18} />
                  <span>{t.home.heroSecondaryBtn}</span>
                </Link>
              </div>
            </div>

            <div className="hero-illustration-card">
              <AgricultureIllustration />
            </div>
          </div>

          <div className="stats-strip" aria-label={t.home.statsTitle}>
            {t.home.statsItems.map((item) => (
              <div key={item.label} className="stat-box">
                <div className="stat-value">{item.value}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="page-section">
        <div className="container">
          <div className="section-heading">
            <h2>{t.home.featuresTitle}</h2>
            <p>{t.home.featuresSubtitle}</p>
          </div>

          <div className="features-grid">
            {featureItems.map((item) => (
              <FeatureCard
                key={item.key}
                icon={item.icon}
                title={item.title}
                description={item.description}
                to={item.to}
                badge={item.badge}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
