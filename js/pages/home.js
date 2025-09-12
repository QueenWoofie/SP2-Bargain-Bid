import { listListings } from "../api/listings.js";
import { imgTag } from "../ui/img.js";
import { showLoading, showEmpty, showError } from "../ui/loading.js";

const feed = document.getElementById("homeFeed");
const statusEl = document.getElementById("homeStatus");

function card(item) {
    const imgHTML = imgTag(item?.media?.[0]?.url, {
        alt: item.title || "Listing",
        classes: "w-full h-40 object-cover rounded mb-3 bg-base-200",
    });

    return `
        <article class="bg-white border rounded-xl shadow p-4 flex flex-col">
        <a href="/listing.html?id=${encodeURIComponent(item.id)}">
            ${imgHTML}
        </a>
        <h3 class="font-bold line-clamp-1 mb-1">${item.title || "Untitled"}</h3>
        <a href="/listing.html?id=${encodeURIComponent(item.id)}"
            class="mt-auto inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
            View
        </a>
        </article>
    `;
    }

    function byCreatedDesc(a, b) {
    const ta = new Date(a?.created || 0).getTime();
    const tb = new Date(b?.created || 0).getTime();
    return tb - ta;
    }

    function isActive(item) {
    const t = Date.parse(item?.endsAt || "");
    return Number.isFinite(t) && t > Date.now();
    }

    async function load() {
    showLoading(feed, "Loading latest…");
    statusEl.textContent = "";
    try {
        const res = await listListings({ _active: true, _seller: true, limit: 24, page: 1 });

        let items = Array.isArray(res?.data) ? res.data : [];
        items = items.filter(isActive).sort(byCreatedDesc).slice(0, 6);

        if (!items.length) return showEmpty(feed, "No active listings yet.");
        feed.innerHTML = items.map(card).join("");
    } catch (e) {
        console.error(e);
        showError(feed, e?.message || "Failed to load");
    }
}

load();