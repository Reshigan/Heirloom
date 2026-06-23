/*
 * Heirloom service worker — the minimum that makes the PWA correct and
 * installable, and nothing more. No framework, no Workbox.
 *
 * Strategy
 *   navigations      network-first → cached shell → offline page (keeps the
 *                    deployed index.html fresh online, still opens offline)
 *   static assets    cache-first   (hashed /assets/* are immutable)
 *   API GETs         network-first → API_CACHE (cross-origin to the known API
 *                    host api.heirloom.blue, or same-origin /api/*) — fresh when
 *                    online, last-good response when offline. Only GET is cached;
 *                    mutations (POST/PUT/PATCH/DELETE) pass straight through, never
 *                    cached. API_CACHE is per-user and is wiped on every auth
 *                    change via the CLEAR_API_CACHE message (cross-user safeguard).
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
const CACHE = 'heirloom-v182';
const API_CACHE = 'heirloom-api-v1'; // preserved across shell bumps — offline read data
// Canonical shell URL. Cloudflare Pages 308-redirects `/index.html` → `/`, and
// the Cache API rejects redirected responses — so precaching `/index.html`
// would make cache.addAll() reject and the whole install fail. Use `/`.
const SHELL = '/';
const OFFLINE = '/offline';
const PRECACHE = [
  '/',
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
  // Theme cold-boot — resolves the saved theme before first paint so the
  // splash matches; precache so the no-flash boot also works offline.
  '/theme-boot.js',
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
      // Tell every open window/PWA tab to reload so they adopt the new shell at once.
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then((clients) => clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED', version: CACHE })))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  // Wipe the per-user API cache on logout, login, register, and silent 401
  // force-logout so the next user on the device never reads a previous user's
  // memories/letters from the URL-keyed cache. waitUntil keeps the SW alive
  // until the delete resolves — a bare caches.delete() can be killed mid-flight.
  if (event.data === 'CLEAR_API_CACHE') event.waitUntil(caches.delete(API_CACHE));

  // Cross-account leak guard: on logout, wipe the IndexedDB voice-recording
  // holding queue from the SW context too. The page's own deleteDatabase can be
  // blocked by an open connection; the SW has its own handle to the DB. Posted
  // as { type: 'CLEAR_OFFLINE_QUEUES' }. waitUntil keeps the SW alive until the
  // delete resolves (or its blocked/error event fires, so we never hang).
  if (event.data && event.data.type === 'CLEAR_OFFLINE_QUEUES') {
    event.waitUntil(
      new Promise((resolve) => {
        try {
          if (typeof indexedDB === 'undefined' || !indexedDB.deleteDatabase) {
            resolve();
            return;
          }
          const req = indexedDB.deleteDatabase('heirloom-voice-queue');
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();   // best-effort — never reject
          req.onblocked = () => resolve(); // a client still holds it open
        } catch {
          resolve();
        }
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Is this a request to the Heirloom API? The API lives cross-origin at
  // api.heirloom.blue (see src/services/api.ts API_URL); in dev it may be the
  // same origin under /api/*. We treat both as API traffic so offline reads
  // survive reload/cold-start regardless of where the API is hosted.
  const isApiHost = url.hostname === 'api.heirloom.blue';
  const isSameOriginApi = url.origin === self.location.origin && url.pathname.startsWith('/api/');
  const isApiRequest = isApiHost || isSameOriginApi;

  // API GETs — network-first, fall back to API_CACHE for offline reads. This
  // runs BEFORE the same-origin gate so cross-origin GETs to the known API host
  // are cached too (they were previously dropped here and never survived a
  // reload). Only GET is cached; mutations were already filtered above and go
  // live or fail. API_CACHE is per-user, wiped on auth change (CLEAR_API_CACHE).
  if (isApiRequest) {
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

  // Everything past this point is shell/asset/navigation handling, which only
  // applies to our own origin. Any other third-party (fonts, analytics) → untouched.
  if (url.origin !== self.location.origin) return;

  // App navigations: prefer the network so a redeploy is seen at once; fall
  // back to the cached shell, then to a tiny offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Only freshen the cached shell from a clean, same-origin 200. A
          // redirect (res.type 'opaqueredirect') or an error page would otherwise
          // poison the shell and be served to every offline navigation.
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
          }
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
  const rawRoute = (event.notification.data && event.notification.data.route) || '/loom/pwa';
  // Only accept same-origin relative paths — reject javascript:, //, or absolute URLs.
  const route = (typeof rawRoute === 'string' && rawRoute.startsWith('/') && !rawRoute.startsWith('//')) ? rawRoute : '/loom/pwa';
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
