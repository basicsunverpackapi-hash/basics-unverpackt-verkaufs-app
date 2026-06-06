const CACHE_VERSION = 'basics-kasse-v6';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './handy-installieren.html',
  './chromebook-installieren.html',
  './404.html',
  './offline.html'
];

const toScopeUrl = (path) => new URL(path, self.registration.scope).toString();

const assetUrlsFromHtml = (html) => {
  const urls = new Set();
  const pattern = /\b(?:src|href)="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const url = new URL(match[1], self.registration.scope);
    if (url.origin === self.location.origin) {
      urls.add(url.toString());
    }
  }

  return [...urls];
};

const cacheAppShell = async () => {
  const cache = await caches.open(CACHE_VERSION);
  const indexUrl = toScopeUrl('./index.html');
  const response = await fetch(indexUrl, { cache: 'reload' });
  const html = await response.clone().text();
  const assetUrls = assetUrlsFromHtml(html);

  await cache.put(indexUrl, response);
  await cache.addAll(CORE_ASSETS.map(toScopeUrl));
  await cache.addAll(assetUrls);
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    cacheAppShell().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(toScopeUrl('./index.html'), copy));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_VERSION);
          return (await cache.match(toScopeUrl('./index.html'))) || cache.match(toScopeUrl('./offline.html'));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
