import { getProfileByName, updateProfile, getListingsByProfile, getBidsByProfile,} from '../api/profiles.js';
import { getListing } from '../api/listings.js';
import { getProfile as getLocalProfile } from '../api/auth.js';
import { storage } from '../utils/storage.js';
import { imgTag } from "../ui/img.js";

const hero = document.getElementById('hero');
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const emailEl = document.getElementById('email');
const bioEl = document.getElementById('bio');
const creditsEl = document.getElementById('credits');
const listingsEl = document.getElementById('listings');
const listingsEmptyEl = document.getElementById('listingsEmpty');

const ownerActions = document.getElementById('ownerActions');
const editSection = document.getElementById('editSection');
const profileForm = document.getElementById('profileForm');
const editError = document.getElementById('editError');
const editToggle = document.getElementById('editToggle');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

const tabMine = document.getElementById('tabMine');
const tabBids = document.getElementById('tabBids');

function qs(name) {
    return new URL(location.href).searchParams.get(name);
}

function renderHero(bgUrl) {
    hero.style.backgroundImage = bgUrl ? `url("${bgUrl}")` : 'none';
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
}

function cardFromListing(item) {
    const imgHTML = imgTag(item?.media?.[0]?.url, {
        alt: item.title || "Listing",
        classes: "w-full h-40 object-cover rounded mb-3 bg-base-200",
    });

    const bids = item?._count?.bids ?? (Array.isArray(item?.bids) ? item.bids.length : 0);
    const top =
        Array.isArray(item?.bids) && item.bids.length
        ? Math.max(...item.bids.map((b) => b.amount))
        : 0;

    return `
        <article class="bg-white border rounded-xl shadow p-4 flex flex-col">
        <a href="/listing.html?id=${encodeURIComponent(item.id)}">
            ${imgHTML}
        </a>
        <h3 class="font-bold line-clamp-1 mb-1">${item.title || "Untitled"}</h3>
        <p class="text-sm text-neutral/80 mb-2">
            <span class="mr-2">${bids} bids</span><span>Top: ${top}</span>
        </p>
        <a href="/listing.html?id=${encodeURIComponent(item.id)}"
            class="mt-auto inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
            View
        </a>
        </article>
    `;
}

async function enrichListingsWithBids(listings) {
    const need = listings.filter(
        (l) => !Array.isArray(l?.bids) && !(typeof l?._count?.bids === 'number')
    );
    if (!need.length) return listings;

    const results = await Promise.all(
        need.map((l) => getListing(l.id, { _bids: true, _seller: true }).catch(() => null))
    );

    const byId = new Map(results.filter(Boolean).map((l) => [l.id, l]));
    return listings.map((l) => byId.get(l.id) || l);
}

function setBusy(busy) {
    if (!saveBtn) return;
    saveBtn.disabled = busy;
    saveBtn.classList.toggle('opacity-70', busy);
    saveBtn.textContent = busy ? 'Saving…' : 'Save';
}

function setActiveTab(btn) {
    [tabMine, tabBids].forEach((b) =>
        b?.classList.remove('bg-primary', 'text-white', 'border-primary')
    );
    btn?.classList.add('bg-primary', 'text-neutral/90', 'border-primary');
}

async function load() {
    const viewingName = qs('name') || getLocalProfile()?.name;
    if (!viewingName) {
        location.href = '/login.html';
        return;
    }

    try {
        const data = await getProfileByName(viewingName);
        renderHero(data?.banner?.url);
        avatar.src = data?.avatar?.url || '../img/avatar_128x128.png';
        avatar.alt = data?.avatar?.alt || `${data?.name || 'User'} avatar`;
        nameEl.textContent = data?.name || '';
        emailEl.textContent = data?.email || '';
        bioEl.textContent = data?.bio || 'No bio yet.';
        creditsEl.textContent = String(data?.credits ?? 0);

        const me = getLocalProfile();
        if (me?.name && me.name === data?.name) {
        storage.setUser({
            ...me,
            credits: data?.credits,
            avatar: data?.avatar,
            banner: data?.banner,
        });
    }

    const createdRes = await getListingsByProfile(viewingName, {
        _bids: true,
        page: 1,
        limit: 24,
    });
    const createdItems = createdRes?.data || [];

    const bidsRes = await getBidsByProfile(viewingName, {
        _listings: true,
        page: 1,
        limit: 50,
    });
    const bidRows = bidsRes?.data || [];

    const listingsFromBids = [];
    const seen = new Set();

    for (const b of bidRows) {
        const embedded = b?.listing && b.listing.id ? b.listing : null;
        if (embedded && !seen.has(embedded.id)) {
            seen.add(embedded.id);
            listingsFromBids.push(embedded);
        }
        }
    const toFetch = bidRows
        .map((b) => b?.listingId || b?.listingID || b?.listing_id)
        .filter((id) => id && !seen.has(id));

    if (toFetch.length) {
        const fetched = await Promise.all(
            toFetch.map((id) => getListing(id, { _bids: true, _seller: true }).catch(() => null))
        );
        for (const l of fetched) {
            if (l && l.id && !seen.has(l.id)) {
            seen.add(l.id);
            listingsFromBids.push(l);
            }
        }
    }

    const listingsFromBidsEnriched = await enrichListingsWithBids(listingsFromBids);

    function showCreated() {
        if (!createdItems.length) {
            listingsEmptyEl.classList.remove('hidden');
            listingsEl.innerHTML = '';
        } else {
            listingsEl.innerHTML = createdItems.map(cardFromListing).join('');
            listingsEmptyEl.classList.add('hidden');
        }
    }

    function showBidListings() {
        const items = listingsFromBidsEnriched;
        if (!items.length) {
            listingsEmptyEl.classList.remove('hidden');
            listingsEl.innerHTML = '';
        } else {
            listingsEl.innerHTML = items.map(cardFromListing).join('');
            listingsEmptyEl.classList.add('hidden');
        }
    }

    if (tabMine && tabBids) {
        tabMine.addEventListener('click', () => {
            setActiveTab(tabMine);
            showCreated();
        });
        tabBids.addEventListener('click', () => {
            setActiveTab(tabBids);
            showBidListings();
        });
        setActiveTab(tabMine);
    }

    showCreated();

    if (me?.name === data?.name) {
        ownerActions?.classList.remove('hidden');

        document.getElementById('bioInput').value = data?.bio || '';
        document.getElementById('avatarUrl').value = data?.avatar?.url || '';
        document.getElementById('avatarAlt').value = data?.avatar?.alt || '';
        document.getElementById('bannerUrl').value = data?.banner?.url || '';
        document.getElementById('bannerAlt').value = data?.banner?.alt || '';

        editToggle?.addEventListener('click', () => {
            editSection?.classList.toggle('hidden');
        });

        profileForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            editError?.classList.add('hidden');
            try {
            setBusy(true);
            const bio = document.getElementById('bioInput').value.trim();
            const avatarUrl = document.getElementById('avatarUrl').value.trim();
            const avatarAlt = document.getElementById('avatarAlt').value.trim();
            const bannerUrl = document.getElementById('bannerUrl').value.trim();
            const bannerAlt = document.getElementById('bannerAlt').value.trim();

            const body = {};
            if (bio !== undefined) body.bio = bio;
            if (avatarUrl) body.avatar = { url: avatarUrl, alt: avatarAlt || '' };
            if (bannerUrl) body.banner = { url: bannerUrl, alt: bannerAlt || '' };

            const updated = await updateProfile(me.name, body);

            bioEl.textContent = updated?.bio || bioEl.textContent;
            if (updated?.avatar?.url) {
                avatar.src = updated.avatar.url;
                avatar.alt = updated.avatar.alt || avatar.alt;
            }
            if (updated?.banner?.url) {
                renderHero(updated.banner.url);
            }

            storage.setUser({
                ...me,
                bio: updated?.bio ?? me.bio,
                avatar: updated?.avatar ?? me.avatar,
                banner: updated?.banner ?? me.banner,
                credits: updated?.credits ?? me.credits,
            });

            editSection?.classList.add('hidden');
            } catch (err) {
            console.error(err);
            if (editError) {
                editError.textContent = err?.message || 'Profile update failed';
                editError.classList.remove('hidden');
            }
            } finally {
            setBusy(false);
            }
        });

        cancelBtn?.addEventListener('click', () => {
            editSection?.classList.add('hidden');
        });
        }
    } catch (e) {
        console.error(e);
        nameEl.textContent = 'Profile not found';
        bioEl.textContent = e?.message || 'Unable to load profile.';
    }
}

load();
