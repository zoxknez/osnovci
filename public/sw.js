// Simple Service Worker - Basic PWA functionality
// NOTE: For production, use Workbox with proper build step

const CACHE_NAME = "osnovci-v3"; // Updated to force cache refresh
const urlsToCache = ["/", "/favicon.ico"];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("✅ Service Worker: Cache opened");
        // Add URLs individually to avoid blocking on 404s
        return Promise.allSettled(
          urlsToCache.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`⚠️ Service Worker: Failed to cache ${url}:`, err);
            }),
          ),
        );
      })
      .then(() => {
        console.log("✅ Service Worker: Installation complete");
      })
      .catch((error) => {
        console.error("❌ Service Worker: Cache failed", error);
      }),
  );
  // Force waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("🗑️ Service Worker: Deleting old cache", cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        }),
      );
    }),
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip caching for POST, PUT, DELETE requests
  if (event.request.method !== "GET") {
    return event.respondWith(fetch(event.request));
  }

  // Skip caching for API routes (auth, etc)
  if (event.request.url.includes("/api/")) {
    return event.respondWith(fetch(event.request));
  }

  // Skip caching for external resources (analytics, etc)
  if (!event.request.url.startsWith(self.location.origin)) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          // Check if valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone response
          const responseToCache = response.clone();

          // Cache for next time (only GET requests)
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Network failed, return offline page if available
          return caches.match("/offline.html");
        });
    }),
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("🔄 Service Worker: Background sync triggered", event.tag);
  if (event.tag === "sync-homework") {
    event.waitUntil(syncHomework());
  }
});

async function syncHomework() {
  console.log("📤 Service Worker: Syncing homework...");
  // TODO: Implement real sync with IndexedDB
  // For now, just log
  return Promise.resolve();
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("🔔 Service Worker: Push notification received");
  const data = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(data.title || "Osnovci", {
      body: data.body || "Nova notifikacija",
      icon: "/icons/icon-192x192.svg",
      badge: "/icons/icon-72x72.svg",
      vibrate: [200, 100, 200],
      data: data.url,
      actions: [
        { action: "open", title: "Otvori" },
        { action: "close", title: "Zatvori" },
      ],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Service Worker: Notification clicked");
  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(self.clients.openWindow(event.notification.data || "/"));
  }
});

// Service Worker is ready!
console.log("✅ Service Worker loaded successfully! 🚀");
