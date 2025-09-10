const K_USER = 'auth.user';
const K_TOKEN = 'auth.token';
const K_API_KEY = 'auth.apiKey';

function read(k) {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch {
    return null;
  }
}
function write(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}
function drop(k) {
  localStorage.removeItem(k);
}

export const storage = {
  getUser: () => read(K_USER),
  setUser: (u) => write(K_USER, u),

  getToken: () => read(K_TOKEN),
  setToken: (t) => write(K_TOKEN, t),

  getApiKey: () => read(K_API_KEY),
  setApiKey: (k) => write(K_API_KEY, k),

  clearAll: () => [K_USER, K_TOKEN, K_API_KEY].forEach(drop),
};

export function authHeaders(extra = {}) {
  const token = storage.getToken();
  const apiKey = storage.getApiKey();
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (apiKey) headers['X-Noroff-API-Key'] = apiKey;
  return headers;
}
