const CACHE_NAME = 'plan-posilkow-v3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname !== location.hostname) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── POWIADOMIENIA ────────────────────────────────────────
let notifTimer = null;

self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_NOTIF') {
    const { delay, title, body } = event.data;

    // Anuluj poprzedni timer
    if (notifTimer) clearTimeout(notifTimer);

    notifTimer = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: './icons/icon-192.png',
        badge: './icons/icon-72.png',
        vibrate: [200, 100, 200],
        tag: 'breakfast-reminder',
        renotify: true,
        data: { url: './' },
      });

      // Zaplanuj następne (jutro o tej samej porze)
      notifTimer = setTimeout(() => {
        self.registration.showNotification(title, {
          body,
          icon: './icons/icon-192.png',
          badge: './icons/icon-72.png',
          vibrate: [200, 100, 200],
          tag: 'breakfast-reminder',
          renotify: true,
        });
      }, 24 * 60 * 60 * 1000);

    }, delay);
  }
});

// Kliknięcie w powiadomienie otwiera aplikację
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('testy') && 'focus' in client) return client.focus();
      }
      return clients.openWindow('./');
    })
  );
});
