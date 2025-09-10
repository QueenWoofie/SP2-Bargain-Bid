import { listListings } from '../api/listings.js';
import { showLoading, showEmpty, showError } from '../ui/loading.js';

function card(item) {
  const img = item?.media?.[0]?.url || 'https://picsum.photos/seed/home/600/400';
  return `
    <article class="bg-white border rounded-xl shadow p-4 flex flex-col">
      <a href="/listing.html?id=${encodeURIComponent(item.id)}">
        <img src="${img}" alt="${item.title || 'Listing'}" class="w-full h-40 object-cover rounded mb-3">
      </a>
      <h3 class="font-bold line-clamp-1 mb-1">${item.title || 'Untitled'}</h3>
      <a href="/listing.html?id=${encodeURIComponent(item.id)}"
         class="mt-auto inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
        View
      </a>
    </article>
  `;
}

async function load() {
  const feed = document.getElementById('homeFeed');
  const statusEl = document.getElementById('homeStatus');
  showLoading(feed, 'Loading latest…');
  statusEl.textContent = '';

  try {
    const res = await listListings({ _active: true, _seller: true, limit: 6, page: 1 });
    const items = res?.data || [];
    if (!items.length) return showEmpty(feed, 'No active listings yet.');
    feed.innerHTML = items.map(card).join('');
  } catch (e) {
    console.error(e);
    showError(feed, e.message || 'Failed to load');
  }
}

document.addEventListener('DOMContentLoaded', load);
