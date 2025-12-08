/**
 * Cache Utilities
 * In-memory cache sa TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

// Auto cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(
    () => {
      memoryCache.cleanup();
    },
    5 * 60 * 1000,
  );
}

/**
 * Cached fetch wrapper
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl: number = 5 * 60 * 1000,
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;

  // Check cache
  const cached = memoryCache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  memoryCache.set(cacheKey, data, ttl);

  return data;
}
