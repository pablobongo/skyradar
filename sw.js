// SkyRadar Service Worker v2.6
const CACHE = 'skyradar-v26';
const BASE = self.location.pathname.replace('/sw.js', '');

const SHELL = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon.svg',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .catch(err => console.warn('SW install cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.hostname.includes('airplanes.live') ||
      url.hostname.includes('hexdb.io') ||
      url.hostname.includes('adsbdb.com') ||
      url.hostname.includes('opensky-network.org') ||
      url.hostname.includes('aerodatabox') ||
      url.hostname.includes('rapidapi.com') ||
      url.hostname.includes('openstreetmap.org') ||
      url.hostname.includes('flagcdn.com') ||
      url.hostname.includes('unpkg.com') ||
      url.hostname.includes('cartocdn.com') ||
      url.hostname.includes('basemaps')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        fetch(e.request).then(fresh => {
          if (fresh && fresh.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, fresh));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(BASE + '/index.html');
      });
    })
  );
});
