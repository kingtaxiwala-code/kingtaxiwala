// Service Worker Kill-Switch - Version 11.0.2 (Favicon/PWA Refresh 2026-05-14)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Unregistering Service Worker...');
      return self.registration.unregister();
    }).then(() => {
      console.log('SW Unregistered and Caches Cleared.');
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach(client => {
        if (client.url && client.navigate) {
          client.navigate(client.url);
        }
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through to network
});
