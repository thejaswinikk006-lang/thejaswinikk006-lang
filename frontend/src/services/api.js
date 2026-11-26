const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.code = data.code;
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE}/api/health`);
  return handleResponse(response);
}

export async function fetchWeather({ location, language }) {
  const params = new URLSearchParams({ location, language });
  const response = await fetch(`${API_BASE}/api/weather?${params}`);
  return handleResponse(response);
}

export async function sendChatMessage({ message, language, history }) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language, history }),
  });
  return handleResponse(response);
}

export async function analyzeCropDisease({ file, cropName, symptoms, language }) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('cropName', cropName);
  formData.append('symptoms', symptoms);
  formData.append('language', language);

  const response = await fetch(`${API_BASE}/api/disease-analyze`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

async function sendAuthRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}/api/auth/${path}`, {
    credentials: 'include',
    ...options,
  });
  return handleResponse(response);
}

export async function getCurrentFarmer() {
  return sendAuthRequest('me');
}

export async function registerFarmer(details) {
  return sendAuthRequest('register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  });
}

export async function loginFarmer(credentials) {
  return sendAuthRequest('login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
}

export async function updateFarmerProfile(profile) {
  return sendAuthRequest('profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}

export async function logoutFarmer() {
  return sendAuthRequest('logout', { method: 'POST' });
}
