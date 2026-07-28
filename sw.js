// Service worker — v2 (bump pour forcer le rechargement après mise à jour URL)
const CACHE = 'elms-scan-v2';
const FICHIERS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// Installation : mise en cache + activation immédiate
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FICHIERS)));
  self.skipWaiting();   // active la nouvelle version sans attendre
});

// Activation : suppression de TOUS les anciens caches
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(cles=>
      Promise.all(cles.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

// Récupération : réseau d'abord pour le HTML (toujours la dernière version),
// cache d'abord pour le reste. Jamais les appels Apps Script.
self.addEventListener('fetch', e=>{
  const url = e.request.url;
  if(url.includes('script.google.com')) return;   // scans : jamais en cache

  // Le HTML est servi réseau-d'abord pour éviter tout cache figé
  if(e.request.mode === 'navigate' || url.endsWith('index.html') || url.endsWith('/')){
    e.respondWith(
      fetch(e.request).then(rep=>{
        const copie = rep.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copie));
        return rep;
      }).catch(()=>caches.match(e.request))   // hors ligne : on retombe sur le cache
    );
    return;
  }

  // Autres ressources : cache d'abord
  e.respondWith(caches.match(e.request).then(rep=> rep || fetch(e.request)));
});
