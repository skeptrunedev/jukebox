// Basic service worker to enable PWA installation
// Caching strategy is minimal: offline fallback not implemented
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Intentionally left blank: network-first behavior
});