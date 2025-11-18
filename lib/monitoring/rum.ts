/**
 * Real User Monitoring (RUM) System
 * 
 * Tracks real user experience metrics:
 * - Page load times
 * - User interactions
 * - Navigation timing
 * - Resource loading
 * - Custom events
 * - Session tracking
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { trackPageView, trackAction } from "@/lib/monitoring/sentry-utils";
import { reportWebVital, type WebVitalMetric } from "@/lib/performance/monitor";

// ===========================================
// SESSION TRACKING
// ===========================================

interface SessionData {
  id: string;
  startTime: number;
  pageViews: number;
  interactions: number;
  errors: number;
  lastActivityTime: number;
}

let currentSession: SessionData | null = null;

/**
 * Initialize or get current session
 */
function getSession(): SessionData {
  if (!currentSession) {
    currentSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      errors: 0,
      lastActivityTime: Date.now(),
    };
  }
  
  currentSession.lastActivityTime = Date.now();
  return currentSession;
}

/**
 * End current session
 */
function endSession() {
  if (currentSession) {
    const duration = Date.now() - currentSession.startTime;
    
    // Send session summary
    sendMetric("session_end", {
      sessionId: currentSession.id,
      duration,
      pageViews: currentSession.pageViews,
      interactions: currentSession.interactions,
      errors: currentSession.errors,
    });
    
    currentSession = null;
  }
}

// End session on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", endSession);
}

// ===========================================
// METRIC COLLECTION
// ===========================================

interface Metric {
  name: string;
  value: number | string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const metrics: Metric[] = [];
const MAX_METRICS = 1000;

/**
 * Send metric to analytics
 */
export function sendMetric(
  name: string,
  data: Record<string, unknown>
) {
  const metric: Metric = {
    name,
    value: typeof data["value"] === "number" ? data["value"] : JSON.stringify(data),
    timestamp: Date.now(),
    metadata: data,
  };
  
  metrics.push(metric);
  
  // Keep only last MAX_METRICS
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }
  
  // Send to analytics service
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, data);
  }
}

/**
 * Get all collected metrics
 */
export function getMetrics(): Metric[] {
  return [...metrics];
}

/**
 * Clear all metrics
 */
export function clearMetrics() {
  metrics.length = 0;
}

// ===========================================
// PAGE PERFORMANCE TRACKING
// ===========================================

/**
 * Track page load performance
 */
export function trackPageLoad() {
  if (typeof window === "undefined" || !window.performance) return;
  
  const session = getSession();
  session.pageViews++;
  
  // Wait for page to fully load
  window.addEventListener("load", () => {
    setTimeout(() => {
      const navTiming = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      
      if (navTiming) {
        sendMetric("page_load", {
          url: window.location.pathname,
          sessionId: session.id,
          
          // Core timing metrics
          dns: navTiming.domainLookupEnd - navTiming.domainLookupStart,
          tcp: navTiming.connectEnd - navTiming.connectStart,
          ttfb: navTiming.responseStart - navTiming.requestStart,
          download: navTiming.responseEnd - navTiming.responseStart,
          domInteractive: navTiming.domInteractive - navTiming.fetchStart,
          domComplete: navTiming.domComplete - navTiming.fetchStart,
          loadComplete: navTiming.loadEventEnd - navTiming.fetchStart,
          
          // Navigation type
          type: navTiming.type,
        });
      }
      
      // Resource timing
      const resources = window.performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const resourceStats = {
        total: resources.length,
        scripts: resources.filter((r) => r.initiatorType === "script").length,
        styles: resources.filter((r) => r.initiatorType === "link").length,
        images: resources.filter((r) => r.initiatorType === "img").length,
        xhr: resources.filter((r) => r.initiatorType === "xmlhttprequest").length,
        fetch: resources.filter((r) => r.initiatorType === "fetch").length,
      };
      
      sendMetric("resources_loaded", {
        url: window.location.pathname,
        sessionId: session.id,
        ...resourceStats,
      });
    }, 0);
  });
}

// ===========================================
// USER INTERACTION TRACKING
// ===========================================

/**
 * Track user click
 */
export function trackClick(
  element: string,
  metadata?: Record<string, unknown>
) {
  const session = getSession();
  session.interactions++;
  
  sendMetric("user_click", {
    element,
    sessionId: session.id,
    timestamp: Date.now(),
    ...metadata,
  });
  
  trackAction("click", { element, ...metadata });
}

/**
 * Track form submission
 */
export function trackFormSubmit(
  formName: string,
  success: boolean,
  metadata?: Record<string, unknown>
) {
  const session = getSession();
  session.interactions++;
  
  sendMetric("form_submit", {
    form: formName,
    success,
    sessionId: session.id,
    ...metadata,
  });
  
  trackAction("form_submit", { formName, success, ...metadata });
}

/**
 * Track navigation
 */
export function trackNavigation(from: string, to: string) {
  const session = getSession();
  session.pageViews++;
  
  sendMetric("navigation", {
    from,
    to,
    sessionId: session.id,
    timestamp: Date.now(),
  });
  
  trackPageView(to);
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(depth: number) {
  sendMetric("scroll_depth", {
    depth,
    url: window.location.pathname,
    timestamp: Date.now(),
  });
}

// ===========================================
// ERROR TRACKING
// ===========================================

/**
 * Track client-side error
 */
export function trackError(
  error: Error,
  context?: Record<string, unknown>
) {
  const session = getSession();
  session.errors++;
  
  sendMetric("client_error", {
    message: error.message,
    stack: error.stack,
    sessionId: session.id,
    url: window.location.pathname,
    ...context,
  });
}

// ===========================================
// CUSTOM EVENTS
// ===========================================

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  data?: Record<string, unknown>
) {
  const session = getSession();
  
  sendMetric(eventName, {
    sessionId: session.id,
    timestamp: Date.now(),
    ...data,
  });
}

// ===========================================
// REACT HOOKS FOR RUM
// ===========================================

/**
 * Hook to track page views automatically
 */
export function usePageTracking() {
  useEffect(() => {
    trackPageLoad();
    trackPageView(window.location.pathname);
  }, []);
}

/**
 * Hook to track Web Vitals automatically
 */
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Import web-vitals dynamically
    import("web-vitals").then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      onCLS((metric: WebVitalMetric) => {
        reportWebVital(metric);
        sendMetric("web_vital_cls", {
          value: metric.value,
          rating: metric.rating,
        });
      });
      
      onINP((metric: WebVitalMetric) => {
        reportWebVital(metric);
        sendMetric("web_vital_inp", {
          value: metric.value,
          rating: metric.rating,
        });
      });
      
      onLCP((metric: WebVitalMetric) => {
        reportWebVital(metric);
        sendMetric("web_vital_lcp", {
          value: metric.value,
          rating: metric.rating,
        });
      });
      
      onFCP((metric: WebVitalMetric) => {
        reportWebVital(metric);
        sendMetric("web_vital_fcp", {
          value: metric.value,
          rating: metric.rating,
        });
      });
      
      onTTFB((metric: WebVitalMetric) => {
        reportWebVital(metric);
        sendMetric("web_vital_ttfb", {
          value: metric.value,
          rating: metric.rating,
        });
      });
    });
  }, []);
}

/**
 * Hook to track scroll depth
 */
export function useScrollTracking() {
  const [maxDepth, setMaxDepth] = useState(0);
  const lastReported = useRef(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      const depth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
      
      if (depth > maxDepth) {
        setMaxDepth(depth);
        
        // Report in 25% increments
        const milestones = [25, 50, 75, 100];
        const nextMilestone = milestones.find((m) => m > lastReported.current && depth >= m);
        
        if (nextMilestone) {
          trackScrollDepth(nextMilestone);
          lastReported.current = nextMilestone;
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [maxDepth]);
}

/**
 * Hook to track time on page
 */
export function useTimeOnPage() {
  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const timeSpent = Date.now() - startTime;
      sendMetric("time_on_page", {
        url: window.location.pathname,
        duration: timeSpent,
      });
    };
  }, []);
}

// Type augmentation
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void;
  }
}
