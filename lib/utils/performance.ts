/**
 * Performance Utilities
 * Optimizacije za bolje performanse aplikacije
 */

/**
 * Debounce function - za optimizaciju input polja
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - za optimizaciju scroll eventova
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImage(img: HTMLImageElement, src: string) {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = src;
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "50px" },
    );
    observer.observe(img);
  } else {
    // Fallback for older browsers
    img.src = src;
  }
}

/**
 * Prefetch resources
 */
export function prefetchResource(
  url: string,
  as: "script" | "style" | "image" | "font" = "script",
) {
  if (typeof document !== "undefined") {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = as;
    document.head.appendChild(link);
  }
}

/**
 * Preconnect to external domains
 */
export function preconnectDomain(url: string) {
  if (typeof document !== "undefined") {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = url;
    document.head.appendChild(link);
  }
}

/**
 * Batch DOM updates for better performance
 */
export function batchDOMUpdates(updates: (() => void)[]) {
  if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
    requestAnimationFrame(() => {
      updates.forEach((update) => update());
    });
  } else {
    updates.forEach((update) => update());
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Optimized scroll handler
 */
export function createOptimizedScrollHandler(
  callback: () => void,
  throttleMs: number = 100,
) {
  return throttle(callback, throttleMs);
}
