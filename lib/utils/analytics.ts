/**
 * Analytics Utilities
 * Centralizovano praćenje analytics eventova
 */

import { log } from "@/lib/logger";

export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
}

/**
 * Track analytics event
 */
export function trackEvent(event: AnalyticsEvent) {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", event);
  }

  // Log to server
  log.info("Analytics event", event);

  // TODO: Integrate with analytics service (Google Analytics, Mixpanel, etc.)
  // Example:
  // if (typeof window !== "undefined" && window.gtag) {
  //   window.gtag("event", event.name, {
  //     event_category: event.category,
  //     ...event.properties,
  //   });
  // }
}

/**
 * Track page view
 */
export function trackPageView(path: string) {
  trackEvent({
    name: "page_view",
    category: "navigation",
    properties: { path },
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, action?: string) {
  trackEvent({
    name: "feature_usage",
    category: "features",
    properties: { feature, action },
  });
}

/**
 * Track error
 */
export function trackError(error: Error, context?: Record<string, any>) {
  trackEvent({
    name: "error",
    category: "errors",
    properties: {
      message: error.message,
      stack: error.stack,
      ...context,
    },
  });
}
