// Theme cold-boot — runs synchronously in <head> BEFORE the first paint so the
// splash and the document substrate match the visitor's saved theme. Without
// this, every light-mode visitor sees a dark splash flash ("the old theme")
// before React mounts and re-themes the .loom roots in a post-paint effect.
//
// External (not inline) because the production CSP is `script-src 'self'` with
// no 'unsafe-inline' — an inline <script> is blocked. A same-origin file is
// allowed by 'self'. Mirrors the resolution logic in src/loom/theme.ts:
//   saved 'dark' | 'light' | 'system'  (default 'dark'); 'system' → matchMedia.
(function () {
  var KEY = 'heirloom-theme';
  var resolved = 'dark';
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') {
      resolved = saved;
    } else if (saved === 'system' && window.matchMedia) {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  } catch (e) {
    /* localStorage blocked — keep the dark default */
  }
  // Drive the splash + root substrate CSS (html[data-theme="light"] overrides).
  document.documentElement.setAttribute('data-theme', resolved);
  // Keep the mobile status-bar tint honest with the resolved theme.
  try {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'light' ? '#faf3e4' : '#0b0907');
  } catch (e) {
    /* no-op */
  }
})();
