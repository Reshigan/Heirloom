/**
 * Service-worker registration for the installable PWA.
 *
 * The worker itself (`public/sw.js`) does the offline/caching work. This module
 * only registers it — and only in a production build, so Vite's dev HMR is never
 * shadowed by a cache. When a new worker is found we ask it to take over at once
 * (the SW honours the SKIP_WAITING message) and reload once so the freshest shell
 * is shown. The single-reload guard mirrors lib/chunkReload.ts.
 */
const RELOAD_FLAG = 'heirloom:sw-reloaded';

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            // A new worker is ready while an old one still controls the page.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch((err) => console.warn('[sw] registration failed:', err));

    // When the controlling worker changes, reload once to adopt the new shell.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem(RELOAD_FLAG) === '1') return;
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    });
  });
}
