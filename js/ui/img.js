// Placeholder for images that fail to load / where no URL is given
const PLACEHOLDER_600x400 = "../img/placeholder_600x400.png";

export function imgTag(url, {
  alt = "",
  classes = "",
  fallback = PLACEHOLDER_600x400,
} = {}) {
  const primary = (typeof url === "string" && url.trim())
    ? url
    : fallback;

  return `
    <img
      src="${primary}"
      alt="${alt}"
      class="${classes}"
      loading="lazy"
      decoding="async"
      onerror="this.onerror=null;this.src='${fallback}'"
    />
  `;
}