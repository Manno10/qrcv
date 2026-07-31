// Scan ELMS — service worker v4
const CACHE = 'elms-scan-v4';
const LOCAUX = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(LOCAUX))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Ne jamais intercepter les appels vers Apps Script.
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') {
    return;
  }

  // Navigation : réseau d'abord, cache en secours.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copie = response.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copie));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Ressources locales et CDN : cache d'abord, réseau en secours.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (request.method === 'GET' && response && response.status === 200) {
          const copie = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copie));
        }
        return response;
      });
    })
  );
});
