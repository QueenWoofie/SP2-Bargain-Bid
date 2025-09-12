import { getListing, placeBid, deleteListing } from '../api/listings.js';
import { getProfile, getToken } from '../api/auth.js';
import { openLightbox } from '../ui/lightbox.js';
import { imgTag } from '../ui/img.js';

const errEl = document.getElementById('error');
const hero = document.getElementById('hero');
const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const description = document.getElementById('description');
const gallery = document.getElementById('gallery');
const sellerEl = document.getElementById('seller');
const endsEl = document.getElementById('ends');
const bidsCountEl = document.getElementById('bidsCount');
const topBidEl = document.getElementById('topBid');
const bidsList = document.getElementById('bidsList');
const bidForm = document.getElementById('bidForm');
const bidBtn = document.getElementById('bidBtn');
const bidAmount = document.getElementById('bidAmount');
const bidError = document.getElementById('bidError');
const bidNote = document.getElementById('bidNote');

function qs(name) {
  return new URL(location.href).searchParams.get(name);
}
function firstImage(media) {
  const url = media?.[0]?.url;
  return typeof url === 'string' && url ? url : null;
}
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || '';
  }
}
function isEnded(iso) {
  try {
    return new Date(iso).getTime() <= Date.now();
  } catch {
    return true;
  }
}
function setBidBusy(busy) {
  if (!bidBtn) return;
  bidBtn.disabled = busy;
  bidBtn.classList.toggle('opacity-70', busy);
  bidBtn.textContent = busy ? 'Placing…' : 'Place bid';
}

async function load() {
  errEl.classList.add('hidden');
  const id = qs('id');
  if (!id) {
    errEl.textContent = 'Missing listing id in URL (?id=...)';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const data = await getListing(id, { _seller: true, _bids: true });

    // HERO
    const heroUrl = firstImage(data.media);
    hero.innerHTML = imgTag(heroUrl, {
      alt: data.title || 'Listing',
      classes: 'w-full h-60 md:h-80 object-cover md:object-contain bg-white rounded',
    });
    document.querySelector('#hero img')
      ?.addEventListener('click', () => openLightbox(heroUrl || "/img/placeholder_1200x800.png", data.title || 'Listing'));
    
    // GALLERY
    const imgs = Array.isArray(data.media) ? data.media : [];
    gallery.innerHTML = imgs.map(m => `
      ${imgTag(m?.url, {
        alt: m?.alt || data.title || 'Image',
        classes: 'w-full h-24 object-cover rounded cursor-zoom-in bg-base-200',
      })}      
    `).join('');

    gallery
      .querySelectorAll('img')
      .forEach((img) =>
        img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt))
      );

    // TITLES
    title.textContent = data.title || 'Untitled';

    const sellerName = data.seller?.name || 'Unknown seller';
    const bidsCount = Array.isArray(data.bids) ? data.bids.length : 0;

    // Make seller clickable
    const sellerHtml = data.seller?.name
      ? `<a class="underline hover:no-underline"
       href="/profile.html?name=${encodeURIComponent(data.seller.name)}">${sellerName}</a>`
      : sellerName;

    subtitle.innerHTML = `${sellerHtml} • ${bidsCount} bids`;

    // DESCRIPTION
    description.textContent = data.description || 'No description.';

    // SUMMARY
    sellerEl.innerHTML = data.seller?.name
      ? `<a class="underline hover:no-underline"
       href="/profile.html?name=${encodeURIComponent(data.seller.name)}">${sellerName}</a>`
      : sellerName;

    endsEl.textContent = fmtDate(data.endsAt);
    bidsCountEl.textContent = String(bidsCount);
    const top = bidsCount ? Math.max(...data.bids.map((b) => b.amount)) : 0;
    topBidEl.textContent = String(top);

    // RECENT BIDS
    bidsList.innerHTML = (data.bids || [])
      .slice()
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, 10)
      .map((b) => {
        const displayName = b?.bidder?.name ?? b?.bidderName ?? b?.name ?? 'Bidder';

        const nameHtml =
          displayName && displayName !== 'Bidder'
            ? `<a class="underline hover:no-underline"
              href="/profile.html?name=${encodeURIComponent(displayName)}">${displayName}</a>`
            : displayName;

        return `<li class="flex justify-between">
                <span>${nameHtml}</span>
                <span>${b.amount}</span>
              </li>`;
      })
      .join('');

    // Edit/Delete — only if seller
    const me = getProfile();
    const isOwner = !!(me?.name && me.name === data?.seller?.name);
    const editBtn = document.getElementById('ownerEditBtn');
    const delBtn = document.getElementById('ownerDeleteBtn');

    if (isOwner) {
      if (editBtn) {
        editBtn.href = `/edit-listing.html?id=${encodeURIComponent(data.id)}`;
        editBtn.classList.remove('hidden');
      }
      if (delBtn) {
        delBtn.classList.remove('hidden');
        delBtn.addEventListener('click', async () => {
          if (!confirm('Delete this listing? This cannot be undone.')) return;
          try {
            await deleteListing(data.id);
            location.href = '/listings.html';
          } catch (e) {
            alert(e?.message || 'Delete failed');
          }
        });
      }
    }

    // BID FORM
    const canBid =
      getToken() && me && me.name !== (data.seller?.name || '') && !isEnded(data.endsAt);
    if (canBid && bidForm) {
      bidForm.classList.remove('hidden');
      bidNote.textContent = '';

      const min = Math.max(1, (top || 0) + 1);
      bidAmount.value = String(min);
      bidAmount.min = String(min);

      bidForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        bidError.classList.add('hidden');
        try {
          setBidBusy(true);
          const amount = Number(bidAmount.value);
          if (!Number.isFinite(amount) || amount < min) {
            throw new Error(`Bid must be at least ${min}`);
          }
          await placeBid(data.id, amount);
          location.reload();
        } catch (e) {
          console.error(e);
          bidError.textContent = e?.message || 'Bid failed';
          bidError.classList.remove('hidden');
        } finally {
          setBidBusy(false);
        }
      });
    } else {
      if (!getToken()) bidNote.textContent = 'Login to bid.';
      else if (me?.name === data.seller?.name)
        bidNote.textContent = 'You cannot bid on your own listing.';
      else if (isEnded(data.endsAt)) bidNote.textContent = 'This listing has ended.';
      else bidNote.textContent = '';
    }
  } catch (e) {
    console.error(e);
    errEl.textContent = e?.message || 'Failed to load listing';
    errEl.classList.remove('hidden');
  }
}

load();
