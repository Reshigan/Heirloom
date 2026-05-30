/*
 * Heirloom service worker — the minimum that makes the PWA correct and
 * installable, and nothing more. No framework, no Workbox.
 *
 * Strategy
 *   navigations      network-first → cached shell → offline page (keeps the
 *                    deployed index.html fresh online, still opens offline)
 *   static assets    cache-first   (hashed /assets/* are immutable)
 *   /api/*           never touched  (always live; never cached — privacy + freshness)
 *
 * Bump CACHE when the shell contract changes; activate purges older caches.
 */
const CACHE = 'heirloom-v1';
const SHELL = '/index.html';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Allow the page to tell a waiting worker to take over immediately.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // third-party (fonts, API host) → untouched
  if (url.pathname.startsWith('/api/')) return; // live data is never cached

  // App navigations: prefer the network so a redeploy is seen at once; fall
  // back to the cached shell, then to a tiny offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // Everything else (hashed assets, icons, fonts already filtered out):
  // cache-first, then populate the cache on first network hit.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
    )
  );
});
