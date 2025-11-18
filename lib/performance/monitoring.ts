// Performance Monitoring Utilities - Track Core Web Vitals
"use client";

import { useEffect } from "react";
import { log } from "@/lib/logger";

/**
 * Core Web Vitals thresholds (Google standards)
 */
const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

type MetricName = keyof typeof WEB_VITALS_THRESHOLDS;

interface Metric {
  name: MetricName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

/**
 * Get metric rating based on value
 */
function getMetricRating(name: MetricName, value: number): Metric["rating"] {
  const thresholds = WEB_VITALS_THRESHOLDS[name];
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.needsImprovement) return "needs-improvement";
  return "poor";
}

/**
 * Log Core Web Vital
 */
function logWebVital(metric: Metric) {
  const { name, value, rating, id } = metric;

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vital] ${name}:`, {
      value: `${value.toFixed(2)}ms`,
      rating,
      id,
    });
  }

  // Log to monitoring service
  log.info("Web Vital", {
    metric: name,
    value,
    rating,
    id,
    url: window.location.href,
    userAgent: navigator.userAgent,
  });

  // Send to analytics (if available)
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", name, {
      value: Math.round(value),
      metric_id: id,
      metric_rating: rating,
    });
  }
}

/**
 * Hook to measure Core Web Vitals
 */
export function useWebVitals() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Dynamically import web-vitals to reduce bundle size
    import("web-vitals").then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      onCLS((metric) => logWebVital({ ...metric as any, rating: getMetricRating("CLS", metric.value) }));
      onFCP((metric) => logWebVital({ ...metric as any, rating: getMetricRating("FCP", metric.value) }));
      onINP((metric) => logWebVital({ ...metric as any, rating: getMetricRating("FID", metric.value) })); // INP replaced FID
      onLCP((metric) => logWebVital({ ...metric as any, rating: getMetricRating("LCP", metric.value) }));
      onTTFB((metric) => logWebVital({ ...metric as any, rating: getMetricRating("TTFB", metric.value) }));
    });
  }, []);
}

/**
 * Performance marks for custom metrics
 */
export const performanceMark = {
  start: (name: string) => {
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`${name}-start`);
    }
  },

  end: (name: string) => {
    if (typeof performance !== "undefined" && performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          log.info("Performance measure", {
            name,
            duration: measure.duration,
          });
        }
      } catch (error) {
        // Ignore errors if marks don't exist
      }
    }
  },
};

/**
 * Monitor component render time
 */
export function useRenderTime(componentName: string) {
  useEffect(() => {
    performanceMark.start(`render-${componentName}`);
    
    return () => {
      performanceMark.end(`render-${componentName}`);
    };
  }, [componentName]);
}

/**
 * Monitor API call performance
 */
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    
    log.info("API call completed", {
      endpoint: name,
      duration: `${duration.toFixed(2)}ms`,
      status: "success",
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    log.error("API call failed", error as Error, {
      endpoint: name,
      duration: `${duration.toFixed(2)}ms`,
    });
    
    throw error;
  }
}

/**
 * Check if device is low-end
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const connection = (navigator as any).connection;
  const memory = (performance as any).memory;

  // Check effective connection type
  if (connection) {
    if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
      return true;
    }
    if (connection.saveData) {
      return true;
    }
  }

  // Check device memory (if available)
  if (memory) {
    // Less than 4GB RAM
    if (memory.jsHeapSizeLimit < 4 * 1024 * 1024 * 1024) {
      return true;
    }
  }

  // Check hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }

  return false;
}

/**
 * Adaptive loading based on device capabilities
 */
export function useAdaptiveLoading() {
  const isLowEnd = isLowEndDevice();

  return {
    isLowEnd,
    shouldReduceAnimations: isLowEnd,
    shouldLazyLoad: isLowEnd,
    imagequality: isLowEnd ? 75 : 90,
    shouldPreload: !isLowEnd,
  };
}
