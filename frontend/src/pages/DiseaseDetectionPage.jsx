import { useState, useRef } from 'react';
import { ScanSearch, Upload, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import SpeechButton from '../components/SpeechButton';
import { analyzeCropDisease } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function DiseaseDetectionPage() {
  const { language, t } = useLanguage();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cropName, setCropName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [analysisFallback, setAnalysisFallback] = useState(false);

  function handleFileChange(file) {
    setError('');
    setAnalysis('');
    setAnalysisFallback(false);

    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Unsupported file format. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5 MB. Please upload a smaller clear photo.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setAnalysis('');
    setAnalysisFallback(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!selectedFile || loading) return;

    setLoading(true);
    setError('');
    setAnalysis('');
    setAnalysisFallback(false);

    try {
      const data = await analyzeCropDisease({
        file: selectedFile,
        cropName,
        symptoms,
        language,
      });
      setAnalysis(data.analysis);
      setAnalysisFallback(data.fallback === true);
    } catch (err) {
      setError(
        err.message ||
          'Could not reach the backend AI vision endpoint. Start the backend server and configure GEMINI_API_KEY to enable live leaf analysis.'
      );
      setAnalysisFallback(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        icon={ScanSearch}
        title={t.disease.title}
        subtitle={t.disease.subtitle}
      />

      <section className="page-section">
        <div className="container">
          <AlertBanner variant="info" title={t.disease.disclaimerTitle}>
            {t.disease.disclaimerText}
          </AlertBanner>

          <div className="two-col-layout">
            <form className="card" onSubmit={handleAnalyze}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />

              <div
                className="upload-zone"
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload size={34} color="#2E7D32" style={{ margin: '0 auto 0.65rem' }} />
                <div style={{ fontWeight: 700, color: 'var(--green-950)' }}>
                  {t.disease.uploadTitle}
                </div>
                <p style={{ margin: '0.25rem 0 0.85rem', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  {t.disease.uploadHint}
                </p>
                <span className="btn btn-secondary btn-sm">{t.disease.chooseFileBtn}</span>
              </div>

              {previewUrl && (
                <div className="preview-image-box">
                  <img src={previewUrl} alt="Uploaded crop leaf preview" />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.9rem',
                      borderTop: '1px solid var(--border-light)',
                      background: 'var(--surface-white)',
                    }}
                  >
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      {selectedFile?.name} ({Math.round((selectedFile?.size || 0) / 1024)} KB)
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 size={14} />
                      <span>{t.disease.removeFileBtn}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '1.1rem' }}>
                <label className="form-label" htmlFor="cropName">
                  {t.disease.cropInputLabel}
                </label>
                <input
                  id="cropName"
                  type="text"
                  className="form-input"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder={t.disease.cropInputPlaceholder}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="symptoms">
                  {t.disease.notesLabel}
                </label>
                <textarea
                  id="symptoms"
                  rows={3}
                  className="form-textarea"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={t.disease.notesPlaceholder}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedFile || loading}
                style={{ width: '100%' }}
              >
                <Sparkles size={18} />
                <span>{loading ? t.common.loading : t.disease.analyzeBtn}</span>
              </button>
            </form>

            <div className="card">
              {loading && (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <LoadingSpinner text={t.disease.analyzing} />
                </div>
              )}

              {!loading && error && (
                <AlertBanner variant="error" title={t.common.errorOccurred}>
                  {error}
                </AlertBanner>
              )}

              {!loading && analysis && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <h2 style={{ margin: 0 }}>
                      {analysisFallback ? t.disease.fallbackTitle : 'AI Visual Observation'}
                    </h2>
                    <SpeechButton
                      text={analysis}
                      language={language}
                      listenLabel={t.common.listen}
                      stopLabel={t.common.stopAudio}
                      unsupportedMessage={t.common.voicePlaybackUnsupported}
                      errorMessage={t.common.voicePlaybackError}
                    />
                  </div>
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      background: 'var(--green-50)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '10px',
                      padding: '1rem',
                      fontSize: '0.94rem',
                      marginTop: '0.75rem',
                    }}
                  >
                    {analysis}
                  </div>
                </div>
              )}

              {!loading && !analysis && !error && (
                <EmptyState
                  icon={ImageIcon}
                  title={t.disease.emptyTitle}
                  description={t.disease.emptyDesc}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
