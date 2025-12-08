// Service Worker - PWA Support
// Modern, optimized Service Worker for offline functionality

const CACHE_NAME = "osnovci-v4";
const urlsToCache = ["/", "/favicon.ico"];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Add URLs individually to avoid blocking on 404s
        return Promise.allSettled(
          urlsToCache.map((url) =>
            cache.add(url).catch(() => {
              // Silently fail for optional resources
            }),
          ),
        );
      })
      .catch(() => {
        // Installation can continue even if some resources fail
      }),
  );
  // Force waiting service worker to become active immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip API routes and external resources
  if (
    request.url.includes("/api/") ||
    !request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fetch from network
      return fetch(request)
        .then((response) => {
          // Only cache successful GET responses
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            // Clone response for caching (responses can only be consumed once)
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed - return offline fallback if available
          return caches.match("/offline.html").catch(() => {
            // No offline page available
            return new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "text/plain" },
            });
          });
        });
    }),
  );
});

// Background sync for offline actions (if supported)
if ("sync" in self.registration) {
  self.addEventListener("sync", (event) => {
    if (event.tag === "sync-homework") {
      event.waitUntil(
        // Sync logic would go here
        Promise.resolve(),
      );
    }
  });
}

// Push notifications support (if needed in future)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icons/icon-192x192.svg",
        badge: "/icons/icon-96x96.svg",
        data: data.data,
      }),
    );
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
