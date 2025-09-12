import { listListings, searchListings } from "../api/listings.js";
import { imgTag } from "../ui/img.js";
import { showLoading, showEmpty, showError } from "../ui/loading.js";

const feed = document.getElementById("feed");
const statusEl = document.getElementById("status");
const errEl = document.getElementById("error");
const form = document.getElementById("filters");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

const u = new URL(location.href);

function getInt(name, fallback) {
  const v = parseInt(u.searchParams.get(name) || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}
function setParam(name, val) {
  if (val === undefined || val === null || val === "") u.searchParams.delete(name);
  else u.searchParams.set(name, String(val));
}
function getParamsFromUI() {
  const q = document.getElementById("q").value.trim();
  const sort = document.getElementById("sort").value;
  const _active = document.getElementById("_active").checked;
  return { q, sort, _active };
}
function populateUIFromParams() {
  document.getElementById("q").value = u.searchParams.get("q") || "";
  document.getElementById("sort").value = u.searchParams.get("sort") || "";
  document.getElementById("_active").checked =
    (u.searchParams.get("_active") ?? "true") !== "false";
}

function isActive(item) {
  const t = Date.parse(item?.endsAt || "");
  return Number.isFinite(t) && t > Date.now();
}

function timeLeft(iso) {
  const now = Date.now();
  const end = new Date(iso).getTime();
  const ms = end - now;
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

function firstImage(media) {
  const m = Array.isArray(media) ? media : [];
  const url = m[0]?.url;
  return typeof url === "string" && url.trim() ? url : null;
}

function slugifyTag(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]+/gu, "");
}

function parseHashtag(q) {
  if (!q) return null;
  const m = q.match(/#([\p{L}\p{N}_-]+)/u);
  return m ? m[1] : null;
}

function mergeUniqueById(a = [], b = []) {
  const map = new Map();
  [...a, ...b].forEach((x) => x && x.id && map.set(x.id, x));
  return [...map.values()];
}

function sortItems(items, sort) {
  if (!sort) return items;
  const dir = sort.startsWith("-") ? -1 : 1;
  const field = sort.replace("-", "");
  const get = (it) => {
    if (field === "created") return new Date(it.created).getTime();
    if (field === "endsAt") return new Date(it.endsAt).getTime();
    return 0;
  };
  return items.slice().sort((a, b) => (get(a) - get(b)) * dir);
}

function cardTemplate(item) {
  const imgHTML = imgTag(firstImage(item.media), {
    alt: item.title || "Listing",
    classes: "w-full h-40 object-cover rounded mb-4 bg-base-200",
  });

  const bids = item._count?.bids ?? item.bids?.length ?? 0;
  const highest =
    Array.isArray(item.bids) && item.bids.length
      ? Math.max(...item.bids.map((b) => b.amount))
      : 0;
  const sellerName = item.seller?.name || "Unknown";

  return `
    <article class="bg-white border rounded-xl shadow p-4 flex flex-col">
      <a href="/listing.html?id=${encodeURIComponent(item.id)}" class="block">
        ${imgHTML}
      </a>
      <h3 class="font-bold text-lg mb-1 line-clamp-1">${item.title || "Untitled"}</h3>
      <p class="text-sm text-neutral/70 mb-2">
        by
        ${
          item.seller?.name
            ? `<a class="underline hover:no-underline"
                href="/profile.html?name=${encodeURIComponent(item.seller.name)}">${sellerName}</a>`
            : sellerName
        }
      </p>
      <div class="text-sm text-neutral/80 mb-2">
        <span class="mr-2">${bids} bids</span>
        <span class="mr-2">Top: ${highest}</span>
        <span>Ends: ${timeLeft(item.endsAt)}</span>
      </div>
      <a href="/listing.html?id=${encodeURIComponent(item.id)}"
         class="mt-auto inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
        View
      </a>
    </article>
  `;
}

let canGoNext = false;

async function load() {
  errEl?.classList.add("hidden");
  statusEl && (statusEl.textContent = "");
  showLoading(feed, "Fetching listings…");

  const page = getInt("page", 1);
  const limit = getInt("limit", 12);
  const q = u.searchParams.get("q") || "";
  const sort = u.searchParams.get("sort") || "";
  const _active = (u.searchParams.get("_active") ?? "true") !== "false";

  try {
    const base = { _seller: true, _bids: true, page, limit };
    const tagFromHash = parseHashtag(q);

    let items = [];
    let meta = null;

    if (tagFromHash) {
      const res = await listListings({ ...base, _tag: tagFromHash });
      items = res?.data || [];
      meta = res?.meta || null;
    } else if (q.trim()) {
      const qTag = slugifyTag(q);
      const [kwRes, tagRes] = await Promise.allSettled([
        searchListings(q, base),
        qTag ? listListings({ ...base, _tag: qTag }) : Promise.resolve({ data: [] }),
      ]);

      const kwItems = kwRes.status === "fulfilled" ? kwRes.value?.data || [] : [];
      const tgItems = tagRes.status === "fulfilled" ? tagRes.value?.data || [] : [];
      items = mergeUniqueById(kwItems, tgItems);

      meta = kwRes.status === "fulfilled" ? kwRes.value?.meta || null : null;
    } else {
      const res = await listListings({ ...base, _active });
      items = res?.data || [];
      meta = res?.meta || null;
    }

    if (_active) items = items.filter(isActive);
    items = sortItems(items, sort);

    if (!items.length) {
      const tagShown = tagFromHash || slugifyTag(q);
      showEmpty(
        feed,
        tagShown ? `No listings found for tag #${tagShown}.` : "No listings found."
      );
    } else {
      feed.innerHTML = items.map(cardTemplate).join("");
    }

    const pageCount = meta?.pageCount ?? null;
    const hasPrev = page > 1;
    const hasNext = pageCount ? page < pageCount : items.length === limit;

    pageInfo && (pageInfo.textContent = pageCount ? `Page ${page} of ${pageCount}` : `Page ${page}`);
    if (prevBtn) prevBtn.disabled = !hasPrev;
    if (nextBtn) nextBtn.disabled = !hasNext;
    canGoNext = hasNext;
  } catch (e) {
    console.error(e);
    showError(feed, e?.message || "Failed to load listings");
  }
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const { q, sort, _active } = getParamsFromUI();
  setParam("q", q);
  setParam("sort", sort);
  setParam("_active", _active ? "true" : "false");
  setParam("page", 1);
  history.replaceState({}, "", u);
  load();
});

prevBtn?.addEventListener("click", () => {
  const page = getInt("page", 1);
  if (page <= 1) return;
  setParam("page", page - 1);
  history.replaceState({}, "", u);
  load();
});

nextBtn?.addEventListener("click", () => {
  if (!canGoNext) return;
  const page = getInt("page", 1);
  setParam("page", page + 1);
  history.replaceState({}, "", u);
  load();
});

populateUIFromParams();
load();