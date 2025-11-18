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

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "osnovci-sync") {
    event.waitUntil(
      syncPendingActions()
        .then((result) => {
          // Notify all clients about sync completion
          return self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "SYNC_COMPLETE",
                result,
              });
            });
          });
        })
        .catch((error) => {
          console.error("[Service Worker] Sync failed:", error);
        })
    );
  }
});

// Helper function to sync pending actions
async function syncPendingActions() {
  try {
    // Open IndexedDB and get pending actions
    const db = await openDB();
    const tx = db.transaction("pendingActions", "readonly");
    const store = tx.objectStore("pendingActions");
    const pendingActions = await store.getAll();
    await tx.done;

    if (pendingActions.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const action of pendingActions) {
      try {
        const result = await processPendingAction(action);
        if (result.success) {
          // Remove from pending queue
          const deleteTx = db.transaction("pendingActions", "readwrite");
          await deleteTx.objectStore("pendingActions").delete(action.id);
          await deleteTx.done;
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error("[Service Worker] Failed to sync action:", action, error);
        failed++;
      }
    }

    return { synced, failed };
  } catch (error) {
    console.error("[Service Worker] Sync error:", error);
    throw error;
  }
}

// Helper function to process a single pending action
async function processPendingAction(action) {
  const { action: actionType, entity, data, retryCount = 0 } = action;

  // Skip if too many retries
  if (retryCount >= 5) {
    return { success: false, error: "Max retries exceeded" };
  }

  let endpoint = "";
  let method = "POST";
  let body = null;

  switch (entity) {
    case "homework":
      endpoint = actionType === "delete" ? `/api/homework/${data.id}` : "/api/homework";
      method = actionType === "delete" ? "DELETE" : actionType === "update" ? "PUT" : "POST";
      body = JSON.stringify(data);
      break;

    case "attachment":
      endpoint = "/api/upload";
      method = "POST";
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("homeworkId", data.homeworkId);
      body = formData;
      break;

    case "note":
      endpoint = `/api/homework/${data.homeworkId}`;
      method = "PUT";
      body = JSON.stringify({ notes: data.notes });
      break;

    default:
      return { success: false, error: "Unknown entity type" };
  }

  try {
    const response = await fetch(endpoint, {
      method,
      headers: body instanceof FormData ? {} : { "Content-Type": "application/json" },
      body,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Service Worker] API call failed:", error);
    return { success: false, error: error.message };
  }
}

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("osnovci-offline", 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains("pendingActions")) {
        db.createObjectStore("pendingActions", { keyPath: "id", autoIncrement: true });
      }
    };
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
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/"),
  );
});
