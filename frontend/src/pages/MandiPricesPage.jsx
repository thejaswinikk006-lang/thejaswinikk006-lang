import { useMemo, useState } from 'react';
import { IndianRupee, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import EmptyState from '../components/EmptyState';
import { useLanguage } from '../context/LanguageContext';

const DEMO_MANDI_ROWS = [
  { id: 1, crop: 'Ragi (Finger Millet)', market: 'Mysuru APMC', state: 'Karnataka', price: '₹3,850' },
  { id: 2, crop: 'Paddy (Sona Masoori)', market: 'Raichur APMC', state: 'Karnataka', price: '₹2,420' },
  { id: 3, crop: 'Maize', market: 'Davangere APMC', state: 'Karnataka', price: '₹2,150' },
  { id: 4, crop: 'Tur / Arhar (Red Gram)', market: 'Kalaburagi APMC', state: 'Karnataka', price: '₹9,600' },
  { id: 5, crop: 'Onion', market: 'Hubballi APMC', state: 'Karnataka', price: '₹2,300' },
  { id: 6, crop: 'Tomato', market: 'Kolar APMC', state: 'Karnataka', price: '₹1,650' },
  { id: 7, crop: 'Groundnut', market: 'Chitradurga APMC', state: 'Karnataka', price: '₹6,250' },
  { id: 8, crop: 'Wheat (Sharbati)', market: 'Indore Mandi', state: 'Madhya Pradesh', price: '₹2,680' },
];

export default function MandiPricesPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_MANDI_ROWS;
    return DEMO_MANDI_ROWS.filter(
      (row) =>
        row.crop.toLowerCase().includes(q) ||
        row.market.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div>
      <PageHeader
        icon={IndianRupee}
        title={t.mandi.title}
        subtitle={t.mandi.subtitle}
        badge={<span className="badge badge-demo">{t.common.demoBadge}</span>}
      />

      <section className="page-section">
        <div className="container">
          <AlertBanner variant="warning" title={t.mandi.demoBannerTitle}>
            {t.mandi.demoBannerText}
          </AlertBanner>

          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="mandi-search">
              {t.mandi.searchLabel}
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 280px' }}>
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  id="mandi-search"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.35rem' }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.mandi.searchPlaceholder}
                />
              </div>
              {query && (
                <button type="button" className="btn btn-ghost" onClick={() => setQuery('')}>
                  {t.common.clear}
                </button>
              )}
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Search}
                title={t.mandi.emptyTitle}
                description={t.mandi.emptyDesc}
                action={
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuery('')}>
                    {t.common.clear}
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.mandi.colCrop}</th>
                    <th>{t.mandi.colMarket}</th>
                    <th>{t.mandi.colState}</th>
                    <th>{t.mandi.colPrice}</th>
                    <th>{t.mandi.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700 }}>{row.crop}</td>
                      <td>{row.market}</td>
                      <td>{row.state}</td>
                      <td style={{ fontWeight: 700, color: 'var(--green-900)' }}>{row.price}</td>
                      <td>
                        <span className="badge badge-demo">{t.common.demoBadge}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
