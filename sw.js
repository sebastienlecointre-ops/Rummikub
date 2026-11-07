// Service worker Rummikub : la version est transmise par la page (sw.js?v=...)
const VERSION = new URL(self.location).searchParams.get('v') || 'dev';
const CACHE = 'rummikub-' + VERSION;
const PRECACHE = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  // Passage depuis l'ancienne page (enregistrée sans ?v=) : on prend la main tout de suite
  if (VERSION === 'dev') self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(PRECACHE.map(u => c.add(new Request(u, { cache: 'reload' }))))
    )
  );
});

self.addEventListener('activate', (e) => {
  // Supprime toutes les anciennes copies, y compris 'rummikub-pwa-v1'
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('rummikub-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // polices et icônes externes : gérées par le navigateur

  // Page HTML : toujours le réseau d'abord, la copie seulement hors connexion
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req.url, { cache: 'no-cache' })
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Autres fichiers du site : réponse immédiate depuis la copie, mise à jour en arrière-plan
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
