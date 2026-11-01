self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('rummikub-pwa-v1').then((cache) => {
      return cache.addAll([
        './Rummikub.html',
        './manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});