# KrishiMitra_2.0 — AI-Powered Agriculture Website

KrishiMitra_2.0 is an engineering project built to assist Indian farmers with accessible crop guidance, soil NPK education, crop disease image upload support, live weather forecasts, demo mandi prices, verified government scheme links, and a bilingual English / Kannada (`EN | ಕನ್ನಡ`) interface.

## Project Structure

```
krishimitra-2.0/
├── .gitignore
├── render.yaml
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── robots.txt
    └── src/
        ├── components/
        ├── context/
        ├── i18n/
        ├── pages/
        ├── services/
        ├── styles/
        ├── App.jsx
        └── main.jsx
```

## Running the Project

Requires Node.js 22.13 or newer (the backend uses the built-in SQLite module).

### 1. Start the Backend (Node.js + Express + Gemini API Proxy)

```bash
cd backend
npm install
copy .env.example .env
# Edit backend/.env and add your GEMINI_API_KEY
npm run dev
```

The backend runs on `http://localhost:5000`.

### 2. Start the Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api/*` requests to `http://localhost:5000`.

## Optional Farmer Accounts

- All public farming tools work without an account. Registration and sign-in are optional.
- Farmers can create an account with their name, email, password, and optional phone, village/district, and main crop details. Signed-in farmers can view and update their own profile.
- Account records are stored in the backend's local SQLite database at `backend/data/krishi-mitra.sqlite` by default. `AUTH_DB_PATH` can point to another private location. The database is excluded from version control.
- Passwords are stored as salted scrypt hashes. Login sessions use random, server-side tokens stored only as hashes in SQLite and an HttpOnly, SameSite cookie.
- Profile details are not sent to Gemini or the weather provider. Deploy with HTTPS, protect access to the server and database backups, and keep the database on persistent private storage. This local project does not provide verified-email or password-reset flows.
- **Search indexing**: The frontend includes a descriptive page title, social metadata, and a crawler-friendly `robots.txt`. Search ranking or indexing is not guaranteed. After deploying to a public URL, submit it to Google Search Console; the repository alone is not a public website.
- **Full-stack hosting**: `render.yaml` configures Render to serve the built React frontend and Express API from one HTTPS origin, with SQLite on a persistent private disk. GitHub Pages cannot run the Express API. Render requires a paid web-service plan for the persistent disk; the Blueprint requests a 0.5 CPU / 512 MB service and a 1 GB disk. Review Render's current pricing before creating the service.
- **Deployment secrets**: The Render Blueprint prompts for `GEMINI_API_KEY`; enter it only in Render's environment settings. Never commit `.env` files or the private farmer-account database.

## Security & Data Integrity Notes

- **No API keys in frontend**: `GEMINI_API_KEY` is read exclusively in `backend/server.js`.
- **Optional farmer accounts**: Account profile and authentication routes are protected; public tools do not require login.
- **Voice accessibility**: Answers can be read aloud with browser speech synthesis. Chat voice input uses browser speech recognition; the browser provider may process microphone audio, while only recognized text is sent to the KrishiMitra_2.0 backend.
- **AI outage fallback**: Chat and crop-image analysis show clearly labeled general guidance if Gemini is unavailable. Fallback guidance is not an AI answer or a crop diagnosis.
- **Weather data**: Current conditions and five-day forecasts come from Open-Meteo. Weather searches are restricted to India; the location entered by the user is sent to Open-Meteo for geocoding and forecasts. The service is attributed under CC BY 4.0; check Open-Meteo's terms before commercial use.
- **Honest placeholders & demo labels**:
  - **Mandi Prices** are explicitly marked as `DEMO DATA` until connected to Agmarknet / e-NAM.
  - **Soil NPK Advisor** displays educational ranges with a disclaimer to verify with local KVK / Soil Health Card officers.
