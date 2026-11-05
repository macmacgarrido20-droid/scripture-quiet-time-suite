/**
 * service-worker.js
 * PWA Service Worker — cache-first strategy for offline capability.
 *
 * Strategy:
 *   install  → pre-cache all static assets
 *   activate → delete stale caches (anything not named CACHE_NAME)
 *   fetch    → cache-first; fall back to network and cache the response
 *   message  → notify all clients when an update is available
 *
 * Requirements: 10.1, 10.2, 10.3
 */

const CACHE_NAME = 'sqts-v2';

/**
 * All static assets to pre-cache on install.
 * Bump CACHE_NAME to 'sqts-v2' (etc.) when deploying breaking changes so
 * old caches are cleaned up.
 */
const ASSETS = [
  '/dashboard.html',
  '/offline.html',
  '/configurator.html',
  '/embed.html',
  '/dashboard.js',
  '/configurator.js',
  '/embed.js',
  '/styles/base.css',
  '/styles/dashboard.css',
  '/styles/widget.css',
  '/styles/configurator.css',
  '/manifest.webmanifest',
  // Shared engine (accessed relative to web root when served)
  '../shared/scriptureEngine.js',
  '../shared/verses.json',
  // Icons (add actual paths once icons are created)
  // '/icons/icon-192.png',
  // '/icons/icon-512.png',
];

// ---------------------------------------------------------------------------
// Install — pre-cache all assets
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ---------------------------------------------------------------------------
// Activate — remove stale caches
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => {
        // Claim all open clients so the new SW takes effect immediately
        self.clients.claim();

        // Notify all clients that an update is available
        self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
          for (const client of clients) {
            client.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
          }
        });
      })
  );
});

// ---------------------------------------------------------------------------
// Fetch — cache-first strategy
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  // Only handle GET requests; ignore non-http(s) schemes
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache the response
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type !== 'opaque'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed and not in cache — serve offline page for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          // For non-navigation requests just fail silently
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});

// ---------------------------------------------------------------------------
// Message — SW update notification
// Handled in activate above; this block handles explicit client messages
// (e.g. "SKIP_WAITING" from a refresh button)
// ---------------------------------------------------------------------------

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
