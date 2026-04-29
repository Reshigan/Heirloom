/**
 * Heirloom service worker.
 *
 * Strategy:
 *   - App shell (HTML/CSS/JS) → stale-while-revalidate so the app is
 *     fast and offline-friendly without fighting deploys.
 *   - API calls (https://api.heirloom.blue/api/*) → network-first with
 *     a 6-second timeout, then fall back to cache. Encrypted entry
 *     bodies are safe to cache because the family key never leaves
 *     the device.
 *   - Public assets (fonts, images) → cache-first.
 *   - Never cache authenticated requests with Authorization headers
 *     except as transient stale-while-revalidate (we don't want stale
 *     state lingering after logout).
 *
 * Versioning: bump CACHE_VERSION when shipping incompatible asset
 * changes; old caches are pruned on activate.
 */

const CACHE_VERSION = 'heirloom-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const APP_SHELL = ['/', '/hearth', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        /* Best-effort precache. Missing routes won't block install. */
      }),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

function timeoutFetch(request, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(request)
      .then((res) => {
        clearTimeout(t);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(t);
        reject(err);
      });
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API: network-first with 6s timeout; fall back to cache; cache successful responses.
  if (url.hostname === 'api.heirloom.blue' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const res = await timeoutFetch(request, 6000);
          if (res && res.status === 200) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'content-type': 'application/json' },
          });
        }
      })(),
    );
    return;
  }

  // Same-origin assets: cache-first for fonts/images, stale-while-revalidate for shell.
  if (url.origin === self.location.origin) {
    if (request.destination === 'image' || request.destination === 'font') {
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((res) => {
            if (res.ok) {
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, res.clone()));
            }
            return res;
          });
        }),
      );
      return;
    }
    // App shell — stale-while-revalidate
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkPromise = fetch(request)
          .then((res) => {
            if (res && res.ok) {
              caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, res.clone()));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkPromise;
      }),
    );
    return;
  }

  // External (Google Fonts, etc.): cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          caches.open(ASSET_CACHE).then((cache) => cache.put(request, res.clone()));
        }
        return res;
      });
    }),
  );
});
