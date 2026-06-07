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
 * Push
 *   push              render the family-thread notification
 *   notificationclick focus an existing tab or open the deep-linked route
 *
 * Bump CACHE when the shell contract changes; activate purges older caches.
 *
 * NOTE: precache the *canonical* URLs. Cloudflare Pages serves clean URLs, so
 * `/offline.html` 308-redirects to `/offline`; precaching the .html form makes
 * cache.addAll() reject on the redirected response and the whole install fails.
 * Precache `/offline` (the served URL) — never the redirecting alias.
 */
const CACHE = 'heirloom-v49';
const API_CACHE = 'heirloom-api-v1'; // preserved across shell bumps — offline read data
const SHELL = '/index.html';
const OFFLINE = '/offline';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  OFFLINE,
  // The offline page's logic lives in an external file (CSP blocks inline
  // scripts); precache it so the holding queue works with no network.
  '/offline-boot.js',
  // Splash teardown safety-net — must be available offline so the splash
  // doesn't get stuck if the network is absent on first load.
  '/splash-boot.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // Preserve API_CACHE across shell-version bumps so offline reads survive deploys
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== API_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  // Wipe the per-user API cache on logout so the next user on the device
  // never reads a previous user's memories/letters from the cache.
  if (event.data === 'CLEAR_API_CACHE') caches.delete(API_CACHE);
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // third-party (fonts, API host) → untouched

  // GET /api/* — network-first, fall back to API_CACHE for offline reads.
  // Non-GET API calls (mutations) are never intercepted — they go live or fail.
  if (url.pathname.startsWith('/api/')) {
    if (request.method !== 'GET') return;
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request, { cacheName: API_CACHE });
          return cached ?? Response.error();
        })
    );
    return;
  }

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
        .catch(() => caches.match(SHELL).then((r) => r || caches.match(OFFLINE)))
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

// ── Push ────────────────────────────────────────────────────────────────────
// The daily 8 pm prompt — the Listener's one quiet line. Real copy is
// server-driven (the prompt rotates); this is only the DEFAULT, in the
// Listener's voice, for when a push arrives without a body. Payload (JSON):
//   { title, body, route, tag }
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Heirloom';
  const options = {
    // The Listener asks, quietly, once. (Notifications have no subtitle
    // field, so the framing folds into the body — kept on-voice.)
    body: data.body || 'the listener asks…\nWhat did you almost forget to write down today?',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'heirloom',
    renotify: false,
    data: { route: data.route || '/loom/pwa' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = (event.notification.data && event.notification.data.route) || '/loom/pwa';
  const target = new URL(route, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});

// ── Background sync relay ────────────────────────────────────────────────────
// Relay 'hl-queue-sync' to any OPEN client windows so they can drain the queue.
// NOTE: this only works when the app is already open in a tab. When the app
// is closed the clients array is empty and the relay is a no-op. Full
// closed-app sync would require the SW to read IndexedDB and call the API
// directly (a future enhancement once VAPID + auth-token forwarding are wired).
self.addEventListener('sync', (event) => {
  if (event.tag === 'hl-queue-sync') {
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => clients.forEach((c) => c.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' })))
    );
  }
});
