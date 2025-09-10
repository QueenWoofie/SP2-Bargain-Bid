import { getProfile, logout } from '../api/auth.js';

export function renderSidebar() {
  const shell = document.createElement('div');
  shell.innerHTML = `
    <div class="min-h-screen bg-base-100 text-neutral lg:grid lg:grid-cols-[280px_1fr]">
      <!-- Mobile top bar -->
      <div class="lg:hidden flex items-center justify-between p-3 bg-white border-b">
        <button id="sidebarOpen" class="p-2 rounded border" aria-label="Open menu" aria-expanded="false">
          ☰
        </button>
        <a href="/index.html" class="flex items-center gap-2">
          <span class="font-semibold">Bargain Bid</span>
        </a>
        <span id="credits-badge" class="hidden text-sm px-2 py-1 border rounded">Credits: 0</span>
      </div>

      <!-- Sidebar -->
      <aside
        id="sidebar"
        class="fixed inset-y-0 left-0 z-40 w-72 -translate-x-full transition-transform duration-200
          bg-white border-r p-4 lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen"
        aria-label="Sidebar navigation"
      >
        <div class="flex items-center justify-between">
          <a href="/index.html" class="flex items-center gap-2 text-xl font-semibold">
            <img src="/img/BargainBid.png" alt="Bargain Bid logo" class="h-full max-w-m m w-auto rounded-md rounded-md bg-white p-0.5 ring-1 ring-black/10">
          </a>
          <button id="sidebarClose" class="p-2 rounded border lg:hidden" aria-label="Close menu" aria-expanded="true">✕</button>
        </div>

        <nav class="mt-6 space-y-1">
          <a class="block px-3 py-2 rounded hover:bg-base-200" href="/index.html">Home</a>
          <a class="block px-3 py-2 rounded hover:bg-base-200" href="/listings.html">Browse</a>
          <div id="authLinks"></div>
        </nav>

        <div class="mt-6">
          <span id="credits-badge-desktop" class="hidden text-sm px-2 py-1 border rounded">Credits: 0</span>
        </div>
      </aside>

      <!-- Overlay for mobile -->
      <div id="overlay" class="fixed inset-0 bg-black/30 opacity-0 pointer-events-none z-30 lg:hidden"></div>

      <!-- Main content wrapper -->
      <main id="appMain" class="min-h-screen p-4">
        <!-- Page content will be moved here -->
      </main>
    </div>
  `;

  const bodyChildren = [...document.body.childNodes];
  document.body.innerHTML = '';
  document.body.appendChild(shell.firstElementChild);
  const main = document.getElementById('appMain');
  bodyChildren.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
    main.appendChild(node);
  });

  const profile = getProfile();
  const authLinks = document.getElementById('authLinks');
  authLinks.innerHTML = profile
    ? `
      <a class="block px-3 py-2 rounded hover:bg-base-200" href="/create-listing.html">Create listing</a>
      <a class="block px-3 py-2 rounded hover:bg-base-200" href="/profile.html">Profile</a>
      <button id="logoutBtn" class="w-full text-left px-3 py-2 rounded border mt-2">Logout</button>
    `
    : `
      <a class="block px-3 py-2 rounded hover:bg-base-200" href="/login.html">Login</a>
      <a class="block px-3 py-2 rounded hover:bg-base-200" href="/register.html">Register</a>
    `;

  const credits = profile?.credits ?? null;
  if (credits !== null) {
    const mobileBadge = document.getElementById('credits-badge');
    const deskBadge = document.getElementById('credits-badge-desktop');
    mobileBadge.textContent = `Credits: ${credits}`;
    deskBadge.textContent = `Credits: ${credits}`;
    mobileBadge.classList.remove('hidden');
    deskBadge.classList.remove('hidden');
  }

  // Events
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const aside = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const openBtn = document.getElementById('sidebarOpen');
  const closeBtn = document.getElementById('sidebarClose');

  function open() {
    aside.classList.remove('-translate-x-full');
    overlay.classList.remove('pointer-events-none');
    overlay.classList.add('opacity-100');
    openBtn?.setAttribute('aria-expanded', 'true');
    closeBtn?.setAttribute('aria-expanded', 'true');
  }
  function close() {
    aside.classList.add('-translate-x-full');
    overlay.classList.add('pointer-events-none');
    overlay.classList.remove('opacity-100');
    openBtn?.setAttribute('aria-expanded', 'false');
    closeBtn?.setAttribute('aria-expanded', 'false');
  }

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
}
