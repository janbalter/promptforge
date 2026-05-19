/* ── Promptforge Service Worker ──────────────────────────
   Caches the app shell on first visit so it works fully
   offline on every subsequent load (iOS Safari, Android,
   desktop Chrome/Firefox/Edge).
─────────────────────────────────────────────────────── */

const CACHE_NAME = 'promptforge-v2';

// Everything is embedded in index.html — only two files
// need caching for the PWA to work offline.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png'
];

/* Install: pre-cache all assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Activate: delete old caches from previous versions */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* Fetch: cache-first strategy (offline-first) */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          // Cache new successful GET responses dynamically
          if (event.request.method === 'GET' && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
      )
      .catch(() => caches.match('./index.html'))
  );
});
