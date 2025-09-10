export function showLoading(el, text = 'Loading…') {
  el.innerHTML = `
    <div class="flex items-center justify-center py-10 text-neutral/70">
      <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral/40 border-t-neutral"></span>
      ${text}
    </div>`;
}
export function showEmpty(el, text = 'Nothing to show.') {
  el.innerHTML = `<p class="py-10 text-center text-neutral/60">${text}</p>`;
}
export function showError(el, message = 'Something went wrong.') {
  el.innerHTML = `<p class="py-10 text-center text-error">${message}</p>`;
}
