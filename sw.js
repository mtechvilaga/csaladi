// ============================================
// SERVICE WORKER – Családi Feladatkezelő
// Mindig hálózatról tölt, cache csak offline fallback
// ============================================

const CACHE_NAME = 'csaladi-v' + Date.now();

const STATIC_ASSETS = [
  '/csaladi/',
  '/csaladi/manifest.json',
  '/csaladi/icons/icon-96.png',
  '/csaladi/icons/icon-152.png',
  '/csaladi/icons/icon-192.png',
  '/csaladi/icons/icon-512.png',
];

// ── INSTALL ──
self.addEventListener('install', event => {
  console.log('[SW] Telepítés:', CACHE_NAME);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Cache hiba:', err);
      });
    })
  );
});

// ── ACTIVATE: régi cache-ek törlése ──
self.addEventListener('activate', event => {
  console.log('[SW] Aktiválás:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Régi cache törölve:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH: mindig hálózat először ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Külső szolgáltatások: ne cache-eljük
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('emailjs.com') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdn.') ||
    url.protocol === 'chrome-extension:'
  ) {
    return;
  }

  // MINDEN fájl: hálózat először, cache csak ha nincs net
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── MESSAGE ──
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
