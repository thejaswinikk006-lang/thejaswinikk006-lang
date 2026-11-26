import { useEffect, useState } from 'react';
import { LogOut, Save, UserRound } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  location: '',
  mainCrop: '',
  password: '',
};

export default function AuthPage() {
  const { t } = useLanguage();
  const { user, loading, error: sessionError, signIn, createAccount, saveProfile, signOut } =
    useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        mainCrop: user.mainCrop,
        password: '',
      });
    } else {
      setForm((current) => ({ ...current, password: '' }));
    }
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function clearMessages() {
    setError('');
    setStatus('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();
    setBusy(true);

    try {
      if (mode === 'register') {
        await createAccount({
          name: form.name,
          email: form.email,
          phone: form.phone,
          location: form.location,
          mainCrop: form.mainCrop,
          password: form.password,
        });
        setStatus(t.auth.accountCreated);
      } else {
        await signIn({ email: form.email, password: form.password });
        setStatus(t.auth.loginSuccess);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    clearMessages();
    setBusy(true);
    try {
      await saveProfile({
        name: form.name,
        phone: form.phone,
        location: form.location,
        mainCrop: form.mainCrop,
      });
      setStatus(t.auth.profileSaved);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    clearMessages();
    setBusy(true);
    try {
      await signOut();
      setMode('login');
      setStatus(t.auth.logoutSuccess);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const isEditingProfile = Boolean(user);

  return (
    <div>
      <PageHeader
        icon={UserRound}
        title={isEditingProfile ? t.auth.profileTitle : t.auth.title}
        subtitle={t.auth.subtitle}
      />

      <section className="page-section">
        <div className="container" style={{ maxWidth: '620px' }}>
          <div className="card">
            {sessionError && !user && (
              <AlertBanner variant="warning" title={t.auth.connectionTitle}>
                {sessionError}
              </AlertBanner>
            )}

            {error && (
              <AlertBanner variant="error" title={t.common.errorOccurred}>
                {error}
              </AlertBanner>
            )}

            {status && (
              <AlertBanner variant="success" title={t.auth.statusTitle}>
                {status}
              </AlertBanner>
            )}

            {loading ? (
              <p role="status">{t.common.loading}</p>
            ) : isEditingProfile ? (
              <>
                <div className="account-heading">
                  <div>
                    <h2>{t.auth.profileTitle}</h2>
                    <p>{t.auth.privateAccount}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSignOut}
                    disabled={busy}
                  >
                    <LogOut size={17} />
                    <span>{t.auth.logoutBtn}</span>
                  </button>
                </div>

                <form onSubmit={handleProfileSave}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="farmer-name">
                      {t.auth.nameLabel}
                    </label>
                    <input
                      id="farmer-name"
                      name="name"
                      type="text"
                      className="form-input"
                      autoComplete="name"
                      maxLength={100}
                      required
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="farmer-email">
                      {t.auth.emailLabel}
                    </label>
                    <input
                      id="farmer-email"
                      type="email"
                      className="form-input"
                      autoComplete="email"
                      value={user.email}
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="farmer-phone">
                      {t.auth.phoneLabel}
                    </label>
                    <input
                      id="farmer-phone"
                      name="phone"
                      type="tel"
                      className="form-input"
                      autoComplete="tel"
                      maxLength={30}
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="farmer-location">
                      {t.auth.locationLabel}
                    </label>
                    <input
                      id="farmer-location"
                      name="location"
                      type="text"
                      className="form-input"
                      autoComplete="address-level2"
                      maxLength={120}
                      value={form.location}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="farmer-crop">
                      {t.auth.mainCropLabel}
                    </label>
                    <input
                      id="farmer-crop"
                      name="mainCrop"
                      type="text"
                      className="form-input"
                      maxLength={80}
                      value={form.mainCrop}
                      onChange={handleChange}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    <Save size={17} />
                    <span>{busy ? t.common.loading : t.auth.saveProfile}</span>
                  </button>
                </form>
              </>
            ) : (
              <>
                <AlertBanner variant="info" title={t.auth.privacyTitle}>
                  {t.auth.privacyText}
                </AlertBanner>

                <div className="tabs-row" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'login'}
                    className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                    onClick={() => {
                      setMode('login');
                      clearMessages();
                    }}
                  >
                    {t.auth.loginTab}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'register'}
                    className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                    onClick={() => {
                      setMode('register');
                      clearMessages();
                    }}
                  >
                    {t.auth.registerTab}
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  {mode === 'register' && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="register-name">
                          {t.auth.nameLabel}
                        </label>
                        <input
                          id="register-name"
                          name="name"
                          type="text"
                          className="form-input"
                          autoComplete="name"
                          maxLength={100}
                          required
                          value={form.name}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="register-phone">
                          {t.auth.phoneLabel}
                        </label>
                        <input
                          id="register-phone"
                          name="phone"
                          type="tel"
                          className="form-input"
                          autoComplete="tel"
                          maxLength={30}
                          value={form.phone}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="register-location">
                          {t.auth.locationLabel}
                        </label>
                        <input
                          id="register-location"
                          name="location"
                          type="text"
                          className="form-input"
                          autoComplete="address-level2"
                          maxLength={120}
                          value={form.location}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="register-crop">
                          {t.auth.mainCropLabel}
                        </label>
                        <input
                          id="register-crop"
                          name="mainCrop"
                          type="text"
                          className="form-input"
                          maxLength={80}
                          value={form.mainCrop}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="register-email">
                      {t.auth.emailLabel}
                    </label>
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      className="form-input"
                      autoComplete="email"
                      maxLength={254}
                      required
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="register-password">
                      {t.auth.passwordLabel}
                    </label>
                    <input
                      id="register-password"
                      name="password"
                      type="password"
                      className="form-input"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      minLength={8}
                      maxLength={128}
                      required
                      value={form.password}
                      onChange={handleChange}
                    />
                    {mode === 'register' && (
                      <small className="form-help">{t.auth.passwordHint}</small>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={busy}
                  >
                    <UserRound size={18} />
                    <span>
                      {busy
                        ? t.common.loading
                        : mode === 'login'
                          ? t.auth.loginBtn
                          : t.auth.registerBtn}
                    </span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
