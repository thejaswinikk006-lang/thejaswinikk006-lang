import { useState } from 'react';
import { CloudSun, MapPin, Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchWeather } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const CONDITION_KEYS = {
  0: 'clear',
  1: 'mostlyClear',
  2: 'partlyCloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'freezingDrizzle',
  57: 'freezingDrizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'freezingRain',
  67: 'freezingRain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snowGrains',
  80: 'rainShowers',
  81: 'rainShowers',
  82: 'rainShowers',
  85: 'snowShowers',
  86: 'snowShowers',
  95: 'thunderstorm',
  96: 'thunderstormHail',
  99: 'thunderstormHail',
};

function getCondition(code, conditions) {
  return conditions[CONDITION_KEYS[code]] || conditions.unknown;
}

function formatNumber(value, decimals = 0) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(decimals)
    : '—';
}

function formatForecastDate(date, language) {
  return new Intl.DateTimeFormat(language === 'kn' ? 'kn-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

export default function WeatherAdvisoryPage() {
  const { language, t } = useLanguage();
  const [locationInput, setLocationInput] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    const cleaned = locationInput.trim();
    if (/^\d{6}$/.test(cleaned)) {
      setError(t.weather.pinNotSupported);
      setWeather(null);
      return;
    }

    if (cleaned.length < 2) {
      setError(t.weather.locationRequired);
      setWeather(null);
      return;
    }

    setError('');
    setWeather(null);
    setLoading(true);
    try {
      const result = await fetchWeather({ location: cleaned, language });
      setWeather(result);
    } catch (requestError) {
      setError(requestError.message || t.weather.fetchError);
    } finally {
      setLoading(false);
    }
  }

  const upcomingRain = weather?.forecast
    .slice(0, 2)
    .some(
      (day) =>
        (day.precipitationProbability != null && day.precipitationProbability >= 60) ||
        (day.precipitationMm != null && day.precipitationMm >= 5)
    );
  const advisories = weather
    ? [
        weather.current.windSpeedKmh >= 20 && t.weather.adviceWind,
        upcomingRain && t.weather.adviceRain,
      ].filter(Boolean)
    : [];
  if (weather && advisories.length === 0) {
    advisories.push(t.weather.adviceGeneral);
  }

  return (
    <div>
      <PageHeader
        icon={CloudSun}
        title={t.weather.title}
        subtitle={t.weather.subtitle}
        badge={<span className="badge badge-green">{t.weather.liveBadge}</span>}
      />

      <section className="page-section">
        <div className="container">
          <AlertBanner variant="info" title={t.weather.sourceTitle}>
            {t.weather.sourceNotice}{' '}
            <a href="https://open-meteo.com/en/licence" target="_blank" rel="noreferrer">
              {t.weather.attribution}
            </a>
          </AlertBanner>

          <form className="card" onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
            {error && (
              <AlertBanner variant="error" title={t.common.errorOccurred}>
                {error}
              </AlertBanner>
            )}

            <label className="form-label" htmlFor="weather-location">
              {t.weather.locationLabel}
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                id="weather-location"
                type="text"
                className="form-input"
                style={{ flex: '1 1 260px' }}
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder={t.weather.locationPlaceholder}
                maxLength={100}
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <MapPin size={18} />
                <span>{loading ? t.weather.loading : t.weather.searchBtn}</span>
              </button>
            </div>
          </form>

          {loading && (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <LoadingSpinner text={t.weather.loadingMessage} />
            </div>
          )}

          {!loading && !weather && !error && (
            <div className="card">
              <EmptyState
                icon={CloudSun}
                title={t.weather.emptyTitle}
                description={t.weather.emptyDesc}
              />
            </div>
          )}

          {!loading && weather && (
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <h2 style={{ margin: 0 }}>
                    {[weather.location.name, weather.location.region, weather.location.country]
                      .filter(Boolean)
                      .join(', ')}
                  </h2>
                  <p
                    style={{
                      margin: '0.25rem 0 0',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {t.weather.currentConditions} · {weather.current.time} ({weather.timezone})
                  </p>
                </div>
                <span className="badge badge-green">{t.weather.liveBadge}</span>
              </div>

              <div className="stats-strip" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
                <div className="stat-box">
                  <Thermometer size={22} color="#2E7D32" style={{ margin: '0 auto 0.35rem' }} />
                  <div className="stat-value">{formatNumber(weather.current.temperatureC)} °C</div>
                  <div className="stat-label">{t.weather.temperature}</div>
                </div>
                <div className="stat-box">
                  <Droplets size={22} color="#2E7D32" style={{ margin: '0 auto 0.35rem' }} />
                  <div className="stat-value">
                    {formatNumber(weather.current.humidityPercent)} %
                  </div>
                  <div className="stat-label">{t.weather.humidity}</div>
                </div>
                <div className="stat-box">
                  <CloudRain size={22} color="#2E7D32" style={{ margin: '0 auto 0.35rem' }} />
                  <div className="stat-value">
                    {formatNumber(weather.current.precipitationMm, 1)} mm
                  </div>
                  <div className="stat-label">{t.weather.currentRainfall}</div>
                </div>
                <div className="stat-box">
                  <Wind size={22} color="#2E7D32" style={{ margin: '0 auto 0.35rem' }} />
                  <div className="stat-value">
                    {formatNumber(weather.current.windSpeedKmh, 1)} km/h
                  </div>
                  <div className="stat-label">{t.weather.windSpeed}</div>
                </div>
              </div>

              <h3>{t.weather.forecastTitle}</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
                  gap: '0.8rem',
                  marginBottom: '1.5rem',
                }}
              >
                {weather.forecast.map((day) => (
                  <article
                    className="stat-box"
                    key={day.date}
                    style={{ padding: '1rem', textAlign: 'left' }}
                  >
                    <strong>{formatForecastDate(day.date, language)}</strong>
                    <div style={{ margin: '0.45rem 0', color: 'var(--green-900)' }}>
                      {getCondition(day.weatherCode, t.weather.conditions)}
                    </div>
                    <div>
                      {formatNumber(day.highC)}° / {formatNumber(day.lowC)}° C
                    </div>
                    <div style={{ marginTop: '0.3rem', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                      {t.weather.rainChance}: {formatNumber(day.precipitationProbability)}%
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                      {t.weather.rainAmount}: {formatNumber(day.precipitationMm, 1)} mm
                    </div>
                  </article>
                ))}
              </div>

              <div
                style={{
                  background: 'var(--green-50)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  padding: '1rem',
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>
                  {t.weather.farmingNotesTitle}
                </h3>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.2rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.92rem',
                  }}
                >
                  {advisories.map((advisory) => (
                    <li key={advisory}>{advisory}</li>
                  ))}
                  <li>{t.weather.adviceOfficial}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
