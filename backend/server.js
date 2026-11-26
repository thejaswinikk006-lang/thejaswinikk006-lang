import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const scryptAsync = promisify(scrypt);
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const LEGACY_GEMINI_MODEL = 'gemini-2.5-flash';
const configuredGeminiModel = process.env.GEMINI_MODEL;
const GEMINI_MODEL =
  !configuredGeminiModel || configuredGeminiModel === LEGACY_GEMINI_MODEL
    ? DEFAULT_GEMINI_MODEL
    : configuredGeminiModel;
const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

if (configuredGeminiModel === LEGACY_GEMINI_MODEL) {
  console.warn(
    `GEMINI_MODEL=${LEGACY_GEMINI_MODEL} is unavailable for this API key; using ${DEFAULT_GEMINI_MODEL}. Update backend/.env.`
  );
}

const authDatabasePath = process.env.AUTH_DB_PATH
  ? resolve(process.env.AUTH_DB_PATH)
  : fileURLToPath(new URL('./data/krishi-mitra.sqlite', import.meta.url));
mkdirSync(dirname(authDatabasePath), { recursive: true });

const authDatabase = new DatabaseSync(authDatabasePath);
authDatabase.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS farmer_users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    main_crop TEXT NOT NULL DEFAULT '',
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS farmer_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES farmer_users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS farmer_sessions_expiry ON farmer_sessions(expires_at);
`);

const SESSION_COOKIE = 'krishi_mitra_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_OPTIONS = `HttpOnly; SameSite=Lax; Path=/; ${
  process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
}`;
const allowedOrigins = [ALLOWED_ORIGIN, 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT'],
  })
);
app.use(express.json({ limit: '5mb' }));

// Memory storage for uploaded crop images (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WEBP image files are supported.'));
    }
  },
});

function getPublicFarmer(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    mainCrop: row.main_crop,
  };
}

function getCookieValue(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0) continue;
    if (cookie.slice(0, separator).trim() === name) {
      return cookie.slice(separator + 1).trim();
    }
  }
  return null;
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function setSessionCookie(res, token, expiresAt) {
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; ${SESSION_COOKIE_OPTIONS}Max-Age=${maxAgeSeconds}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; ${SESSION_COOKIE_OPTIONS}Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
}

function createFarmerSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  authDatabase.prepare('DELETE FROM farmer_sessions WHERE expires_at <= ?').run(Date.now());
  authDatabase
    .prepare('INSERT INTO farmer_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashSessionToken(token), userId, expiresAt);
  return { token, expiresAt };
}

function getFarmerFromSession(req, res) {
  const token = getCookieValue(req, SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const farmer = authDatabase
    .prepare(
      `SELECT farmer_users.id, name, email, phone, location, main_crop
       FROM farmer_sessions
       JOIN farmer_users ON farmer_users.id = farmer_sessions.user_id
       WHERE token_hash = ? AND expires_at > ?`
    )
    .get(tokenHash, Date.now());

  if (!farmer) {
    clearSessionCookie(res);
    return null;
  }

  return farmer;
}

function requireFarmerSession(req, res, next) {
  const farmer = getFarmerFromSession(req, res);
  if (!farmer) {
    return res.status(401).json({ error: 'Please sign in to access your farmer account.' });
  }
  req.farmer = farmer;
  return next();
}

async function hashPassword(password, salt = randomBytes(16)) {
  const derivedKey = await scryptAsync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return { salt: salt.toString('hex'), hash: derivedKey.toString('hex') };
}

function optionalProfileField(value, maxLength, label) {
  if (value === undefined || value === null || value === '') {
    return { value: '' };
  }
  if (typeof value !== 'string') {
    return { error: `${label} must be text.` };
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return { error: `${label} must be ${maxLength} characters or fewer.` };
  }
  return { value: trimmed };
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function getChatFallback(language) {
  if (language === 'kn') {
    return 'Gemini ಈಗ ಲಭ್ಯವಿಲ್ಲ, ಆದ್ದರಿಂದ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ AI ಉತ್ತರಿಸಿಲ್ಲ.\n\nಸುರಕ್ಷಿತ ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನ: ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮತ್ತು ಉತ್ಪನ್ನದ ಲೇಬಲ್ ಅನುಸರಿಸಿ; ಬೆಳೆ ಮತ್ತು ಪ್ರದೇಶಕ್ಕೆ ತಕ್ಕ ಸಲಹೆಗೆ ಸ್ಥಳೀಯ KVK ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ. ಖಚಿತ ಗುರುತಿಲ್ಲದೆ ಕೀಟನಾಶಕ ಅಥವಾ ಶಿಲೀಂಧ್ರನಾಶಕ ಬಳಸಬೇಡಿ.\n\nಇದು ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ನಿರ್ದಿಷ್ಟ AI ಉತ್ತರ ಅಥವಾ ಬೆಳೆ-ನಿರ್ದಿಷ್ಟ ಸಲಹೆಯಲ್ಲ.';
  }
  return 'Gemini is unavailable, so AI did not answer your question.\n\nGeneral safe guidance: follow soil-test results and product labels, ask your local KVK or agriculture officer for crop- and region-specific advice, and do not apply pesticides or fungicides without identifying the problem.\n\nThis is not an AI answer to your question or crop-specific advice.';
}

function getDiseaseFallback(language) {
  if (language === 'kn') {
    return 'Gemini ಈ ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಿಲ್ಲ.\n\nಸಾಮಾನ್ಯ ಸುರಕ್ಷಿತ ಕ್ರಮಗಳು: ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದ ಸಸ್ಯಗಳನ್ನು ಗಮನಿಸಿ, ಬಳಸಿದ ಉಪಕರಣಗಳನ್ನು ಸ್ವಚ್ಛವಾಗಿಡಿ ಮತ್ತು ಬಾಧಿತ ಸಸ್ಯಗಳಿಂದ ನೀರು ಅಥವಾ ಮಣ್ಣು ಇತರ ಸಸ್ಯಗಳಿಗೆ ಹರಡದಂತೆ ತಡೆಯಿರಿ. ರೋಗದ ಖಚಿತ ಗುರುತಿಲ್ಲದೆ ಕೀಟನಾಶಕ ಅಥವಾ ಶಿಲೀಂಧ್ರನಾಶಕ ಬಳಸಬೇಡಿ.\n\nಇದು ರೋಗನಿರ್ಣಯವಲ್ಲ. ಬೆಳೆ ಮತ್ತು ಪ್ರದೇಶಕ್ಕೆ ತಕ್ಕ ಸಲಹೆಗಾಗಿ ಸ್ಥಳೀಯ KVK ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.';
  }
  return 'Gemini did not analyze this photo.\n\nGeneral safe steps: monitor affected plants, keep tools clean, and avoid spreading water or soil from affected plants to healthy ones. Do not apply pesticides or fungicides without identifying the problem.\n\nThis is not a diagnosis. Contact your local KVK or agriculture officer for crop- and region-specific advice.';
}

async function generateGeminiContent(ai, request) {
  try {
    return await ai.models.generateContent(request);
  } catch (error) {
    if (error?.status !== 503) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return ai.models.generateContent(request);
  }
}

app.get('/api/health', (_req, res) => {
  const aiConfigured = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );
  res.json({
    status: 'ok',
    service: 'Krishi Mitra Backend',
    aiConfigured,
    weatherApiConfigured: true,
    mandiApiConfigured: false,
    farmerAccountsConfigured: true,
  });
});

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Enter your name (2 to 100 characters).' });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 128) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and no more than 128 bytes.' });
  }

  const phone = optionalProfileField(body.phone, 30, 'Phone number');
  const location = optionalProfileField(body.location, 120, 'Village or district');
  const mainCrop = optionalProfileField(body.mainCrop, 80, 'Main crop');
  const invalidField = [phone, location, mainCrop].find((field) => field.error);
  if (invalidField) {
    return res.status(400).json({ error: invalidField.error });
  }
  if (authDatabase.prepare('SELECT id FROM farmer_users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordCredentials = await hashPassword(password);
  const now = Date.now();
  let insertResult;
  try {
    insertResult = authDatabase
      .prepare(
        `INSERT INTO farmer_users
          (name, email, phone, location, main_crop, password_salt, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        email,
        phone.value,
        location.value,
        mainCrop.value,
        passwordCredentials.salt,
        passwordCredentials.hash,
        now,
        now
      );
  } catch (error) {
    if (authDatabase.prepare('SELECT id FROM farmer_users WHERE email = ?').get(email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    throw error;
  }
  const userId = Number(insertResult.lastInsertRowid);
  const farmer = authDatabase
    .prepare('SELECT id, name, email, phone, location, main_crop FROM farmer_users WHERE id = ?')
    .get(userId);
  const session = createFarmerSession(userId);

  setSessionCookie(res, session.token, session.expiresAt);
  return res.status(201).json({ user: getPublicFarmer(farmer) });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  const farmer = authDatabase
    .prepare(
      `SELECT id, name, email, phone, location, main_crop, password_salt, password_hash
       FROM farmer_users WHERE email = ?`
    )
    .get(email);
  if (!farmer) {
    await hashPassword(password, Buffer.alloc(16));
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  const credentials = await hashPassword(password, Buffer.from(farmer.password_salt, 'hex'));
  const storedHash = Buffer.from(farmer.password_hash, 'hex');
  const candidateHash = Buffer.from(credentials.hash, 'hex');
  if (storedHash.length !== candidateHash.length || !timingSafeEqual(storedHash, candidateHash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  const session = createFarmerSession(farmer.id);
  setSessionCookie(res, session.token, session.expiresAt);
  return res.json({ user: getPublicFarmer(farmer) });
}));

app.get('/api/auth/me', (req, res) => {
  const farmer = getFarmerFromSession(req, res);
  return res.json({ user: farmer ? getPublicFarmer(farmer) : null });
});

app.put('/api/auth/profile', requireFarmerSession, (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Enter your name (2 to 100 characters).' });
  }

  const phone = optionalProfileField(body.phone, 30, 'Phone number');
  const location = optionalProfileField(body.location, 120, 'Village or district');
  const mainCrop = optionalProfileField(body.mainCrop, 80, 'Main crop');
  const invalidField = [phone, location, mainCrop].find((field) => field.error);
  if (invalidField) {
    return res.status(400).json({ error: invalidField.error });
  }

  authDatabase
    .prepare(
      `UPDATE farmer_users
       SET name = ?, phone = ?, location = ?, main_crop = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(name, phone.value, location.value, mainCrop.value, Date.now(), req.farmer.id);
  const farmer = authDatabase
    .prepare('SELECT id, name, email, phone, location, main_crop FROM farmer_users WHERE id = ?')
    .get(req.farmer.id);
  return res.json({ user: getPublicFarmer(farmer) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = getCookieValue(req, SESSION_COOKIE);
  if (token) {
    authDatabase.prepare('DELETE FROM farmer_sessions WHERE token_hash = ?').run(hashSessionToken(token));
  }
  clearSessionCookie(res);
  return res.status(204).end();
});

app.get('/api/weather', async (req, res) => {
  const searchTerm = typeof req.query.location === 'string' ? req.query.location.trim() : '';
  const language = req.query.language === 'kn' ? 'kn' : 'en';

  if (/^\d{6}$/.test(searchTerm)) {
    return res.status(400).json({
      error:
        language === 'kn'
          ? 'ಈ ಹವಾಮಾನ ಸೇವೆಯಲ್ಲಿ ಪಿನ್ ಕೋಡ್ ಹುಡುಕಾಟ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಗರ ಅಥವಾ ಜಿಲ್ಲೆಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.'
          : 'PIN-code search is not supported by this weather service. Enter a city or district name.',
    });
  }

  if (searchTerm.length < 2 || searchTerm.length > 100) {
    return res.status(400).json({
      error:
        language === 'kn'
          ? 'ದಯವಿಟ್ಟು 2 ರಿಂದ 100 ಅಕ್ಷರಗಳಿರುವ ಸ್ಥಳದ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.'
          : 'Enter a location name with between 2 and 100 characters.',
    });
  }

  try {
    const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geocodingUrl.searchParams.set('name', searchTerm);
    geocodingUrl.searchParams.set('count', '5');
    geocodingUrl.searchParams.set('language', language);
    geocodingUrl.searchParams.set('format', 'json');
    geocodingUrl.searchParams.set('countryCode', 'IN');

    const geocodingResponse = await fetch(geocodingUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (!geocodingResponse.ok) {
      throw new Error(`Open-Meteo geocoding returned ${geocodingResponse.status}.`);
    }

    const geocodingData = await geocodingResponse.json();
    const place = geocodingData.results?.[0];
    if (!place) {
      return res.status(404).json({
        error:
          language === 'kn'
            ? 'ಭಾರತದಲ್ಲಿ ಈ ಸ್ಥಳ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಗರ ಅಥವಾ ಜಿಲ್ಲೆಯ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸಿ.'
            : 'No matching location found in India. Check the city or district name.',
      });
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.searchParams.set('latitude', String(place.latitude));
    forecastUrl.searchParams.set('longitude', String(place.longitude));
    forecastUrl.searchParams.set(
      'current',
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m'
    );
    forecastUrl.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum'
    );
    forecastUrl.searchParams.set('timezone', 'auto');
    forecastUrl.searchParams.set('forecast_days', '5');

    const forecastResponse = await fetch(forecastUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (!forecastResponse.ok) {
      throw new Error(`Open-Meteo forecast returned ${forecastResponse.status}.`);
    }

    const forecastData = await forecastResponse.json();
    const { current, daily } = forecastData;
    if (!current || !Array.isArray(daily?.time)) {
      throw new Error('Open-Meteo returned an incomplete forecast.');
    }

    return res.json({
      source: 'Open-Meteo',
      location: {
        name: place.name,
        region: place.admin1 || '',
        country: place.country || 'India',
      },
      timezone: forecastData.timezone,
      current: {
        time: current.time,
        temperatureC: current.temperature_2m,
        humidityPercent: current.relative_humidity_2m,
        apparentTemperatureC: current.apparent_temperature,
        precipitationMm: current.precipitation,
        weatherCode: current.weather_code,
        windSpeedKmh: current.wind_speed_10m,
      },
      forecast: daily.time.map((date, index) => ({
        date,
        weatherCode: daily.weather_code?.[index] ?? null,
        highC: daily.temperature_2m_max?.[index] ?? null,
        lowC: daily.temperature_2m_min?.[index] ?? null,
        precipitationProbability:
          daily.precipitation_probability_max?.[index] ?? null,
        precipitationMm: daily.precipitation_sum?.[index] ?? null,
      })),
    });
  } catch (error) {
    console.error('Open-Meteo weather request failed:', error);
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return res.status(timedOut ? 504 : 502).json({
      error:
        language === 'kn'
          ? 'ಹವಾಮಾನ ಸೇವೆಯನ್ನು ಈಗ ತಲುಪಲಾಗುತ್ತಿಲ್ಲ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
          : 'Live weather is temporarily unavailable. Please try again shortly.',
    });
  }
});

// AI Agriculture Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  const { message, language = 'en', history = [] } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Please enter a farming question.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.warn('Gemini chat is not configured; returning general guidance.');
    return res.json({ reply: getChatFallback(language), fallback: true });
  }

  try {
    const languageNote =
      language === 'kn'
        ? 'Respond in simple, clear Kannada (ಕನ್ನಡ) with helpful English agricultural terms in brackets where useful.'
        : 'Respond in simple, clear English suitable for Indian farmers.';

    const systemInstruction = `You are Krishi Mitra, an educational agricultural assistant for Indian farmers.
Give practical, safe, easy-to-understand guidance on crops, soil nutrition, irrigation, integrated pest management, and farming practices in India.
${languageNote}
Always remind farmers to verify chemical dosages and region-specific recommendations with local Krishi Vigyan Kendra (KVK) or agricultural officers.
Never invent live weather forecasts or live mandi prices.`;

    const recentHistory = Array.isArray(history)
      ? history
          .slice(-6)
          .filter((item) => item && typeof item.text === 'string' && !item.fallback)
          .map((item) => ({
            role: item.sender === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }],
          }))
      : [];

    const response = await generateGeminiContent(ai, {
      model: GEMINI_MODEL,
      contents: [
        ...recentHistory,
        {
          role: 'user',
          parts: [{ text: message.trim() }],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      return res.json({ reply: getChatFallback(language), fallback: true });
    }

    return res.json({ reply, fallback: false });
  } catch (error) {
    console.error('Gemini chat error:', error);
    return res.json({ reply: getChatFallback(language), fallback: true });
  }
});

// Crop Disease Detection endpoint (prepared for Gemini Vision)
app.post('/api/disease-analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a clear crop or leaf image.' });
  }

  const { cropName = '', symptoms = '', language = 'en' } = req.body || {};
  const ai = getGeminiClient();
  if (!ai) {
    console.warn('Gemini Vision is not configured; returning general guidance.');
    return res.json({ analysis: getDiseaseFallback(language), fallback: true });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const languageNote =
      language === 'kn'
        ? 'Provide the response in clear Kannada (ಕನ್ನಡ).'
        : 'Provide the response in clear, farmer-friendly English.';

    const prompt = `Examine this crop/leaf image carefully.
${cropName ? `Farmer reported crop: ${cropName}.` : ''}
${symptoms ? `Farmer notes: ${symptoms}.` : ''}
${languageNote}
1. Describe visible leaf/plant symptoms objectively. If the image is unclear or not a plant leaf, state that honestly.
2. List possible causes or diseases cautiously (never claim 100% lab certainty).
3. Suggest safe, general cultural and preventive practices.
4. Recommend consulting a local Krishi Vigyan Kendra (KVK) or agriculture extension officer before applying pesticides or fungicides.`;

    const response = await generateGeminiContent(ai, {
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.3,
      },
    });

    const analysis = response.text?.trim();
    if (!analysis) {
      return res.json({ analysis: getDiseaseFallback(language), fallback: true });
    }

    return res.json({ analysis, fallback: false });
  } catch (error) {
    console.error('Gemini disease analysis error:', error);
    return res.json({ analysis: getDiseaseFallback(language), fallback: true });
  }
});

const frontendDistPath = resolve(dirname(fileURLToPath(import.meta.url)), '../frontend/dist');
if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    return res.sendFile(resolve(frontendDistPath, 'index.html'));
  });
}

// Handle multer upload errors cleanly
app.use((err, _req, res, _next) => {
  if (res.headersSent) {
    return;
  }
  const isUploadError =
    err instanceof multer.MulterError ||
    err.message === 'Only JPG, PNG, and WEBP image files are supported.';
  const statusCode =
    isUploadError ? 400 : Number.isInteger(err.status) && err.status >= 400 && err.status < 500
      ? err.status
      : 500;
  if (statusCode >= 500) {
    console.error('Unhandled API error:', err);
  }
  return res
    .status(statusCode)
    .json({ error: statusCode < 500 ? err.message || 'Invalid request.' : 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`Krishi Mitra backend running on http://localhost:${PORT}`);
});
