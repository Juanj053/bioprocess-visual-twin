/**
 * Bioprocess Visual Twin PWA Service Worker (v2.6.0)
 * Provides offline app-shell caching with network-first updates for local modules
 * and cache-first fallback for CDN scientific visualization libraries.
 */
const CACHE_NAME = 'bioprocess-twin-v2.6.0';
const APP_SHELL = [
  './',
  './index.html',
  './dashboard.html',
  './css/styles.css',
  './manifest.webmanifest',
  './assets/icon.svg',
  './js/i18n.js',
  './js/theme.js',
  './js/strains.js',
  './js/phases.js',
  './js/kinetics.js',
  './js/dashboard-shared.js',
  './js/sim-worker.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => null);
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
  } else {
    event.respondWith(
      caches.match(req).then((cached) => {
        const netFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => null);
            }
            return res;
          })
          .catch(() => cached);
        return cached || netFetch;
      })
    );
  }
});
