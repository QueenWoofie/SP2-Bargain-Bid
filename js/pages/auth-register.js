import { register } from '../api/auth.js';

const form = document.getElementById('registerForm');
const btn = document.getElementById('registerBtn');
const err = document.getElementById('registerError');

function setBusy(busy) {
  btn.disabled = busy;
  btn.classList.toggle('opacity-70', busy);
  btn.textContent = busy ? 'Creating account...' : 'Create account';
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.classList.add('hidden');
  setBusy(true);

  try {
    const fd = new FormData(form);
    const body = {
      name: fd.get('name')?.toString().trim(),
      email: fd.get('email')?.toString().trim(),
      password: fd.get('password')?.toString(),
      bio: fd.get('bio')?.toString().trim() || undefined,
      avatarUrl: fd.get('avatarUrl')?.toString().trim() || undefined,
      avatarAlt: fd.get('avatarAlt')?.toString().trim() || '',
      bannerUrl: fd.get('bannerUrl')?.toString().trim() || undefined,
      bannerAlt: fd.get('bannerAlt')?.toString().trim() || '',
    };

    if (!/@stud\.noroff\.no$/i.test(body.email || '')) {
      throw new Error('Email must end with @stud.noroff.no');
    }

    await register(body);

    location.href = '/login.html';
  } catch (e) {
    console.error(e);
    err.textContent = e?.message || 'Registration failed';
    err.classList.remove('hidden');
  } finally {
    setBusy(false);
  }
});
