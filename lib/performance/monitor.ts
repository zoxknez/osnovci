/**
 * Performance Monitoring & Metrics
 * 
 * Tracks and reports application performance metrics:
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - Custom performance marks
 * - API response times
 * - Database query times
 * - Component render times
 */

import { log } from "@/lib/logger";

// ===========================================
// WEB VITALS MONITORING
// ===========================================

export interface WebVitalMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

/**
 * Report Web Vital to analytics
 */
export function reportWebVital(metric: WebVitalMetric) {
  log.info("Web Vital", {
    metric: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating,
    id: metric.id,
  });

  // Send to analytics service (e.g., Google Analytics)
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    });
  }
}

// ===========================================
// CUSTOM PERFORMANCE MARKS
// ===========================================

/**
 * Mark performance timing point
 */
export function markPerformance(name: string) {
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure time between two marks
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance !== "undefined" && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0] as PerformanceEntry;
      return measure?.duration ?? null;
    } catch (error) {
      log.error("Performance measurement failed", error, { name });
      return null;
    }
  }
  return null;
}

/**
 * Clear performance marks and measures
 */
export function clearPerformanceMarks(...marks: string[]) {
  if (typeof performance !== "undefined") {
    marks.forEach((mark) => {
      performance.clearMarks(mark);
      performance.clearMeasures(mark);
    });
  }
}

// ===========================================
// API PERFORMANCE TRACKING
// ===========================================

export interface ApiMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

const apiMetrics: ApiMetrics[] = [];
const MAX_METRICS = 100; // Keep last 100 metrics

/**
 * Track API call performance
 */
export function trackApiCall(metrics: ApiMetrics) {
  apiMetrics.push(metrics);
  
  // Keep only last MAX_METRICS
  if (apiMetrics.length > MAX_METRICS) {
    apiMetrics.shift();
  }

  // Log slow API calls (>1s)
  if (metrics.duration > 1000) {
    log.warn("Slow API call", {
      endpoint: metrics.endpoint,
      duration: `${metrics.duration}ms`,
      status: metrics.status,
    });
  }
}

/**
 * Get API performance statistics
 */
export function getApiStats(): {
  averageDuration: number;
  slowestCall: ApiMetrics | null;
  fastestCall: ApiMetrics | null;
  totalCalls: number;
} {
  if (apiMetrics.length === 0) {
    return {
      averageDuration: 0,
      slowestCall: null,
      fastestCall: null,
      totalCalls: 0,
    };
  }

  const durations = apiMetrics.map((m) => m.duration);
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;

  return {
    averageDuration: Math.round(avg),
    slowestCall: apiMetrics.reduce((prev, curr) =>
      curr.duration > prev.duration ? curr : prev
    ),
    fastestCall: apiMetrics.reduce((prev, curr) =>
      curr.duration < prev.duration ? curr : prev
    ),
    totalCalls: apiMetrics.length,
  };
}

/**
 * Create fetch wrapper with performance tracking
 */
export function createTrackedFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const startTime = performance.now();
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method ?? "GET";

    try {
      const response = await fetch(input, init);
      const duration = performance.now() - startTime;

      trackApiCall({
        endpoint: url,
        method,
        duration,
        status: response.status,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      trackApiCall({
        endpoint: url,
        method,
        duration,
        status: 0,
        timestamp: Date.now(),
      });

      throw error;
    }
  };
}

// ===========================================
// COMPONENT RENDER TRACKING
// ===========================================

/**
 * Track component render time (use in useEffect)
 */
export function trackRenderTime(componentName: string, renderStart: number) {
  const duration = performance.now() - renderStart;

  if (duration > 100) {
    log.warn("Slow component render", {
      component: componentName,
      duration: `${duration.toFixed(2)}ms`,
    });
  }
}

// ===========================================
// DATABASE QUERY TRACKING (Server-side)
// ===========================================

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  result?: string;
}

const queryMetrics: QueryMetrics[] = [];

/**
 * Track database query performance
 */
export function trackQuery(metrics: QueryMetrics) {
  queryMetrics.push(metrics);

  // Keep only last 100 queries
  if (queryMetrics.length > MAX_METRICS) {
    queryMetrics.shift();
  }

  // Log slow queries (>500ms)
  if (metrics.duration > 500) {
    log.warn("Slow database query", {
      query: metrics.query,
      duration: `${metrics.duration}ms`,
    });
  }
}

/**
 * Get query performance statistics
 */
export function getQueryStats(): {
  averageDuration: number;
  slowestQuery: QueryMetrics | null;
  totalQueries: number;
} {
  if (queryMetrics.length === 0) {
    return {
      averageDuration: 0,
      slowestQuery: null,
      totalQueries: 0,
    };
  }

  const durations = queryMetrics.map((m) => m.duration);
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;

  return {
    averageDuration: Math.round(avg),
    slowestQuery: queryMetrics.reduce((prev, curr) =>
      curr.duration > prev.duration ? curr : prev
    ),
    totalQueries: queryMetrics.length,
  };
}

/**
 * Create Prisma extension for query tracking
 */
export function createQueryTracker() {
  return {
    name: "queryTracker",
    query: {
      async $allOperations({ operation, model, query }: {
        operation: string;
        model?: string;
        query: () => Promise<unknown>;
      }) {
        const startTime = performance.now();
        try {
          const result = await query();
          const duration = performance.now() - startTime;

          trackQuery({
            query: `${model}.${operation}`,
            duration,
            timestamp: Date.now(),
            result: "success",
          });

          return result;
        } catch (error) {
          const duration = performance.now() - startTime;

          trackQuery({
            query: `${model}.${operation}`,
            duration,
            timestamp: Date.now(),
            result: "error",
          });

          throw error;
        }
      },
    },
  };
}

// ===========================================
// PERFORMANCE BUDGET MONITORING
// ===========================================

export interface PerformanceBudget {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift (score)
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
}

export const PERFORMANCE_BUDGET: PerformanceBudget = {
  lcp: 2500, // 2.5s (good)
  fid: 100, // 100ms (good)
  cls: 0.1, // 0.1 (good)
  fcp: 1800, // 1.8s (good)
  ttfb: 800, // 800ms (good)
};

/**
 * Check if metric is within budget
 */
export function isWithinBudget(
  metricName: keyof PerformanceBudget,
  value: number
): boolean {
  return value <= PERFORMANCE_BUDGET[metricName];
}

/**
 * Get performance rating
 */
export function getPerformanceRating(
  metricName: keyof PerformanceBudget,
  value: number
): "good" | "needs-improvement" | "poor" {
  const budget = PERFORMANCE_BUDGET[metricName];
  const threshold1 = budget;
  const threshold2 = budget * 2;

  if (value <= threshold1) return "good";
  if (value <= threshold2) return "needs-improvement";
  return "poor";
}

// ===========================================
// EXPORT PERFORMANCE REPORT
// ===========================================

/**
 * Generate comprehensive performance report
 */
export function getPerformanceReport() {
  return {
    api: getApiStats(),
    queries: getQueryStats(),
    timestamp: new Date().toISOString(),
  };
}

// Type augmentation for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params: Record<string, unknown>
    ) => void;
  }
}
