importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSy placeholder",
  projectId: "shopmanager-placeholder",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:placeholder"
});

const messaging = firebase.messaging();

const CACHE_NAME = 'shopmanager-v4';
const STATIC_CACHE = 'shopmanager-static-v4';
const API_CACHE = 'shopmanager-api-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/assets/index-7mgEUFkH.css',
  '/assets/index-DxTt9cc3.js',
  '/assets/jsx-runtime-CzJJwKrs.js',
  '/assets/i18n-CDCZXDX_.js'
];

function isStaticAsset(url) {
  return url.origin === self.location.origin &&
    (url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.woff2') ||
     url.pathname.endsWith('.woff') ||
     url.pathname.endsWith('.ttf') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.jpg') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.ico'));
}

function isApiRequest(url) {
  return url.pathname.startsWith('/v1/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              cache.put(request, clone);
            }
            return response;
          });
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached || fetched;
    })
  );
});

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'ShopManager';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data || {},
    tag: 'shopmanager-notification',
    renotify: true
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || '/admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
