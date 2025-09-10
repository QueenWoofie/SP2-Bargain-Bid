let host;
export function openLightbox(src, alt = '') {
  closeLightbox();
  host = document.createElement('div');
  host.className = 'fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4';
  host.tabIndex = -1;
  host.innerHTML = `
    <button id="lbClose" class="absolute top-4 right-4 text-white text-2xl" aria-label="Close">✕</button>
    <img src="${src}" alt="${alt}" class="max-w-full max-h-[90vh] object-contain rounded shadow-lg">
  `;
  document.body.appendChild(host);
  const closeBtn = host.querySelector('#lbClose');
  function close() {
    closeLightbox();
  }
  host.addEventListener('click', (e) => {
    if (e.target === host) close();
  });
  document.addEventListener('keydown', esc, { once: true });
  closeBtn.addEventListener('click', close);
  function esc(ev) {
    if (ev.key === 'Escape') close();
  }
}
export function closeLightbox() {
  if (host) {
    host.remove();
    host = null;
  }
}
