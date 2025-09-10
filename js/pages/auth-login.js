import { login, createApiKey } from '../api/auth.js';
import { storage } from '../utils/storage.js';

if (storage.getToken()) {
  location.href = '/index.html';
}

const form = document.getElementById('loginForm');
const btn = document.getElementById('loginBtn');
const err = document.getElementById('loginError');

function setBusy(busy) {
  btn.disabled = busy;
  btn.classList.toggle('opacity-70', busy);
  btn.textContent = busy ? 'Signing in...' : 'Sign in';
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.classList.add('hidden');
  setBusy(true);

  try {
    const email = /** @type {HTMLInputElement} */ (document.getElementById('email')).value.trim();
    const password = /** @type {HTMLInputElement} */ (document.getElementById('password')).value;

    await login({ email, password });

    if (!storage.getApiKey()) {
      const key = await createApiKey('Auction App Key');
      if (key) storage.setApiKey(key);
    }

    location.href = '/index.html';
  } catch (e) {
    console.error(e);
    err.textContent = e?.message || 'Login failed';
    err.classList.remove('hidden');
  } finally {
    setBusy(false);
  }
});
