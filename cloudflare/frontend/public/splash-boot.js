// Cold-boot splash safety net. This lives in an EXTERNAL file (not inline in
// index.html) because the production Content-Security-Policy is `script-src
// 'self' …` with no 'unsafe-inline' — an inline <script> is blocked, which
// would leave #hl-splash covering the whole app forever. A same-origin file is
// allowed by 'self'.
//
// The primary teardown is in src/main.tsx (runs the moment React mounts). This
// safety net only matters if the app module never executes (e.g. a chunk fails
// to load): it removes the splash a beat after window.load so a stalled boot
// still reveals whatever did render rather than a frozen splash.
(function () {
  function leave() {
    var s = document.getElementById('hl-splash');
    if (!s) return;
    s.setAttribute('data-leaving', '');
    setTimeout(function () {
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }, 420);
  }
  window.__hlSplashLeave = leave;
  // Longer than main.tsx's rAF path so the React teardown normally wins; this
  // is purely the fallback for a boot that otherwise never clears the splash.
  window.addEventListener('load', function () {
    setTimeout(leave, 1200);
  });
})();
