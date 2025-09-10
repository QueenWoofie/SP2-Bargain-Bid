import { getListing, updateListing, deleteListing } from '../api/listings.js';
import { getProfile } from '../api/auth.js';
import { requireAuth } from '../utils/guard.js';
requireAuth();

const errEl = document.getElementById('editError');
const form = document.getElementById('editForm');
const btnSave = document.getElementById('saveBtn');
const btnDelete = document.getElementById('deleteBtn');

function qs(name) {
  return new URL(location.href).searchParams.get(name);
}
function setBusy(busy) {
  btnSave.disabled = busy;
  btnDelete.disabled = busy;
  btnSave.classList.toggle('opacity-70', busy);
  btnSave.textContent = busy ? 'Saving...' : 'Save changes';
}

function toMediaCSV(arr) {
  return (arr || [])
    .map((m) => m.url)
    .filter(Boolean)
    .join(', ');
}
function toMediaArray(str) {
  if (!str) return undefined;
  const urls = str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return urls.length ? urls.map((url) => ({ url, alt: '' })) : undefined;
}
function toTagsCSV(arr) {
  return (arr || []).join(', ');
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

async function init() {
  const id = qs('id');
  if (!id) {
    errEl.textContent = 'Missing listing id (?id=...)';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    errEl.classList.add('hidden');
    const data = await getListing(id, { _seller: true, _bids: true });

    const me = getProfile();
    if (!me || me.name !== data?.seller?.name) {
      errEl.textContent = 'You do not own this listing.';
      errEl.classList.remove('hidden');
      btnSave.disabled = true;
      btnDelete.disabled = true;
      return;
    }

    document.getElementById('title').value = data.title || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('tags').value = toTagsCSV(data.tags);
    document.getElementById('media').value = toMediaCSV(data.media);

    // Save
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        setBusy(true);
        const fd = new FormData(form);
        const title = fd.get('title')?.toString().trim();
        const description = fd.get('description')?.toString().trim() || undefined;
        const tags = toTagsArray(fd.get('tags')?.toString() || '');
        const media = toMediaArray(fd.get('media')?.toString() || '');

        if (!title) throw new Error('Title is required');

        const payload = {
          title,
          ...(description ? { description } : {}),
          ...(tags ? { tags } : {}),
          ...(media ? { media } : {}),
        };
        const updated = await updateListing(id, payload);
        location.href = `/listing.html?id=${encodeURIComponent(updated.id)}`;
      } catch (e) {
        console.error(e);
        errEl.textContent = e?.message || 'Update listing failed';
        errEl.classList.remove('hidden');
      } finally {
        setBusy(false);
      }
    });

    // Delete
    btnDelete.addEventListener('click', async () => {
      if (!confirm('Delete this listing? This cannot be undone.')) return;
      try {
        setBusy(true);
        await deleteListing(id);
        location.href = '/listings.html';
      } catch (e) {
        console.error(e);
        errEl.textContent = e?.message || 'Delete listing failed';
        errEl.classList.remove('hidden');
      } finally {
        setBusy(false);
      }
    });
  } catch (e) {
    console.error(e);
    errEl.textContent = e?.message || 'Failed to load listing';
    errEl.classList.remove('hidden');
  }
}

init();
