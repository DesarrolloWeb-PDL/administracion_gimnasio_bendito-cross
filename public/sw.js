const CACHE_NAME = 'bendito-cross-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API routes, navigation requests, manifest, and external URLs
  if (request.url.includes('/api/') || request.mode === 'navigate' || request.url.includes('manifest')) {
    return;
  }

  // Do not intercept Next.js build assets; let the browser handle them directly
  if (request.url.includes('/_next/')) return;

  // Only cache same-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Propagate the failure instead of masking it with a synthetic 503
        return Response.error();
      });
    })
  );
});