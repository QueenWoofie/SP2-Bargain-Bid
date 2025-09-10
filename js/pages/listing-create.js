import { createListing } from '../api/listings.js';
import { getToken } from '../api/auth.js';
import { storage } from '../utils/storage.js';

guardAuth();

const form = document.getElementById('createForm');
const btn = document.getElementById('createBtn');
const errEl = document.getElementById('createError');

function guardAuth() {
  if (!getToken() || !storage.getApiKey()) {
    // Not logged in or no API key
    location.href = '/login.html';
  }
}

function setBusy(busy) {
  btn.disabled = busy;
  btn.classList.toggle('opacity-70', busy);
  btn.textContent = busy ? 'Creating...' : 'Create';
}

function toMediaArray(str) {
  if (!str) return undefined;
  const urls = str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!urls.length) return undefined;
  return urls.map((url) => ({ url, alt: '' }));
}

function slugifyTag(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]+/gu, '');
}

function toTagsArray(str) {
  if (!str) return undefined;
  const tags = str
    .split(',')
    .map((s) => slugifyTag(s))
    .filter(Boolean);
  return tags.length ? tags : undefined;
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.classList.add('hidden');

  try {
    setBusy(true);

    const fd = new FormData(form);
    const title = fd.get('title')?.toString().trim();
    const description = fd.get('description')?.toString().trim() || undefined;
    const endsAtRaw = fd.get('endsAt')?.toString();
    const tags = toTagsArray(fd.get('tags')?.toString() || '');
    const media = toMediaArray(fd.get('media')?.toString() || '');

    if (!title) throw new Error('Title is required');

    const endsAt = endsAtRaw ? new Date(endsAtRaw).toISOString() : null;
    if (!endsAt || isNaN(new Date(endsAt).getTime())) {
      throw new Error('Invalid end date/time');
    }
    if (new Date(endsAt).getTime() <= Date.now()) {
      throw new Error('End date/time must be in the future');
    }

    const payload = {
      title,
      endsAt,
      ...(description ? { description } : {}),
      ...(tags ? { tags } : {}),
      ...(media ? { media } : {}),
    };
    const created = await createListing(payload);

    location.href = `/listing.html?id=${encodeURIComponent(created.id)}`;
  } catch (e) {
    console.error(e);
    errEl.textContent = e?.message || 'Create listing failed';
    errEl.classList.remove('hidden');
  } finally {
    setBusy(false);
  }
});
