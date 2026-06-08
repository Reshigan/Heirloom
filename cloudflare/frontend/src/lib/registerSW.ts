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
        // Proactively check for a newer worker on every load (and hourly for
        // long-lived PWA windows) so a returning visitor pinned to an old
        // precached shell adopts the freshest build without waiting for the
        // browser's once-a-day sw.js revalidation. The CACHE bump in sw.js
        // then purges every stale cache on activate.
        reg.update().catch(() => {});
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);

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

    // Path 1 — controllerchange: fires when the active SW switches.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      reloadOnce();
    });

    // Path 2 — SW_UPDATED message: the new SW broadcasts this to every open
    // window/PWA tab after clients.claim(), catching background tabs and
    // standalone PWA windows that may have missed the controllerchange event.
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') reloadOnce();
    });
  });
}

function reloadOnce(): void {
  if (sessionStorage.getItem(RELOAD_FLAG) === '1') return;
  sessionStorage.setItem(RELOAD_FLAG, '1');
  window.location.reload();
}
