const CACHE_NAME = 'studyapp-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/courses.html',
  '/progress.html',
  '/help.html',
  '/login.html',
  '/register.html',
  '/admin-dashboard.html',
  '/manifest.json',
  '/styles.css',
  '/admin-styles.css',
  '/app.js',
  '/admin-script.js',
  '/firebase-config.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-regular-400.woff2'
];

// Cache storage name for dynamic content
const DYNAMIC_CACHE = 'studyapp-dynamic-v1';

// Install service worker and cache all necessary files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve cached content when offline with network first strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          // Cache the response
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
  } else {
    // For static assets, try cache first, then network
    event.respondWith(
      caches.match(event.request).then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        // Otherwise, fetch from network
        return fetch(event.request).then(networkResponse => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          // Clone the response
          const responseToCache = networkResponse.clone();
          // Cache the response
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // If both cache and network fail, show a fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
    );
  }
});

// Update service worker and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches that are not in the whitelist
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  return self.clients.claim();
});

// Listen for the 'message' event for cache management
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('Cache cleared');
    });
  }
});
