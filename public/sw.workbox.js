// Service Worker - PWA Support with Workbox v7
// Production-grade Service Worker with caching strategies

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js",
);

const { precacheAndRoute } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// Precache static assets (will be populated by build script)
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache Strategy 1: App Shell - Cache First
registerRoute(
  ({ request }) => request.destination === "document",
  new CacheFirst({
    cacheName: "app-shell-v5",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  }),
);

// Cache Strategy 2: Static Assets (CSS, JS) - Stale While Revalidate
registerRoute(
  ({ request }) =>
    request.destination === "style" || request.destination === "script",
  new StaleWhileRevalidate({
    cacheName: "static-resources-v5",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  }),
);

// Cache Strategy 3: Images - Cache First with expiration
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-v5",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
      }),
    ],
  }),
);

// Cache Strategy 4: API Calls - Network First with fallback
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache-v5",
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  }),
);

// Cache Strategy 5: Fonts - Cache First
registerRoute(
  ({ request }) => request.destination === "font",
  new CacheFirst({
    cacheName: "fonts-v5",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  }),
);

// Background Sync for Homework Submissions
const homeworkSyncPlugin = new BackgroundSyncPlugin("homework-queue", {
  maxRetentionTime: 24 * 60, // Retry for max 24 hours (in minutes)
  onSync: async ({ queue }) => {
    console.log("[SW] Background Sync: Processing homework queue");
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log("[SW] Background Sync: Homework synced successfully");
      } catch (error) {
        console.error("[SW] Background Sync: Failed to sync homework", error);
        // Re-queue for retry
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Intercept homework POST requests for background sync
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/api/homework") && request.method === "POST",
  new NetworkFirst({
    cacheName: "homework-submissions",
    plugins: [
      homeworkSyncPlugin,
      new CacheableResponsePlugin({
        statuses: [0, 200, 201],
      }),
    ],
  }),
  "POST",
);

// Install and Activate handlers
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Workbox v7 Service Worker");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Workbox v7 Service Worker");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.endsWith("-v5"))
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );
    }),
  );
  self.clients.claim();
});

// Push notifications support
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received", event);

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || "Nova poruka za tebe!",
    icon: data.icon || "/icons/icon-192x192.svg",
    badge: "/icons/icon-96x96.svg",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
      dateOfArrival: Date.now(),
      primaryKey: data.id,
    },
    actions: data.actions || [
      {
        action: "open",
        title: "Otvori",
        icon: "/icons/checkmark.svg",
      },
      {
        action: "close",
        title: "Zatvori",
        icon: "/icons/close.svg",
      },
    ],
    requireInteraction: data.requireInteraction || false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Osnovci", options),
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked", event.action);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open with this URL
        for (const client of windowClients) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Message handler for client communication
self.addEventListener("message", (event) => {
  console.log("[SW] Message received from client", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLAIM_CLIENTS") {
    self.clients.claim();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: "workbox-v5" });
  }
});

console.log("[SW] Workbox v7 Service Worker loaded successfully");
