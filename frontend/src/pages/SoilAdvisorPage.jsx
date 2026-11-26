import { useState } from 'react';
import { FlaskConical, RotateCcw, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import EmptyState from '../components/EmptyState';
import { useLanguage } from '../context/LanguageContext';

const INITIAL_FORM = {
  nitrogen: '',
  phosphorus: '',
  potassium: '',
  ph: '',
  crop: '',
  soilType: '',
};

function evaluateLevel(value, lowMax, mediumMax) {
  if (value < lowMax) return 'Low';
  if (value <= mediumMax) return 'Medium';
  return 'High';
}

function evaluatePh(ph) {
  if (ph < 5.5) return { category: 'Strongly Acidic', tip: 'Educational note: Strongly acidic soils may benefit from agricultural lime after a local soil lab check.' };
  if (ph < 6.5) return { category: 'Slightly Acidic', tip: 'Suitable for many crops such as paddy, tea, coffee, and potato depending on region.' };
  if (ph <= 7.5) return { category: 'Neutral (Ideal for Most Crops)', tip: 'Neutral soil pH generally supports balanced availability of major nutrients.' };
  if (ph <= 8.5) return { category: 'Moderately Alkaline', tip: 'Educational note: Organic matter (FYM/compost) or gypsum may be evaluated with local KVK guidance.' };
  return { category: 'Strongly Alkaline', tip: 'High alkalinity can lock micronutrients like iron and zinc; seek lab-specific reclamation advice.' };
}

export default function SoilAdvisorPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAnalyze(e) {
    e.preventDefault();
    setError('');

    const n = Number(form.nitrogen);
    const p = Number(form.phosphorus);
    const k = Number(form.potassium);
    const ph = Number(form.ph);

    if (
      form.nitrogen === '' ||
      form.phosphorus === '' ||
      form.potassium === '' ||
      form.ph === '' ||
      Number.isNaN(n) ||
      Number.isNaN(p) ||
      Number.isNaN(k) ||
      Number.isNaN(ph)
    ) {
      setError('Please enter valid numeric values for Nitrogen, Phosphorus, Potassium, and pH.');
      return;
    }

    if (n < 0 || p < 0 || k < 0) {
      setError('Nutrient values (N, P, K) cannot be negative.');
      return;
    }

    if (ph < 0 || ph > 14) {
      setError('Soil pH must be between 0 and 14.');
      return;
    }

    // Standard Indian Soil Health Card educational reference ranges (kg/ha)
    const nLevel = evaluateLevel(n, 280, 560);
    const pLevel = evaluateLevel(p, 10, 25);
    const kLevel = evaluateLevel(k, 110, 280);
    const phInfo = evaluatePh(ph);

    setResult({
      n: { value: n, level: nLevel },
      p: { value: p, level: pLevel },
      k: { value: k, level: kLevel },
      ph: { value: ph, ...phInfo },
      crop: form.crop.trim(),
      soilType: form.soilType,
    });
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    setError('');
    setResult(null);
  }

  return (
    <div>
      <PageHeader icon={FlaskConical} title={t.soil.title} subtitle={t.soil.subtitle} />

      <section className="page-section">
        <div className="container">
          <AlertBanner variant="warning" title={t.soil.disclaimerTitle}>
            {t.soil.disclaimerText}
          </AlertBanner>

          <div className="two-col-layout">
            <form className="card" onSubmit={handleAnalyze} noValidate>
              {error && (
                <AlertBanner variant="error" title={t.common.errorOccurred}>
                  {error}
                </AlertBanner>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="nitrogen">
                    {t.soil.nitrogenLabel}
                  </label>
                  <input
                    id="nitrogen"
                    name="nitrogen"
                    type="number"
                    step="any"
                    min="0"
                    className="form-input"
                    placeholder="e.g., 240"
                    value={form.nitrogen}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phosphorus">
                    {t.soil.phosphorusLabel}
                  </label>
                  <input
                    id="phosphorus"
                    name="phosphorus"
                    type="number"
                    step="any"
                    min="0"
                    className="form-input"
                    placeholder="e.g., 18"
                    value={form.phosphorus}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="potassium">
                    {t.soil.potassiumLabel}
                  </label>
                  <input
                    id="potassium"
                    name="potassium"
                    type="number"
                    step="any"
                    min="0"
                    className="form-input"
                    placeholder="e.g., 195"
                    value={form.potassium}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ph">
                    {t.soil.phLabel}
                  </label>
                  <input
                    id="ph"
                    name="ph"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    className="form-input"
                    placeholder="e.g., 6.8"
                    value={form.ph}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="crop">
                    {t.soil.cropLabel}
                  </label>
                  <input
                    id="crop"
                    name="crop"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Paddy, Ragi, Sugarcane"
                    value={form.crop}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="soilType">
                    {t.soil.soilTypeLabel}
                  </label>
                  <select
                    id="soilType"
                    name="soilType"
                    className="form-select"
                    value={form.soilType}
                    onChange={handleChange}
                  >
                    <option value="">Select soil type (optional)</option>
                    <option value="Red Soil">Red Soil</option>
                    <option value="Black Cotton Soil">Black Cotton Soil</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                    <option value="Laterite Soil">Laterite Soil</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary">
                  <FlaskConical size={18} />
                  <span>{t.soil.analyzeBtn}</span>
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleReset}>
                  <RotateCcw size={17} />
                  <span>{t.soil.resetBtn}</span>
                </button>
              </div>
            </form>

            <div className="card">
              {!result ? (
                <EmptyState
                  icon={FlaskConical}
                  title={t.soil.emptyTitle}
                  description={t.soil.emptyDesc}
                />
              ) : (
                <div>
                  <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={22} color="#2E7D32" />
                    <span>{t.soil.resultTitle}</span>
                  </h2>

                  {(result.crop || result.soilType) && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                      {result.crop && <strong>Crop: {result.crop} </strong>}
                      {result.soilType && <span>• Soil Type: {result.soilType}</span>}
                    </p>
                  )}

                  <div className="nutrient-list">
                    <div className="nutrient-item">
                      <div className="nutrient-header">
                        <span>Nitrogen (N): {result.n.value} kg/ha</span>
                        <span className="badge badge-green">{result.n.level}</span>
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>
                        General reference: &lt;280 Low, 280–560 Medium, &gt;560 High. Supports leafy vegetative growth; split doses &amp; legume rotation reduce leaching.
                      </small>
                    </div>

                    <div className="nutrient-item">
                      <div className="nutrient-header">
                        <span>Phosphorus (P): {result.p.value} kg/ha</span>
                        <span className="badge badge-green">{result.p.level}</span>
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>
                        General reference: &lt;10 Low, 10–25 Medium, &gt;25 High. Supports root development and flowering; basal placement near roots is common.
                      </small>
                    </div>

                    <div className="nutrient-item">
                      <div className="nutrient-header">
                        <span>Potassium (K): {result.k.value} kg/ha</span>
                        <span className="badge badge-green">{result.k.level}</span>
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>
                        General reference: &lt;110 Low, 110–280 Medium, &gt;280 High. Aids water regulation, disease tolerance, and grain filling.
                      </small>
                    </div>

                    <div className="nutrient-item">
                      <div className="nutrient-header">
                        <span>Soil pH: {result.ph.value}</span>
                        <span className="badge badge-demo">{result.ph.category}</span>
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>{result.ph.tip}</small>
                    </div>
                  </div>

                  <p
                    style={{
                      marginTop: '1rem',
                      marginBottom: 0,
                      fontSize: '0.86rem',
                      color: '#78350f',
                      background: 'var(--harvest-amber-bg)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--harvest-amber-border)',
                    }}
                  >
                    <strong>Note:</strong> Exact fertilizer kg/acre dosages depend on your specific crop variety, soil type, irrigation, and Soil Health Card lab protocol. Verify with your local KVK before purchase.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
