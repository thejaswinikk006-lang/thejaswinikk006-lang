import { useMemo, useState } from 'react';
import { Landmark, ExternalLink } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import { useLanguage } from '../context/LanguageContext';

const OFFICIAL_SCHEMES = [
  {
    id: 'pmkisan',
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    category: 'Income Support',
    description:
      'Direct income support scheme providing ₹6,000 per year in three installments to eligible landholding farmer families.',
    url: 'https://pmkisan.gov.in/',
  },
  {
    id: 'pmfby',
    name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
    category: 'Crop Insurance',
    description:
      'Government-sponsored crop insurance protecting farmers against non-preventable natural risks from pre-sowing to post-harvest.',
    url: 'https://pmfby.gov.in/',
  },
  {
    id: 'soil-health',
    name: 'Soil Health Card Portal',
    category: 'Soil & Inputs',
    description:
      'Provides crop-wise nutrient status and soil test card information to encourage balanced fertilizer use.',
    url: 'https://soilhealth.dac.gov.in/',
  },
  {
    id: 'enam',
    name: 'e-NAM (National Agriculture Market)',
    category: 'Market Access',
    description:
      'Pan-India electronic trading portal networking existing APMC mandis for transparent price discovery and online trade.',
    url: 'https://www.enam.gov.in/',
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC)',
    category: 'Credit & Finance',
    description:
      'Affordable short-term institutional credit for cultivation expenses, post-harvest needs, and allied activities.',
    url: 'https://www.myscheme.gov.in/schemes/kcc',
  },
  {
    id: 'pmksy',
    name: 'PMKSY (Pradhan Mantri Krishi Sinchayee Yojana)',
    category: 'Irrigation',
    description:
      'Focuses on expanding irrigation coverage ("Har Khet Ko Pani") and water-use efficiency ("Per Drop More Crop").',
    url: 'https://pmksy.gov.in/',
  },
  {
    id: 'farmer-portal',
    name: "Farmers' Portal (Ministry of Agriculture)",
    category: 'Advisory & Portal',
    description:
      'Central Government portal for seeds, fertilizers, pesticides, extension services, and state agricultural contacts.',
    url: 'https://farmer.gov.in/',
  },
];

export default function SchemesPage() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = useMemo(
    () => ['ALL', ...new Set(OFFICIAL_SCHEMES.map((s) => s.category))],
    []
  );

  const visibleSchemes = useMemo(() => {
    if (selectedCategory === 'ALL') return OFFICIAL_SCHEMES;
    return OFFICIAL_SCHEMES.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div>
      <PageHeader icon={Landmark} title={t.schemes.title} subtitle={t.schemes.subtitle} />

      <section className="page-section">
        <div className="container">
          <AlertBanner variant="info" title={t.common.disclaimerLabel}>
            {t.schemes.officialNotice}
          </AlertBanner>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${
                  selectedCategory === cat ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'ALL' ? t.schemes.categoryAll : cat}
              </button>
            ))}
          </div>

          <div className="features-grid">
            {visibleSchemes.map((scheme) => (
              <article key={scheme.id} className="feature-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-green">{scheme.category}</span>
                  <Landmark size={20} color="#2E7D32" />
                </div>
                <h3>{scheme.name}</h3>
                <p>{scheme.description}</p>
                <a
                  href={scheme.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <span>{t.common.visitOfficial}</span>
                  <ExternalLink size={15} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
