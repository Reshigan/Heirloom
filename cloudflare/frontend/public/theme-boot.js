// Theme cold-boot — runs synchronously in <head> BEFORE the first paint so the
// splash and the document substrate match the resolved theme.
//
// The Deep is deep water only — there is no light/paper theme anymore. We
// always resolve to 'dark' (the living dye-bath water, the canonical Heirloom
// ground). Any legacy 'light'/'system' preference in localStorage is ignored.
//
// External (not inline) because the production CSP is `script-src 'self'` with
// no 'unsafe-inline' — an inline <script> is blocked. A same-origin file is
// allowed by 'self'. Mirrors the resolution logic in src/loom/theme.ts.
(function () {
  var resolved = 'dark';
  document.documentElement.setAttribute('data-theme', resolved);

  // Accent cold-boot — the single emotion hue ([data-accent] swaps --accent).
  // Default 'seafoam'; keep the valid set in sync with LoomAccent in theme.ts.
  var ACCENT_KEY = 'heirloom-accent';
  var accent = 'seafoam';
  try {
    var savedAccent = localStorage.getItem(ACCENT_KEY);
    if (savedAccent === 'copper' || savedAccent === 'seafoam' || savedAccent === 'glacial' ||
        savedAccent === 'jade' || savedAccent === 'moonstone') {
      accent = savedAccent;
    }
  } catch (e) {
    /* localStorage blocked — keep the seafoam default */
  }
  document.documentElement.setAttribute('data-accent', accent);
  // Keep the mobile status-bar tint honest with the deep-water theme.
  try {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#070d14');
    var bar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (bar) bar.setAttribute('content', 'black-translucent');
  } catch (e) {
    /* no-op */
  }
})();
