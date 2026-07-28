// Service worker — coquille applicative en cache pour usage hors ligne
const CACHE = 'elms-scan-v1';
const FICHIERS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// Installation : mise en cache de la coquille
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FICHIERS)));
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(cles=>
    Promise.all(cles.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
  ));
  self.clients.claim();
});

// Récupération : cache d'abord pour la coquille, réseau pour le reste
self.addEventListener('fetch', e=>{
  const url = e.request.url;
  // On ne met jamais en cache les appels vers Apps Script (POST des scans)
  if(url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request).then(rep=> rep || fetch(e.request))
  );
});
