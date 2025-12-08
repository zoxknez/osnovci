/**
 * Memory Cleanup Utilities
 * Helper functions for managing memory and preventing leaks
 */

/**
 * Cleanup rate limiter memory periodically
 */
export function startRateLimiterCleanup(
  cleanupFn: () => void,
  intervalMs = 60000, // 1 minute
): () => void {
  const interval = setInterval(() => {
    try {
      cleanupFn();
    } catch (error) {
      // Silently fail - cleanup is non-critical
      if (process.env.NODE_ENV === "development") {
        console.error("Rate limiter cleanup error:", error);
      }
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Monitor memory usage and warn if too high
 */
export function monitorMemoryUsage(
  threshold = 0.9, // 90%
  callback?: (usage: NodeJS.MemoryUsage) => void,
): () => void {
  const checkInterval = setInterval(() => {
    const usage = process.memoryUsage();
    const percentage = usage.heapUsed / usage.heapTotal;

    if (percentage > threshold && callback) {
      callback(usage);
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(checkInterval);
}

/**
 * Force garbage collection if available (development only)
 */
export function forceGC(): void {
  if (
    process.env.NODE_ENV === "development" &&
    global.gc &&
    typeof global.gc === "function"
  ) {
    global.gc();
  }
}

/**
 * Cleanup function for arrays/maps
 */
export function cleanupOldEntries<T>(
  entries: Map<string, T[]> | T[],
  maxAge: number,
  getTimestamp?: (item: T) => number,
): void {
  if (Array.isArray(entries)) {
    const now = Date.now();
    const filtered = entries.filter((item) => {
      if (!getTimestamp) return true;
      const timestamp = getTimestamp(item);
      return now - timestamp < maxAge;
    });
    entries.length = 0;
    entries.push(...filtered);
  } else {
    const now = Date.now();
    for (const [key, items] of entries.entries()) {
      if (!getTimestamp) continue;
      const filtered = items.filter(
        (item) => now - getTimestamp(item) < maxAge,
      );
      if (filtered.length === 0) {
        entries.delete(key);
      } else {
        entries.set(key, filtered);
      }
    }
  }
}
