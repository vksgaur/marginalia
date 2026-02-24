const CACHE = 'marginalia-v1';

// Cache the app shell so it loads instantly (and offline) after first visit.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add('/')));
  self.skipWaiting();
});

// Remove old caches on activation.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET requests and the article parsing API (always needs network).
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  // Navigation requests (HTML pages): network-first, cache as fallback.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match('/') ?? caches.match(request)),
    );
    return;
  }

  // Static assets (_next/static, icons, fonts): cache-first.
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname === '/manifest.json'
  ) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
            return res;
          }),
      ),
    );
  }
});
