// Service Worker for Offline AI - June 2026
// Enables offline AI functionality and caching

const CACHE_NAME = 'ai-tools-v2026.6';
const RUNTIME_CACHE = 'ai-runtime-v2026.6';

// Assets to cache immediately
const PRECACHE_URLS = [
  '/',
  '/ai-models/local-ai-runner.js',
  '/ai-models/next-gen-ai.js',
  '/ai-models/voice-commands.user.js',
  '/styles/dark-mode-ai-sites.css',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest',
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@latest/dist/ort.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // AI API calls - network only with offline fallback
  if (url.hostname.includes('api.openai.com') || 
      url.hostname.includes('api.anthropic.com') ||
      url.hostname.includes('api.x.ai')) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline - return cached response or offline message
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              
              return new Response(
                JSON.stringify({
                  error: 'Offline',
                  message: 'AI API unavailable offline. Using local models.',
                  offline: true
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Static assets - cache first, fallback to network
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2)$/)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Default - network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            
            // Return offline page
            return new Response(
              '<html><body><h1>Offline</h1><p>You are offline. AI features are running locally.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
      })
  );
});

// Background sync for offline AI requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-ai-requests') {
    event.waitUntil(syncAIRequests());
  }
});

async function syncAIRequests() {
  const db = await openDB();
  const requests = await db.getAll('pending-requests');
  
  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      
      if (response.ok) {
        await db.delete('pending-requests', req.id);
        
        // Notify client
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: 'sync-success',
            requestId: req.id
          });
        });
      }
    } catch (error) {
      console.error('[SW] Sync failed:', error);
    }
  }
}

// IndexedDB helper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ai-tools-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('ai-responses')) {
        db.createObjectStore('ai-responses', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Push notifications for AI completions
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data?.text());
  
  const data = event.data?.json() || {};
  
  const options = {
    body: data.message || 'AI task completed',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'view', title: 'View Result' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('AI Tools', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync (check for model updates)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-model-updates') {
    event.waitUntil(checkModelUpdates());
  }
});

async function checkModelUpdates() {
  try {
    const response = await fetch('/api/model-updates');
    const updates = await response.json();
    
    if (updates.available) {
      // Notify all clients
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'model-update-available',
          updates
        });
      });
    }
  } catch (error) {
    console.error('[SW] Model update check failed:', error);
  }
}

// Message handling from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'skip-waiting') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'cache-ai-model') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.add(event.data.url);
      })
    );
  }
  
  if (event.data.type === 'clear-cache') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }
});

console.log('[SW] Service Worker loaded - v2026.6');
