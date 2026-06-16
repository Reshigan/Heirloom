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
    // Did a service worker already control this page when it loaded? On a
    // brand-new visit there is none. The SW claiming the page for the FIRST
    // time must NOT trigger a reload: the page already holds the freshest
    // network assets, so a reload here shows nothing newer — it only interrupts
    // the user. In practice it fires ~1–3s after load and aborts whatever
    // request is in flight, which silently kills the very first signup POST for
    // every new visitor. Only a genuine update — a NEW worker replacing an
    // existing controller — warrants the one-time refresh.
    const hadControllerAtLoad = !!navigator.serviceWorker.controller;

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

    // Path 1 — controllerchange: fires when the active SW switches. Skip the
    // first-install case (no prior controller) — only refresh on a real update.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadControllerAtLoad) return;
      reloadOnce();
    });

    // Path 2 — SW_UPDATED message: the new SW broadcasts this to every open
    // window/PWA tab after clients.claim(), catching background tabs and
    // standalone PWA windows that may have missed the controllerchange event.
    // Same first-install guard — a brand-new visit must not self-reload.
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED' && hadControllerAtLoad) reloadOnce();
    });
  });
}

/**
 * Force an immediate update check — call at moments where the freshest shell
 * matters most (e.g. right after login). Fetches sw.js out-of-band, and if a
 * newer worker is parked waiting, tells it to take over now. The registration's
 * own updatefound + controllerchange handlers then reload onto the new build.
 * Best-effort: never throws, never blocks its caller, no-ops outside a
 * production PWA context.
 */
export async function checkForServiceWorkerUpdate(): Promise<void> {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    await reg.update().catch(() => {});
    // A worker that finished installing while the old one still controls the
    // page sits in `waiting` and never activates on its own — nudge it so the
    // user adopts the latest build this session, not the next cold start.
    if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
  } catch {
    /* best-effort — an update check must never break the login flow */
  }
}

function reloadOnce(): void {
  if (sessionStorage.getItem(RELOAD_FLAG) === '1') return;
  sessionStorage.setItem(RELOAD_FLAG, '1');
  window.location.reload();
}
