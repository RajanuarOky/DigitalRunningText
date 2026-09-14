const CACHE_NAME = 'rt-tv-masjid-cache-v2';

// Install event: langsung aktif tanpa menunggu
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: bersihkan cache lama jika ada update versi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first dengan fallback ke offline cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Jangan cache request API Supabase atau skema non-http
  if (url.origin.includes('supabase.co') || !url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request)
        .then((networkResponse) => {
          // Jika berhasil online, simpan salinannya ke cache
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // JIKA OFFLINE / INTERNET MATI: ambil dari cache lokal STB
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback navigasi halaman utama SPA
            if (event.request.mode === 'navigate') {
              return cache.match('/') || cache.match('/index.html');
            }
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          });
        });
    })
  );
});
