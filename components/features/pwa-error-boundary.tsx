"use client";

import { Component, type ReactNode } from "react";
import { log } from "@/lib/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Silent Error Boundary za PWA features (Service Worker, Sync, Notifications)
 * Ne prikazuje UI error, samo loguje i gracefully degradira funkcionalnost
 */
export class PWAErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log za monitoring - ne bockamo korisnika
    log.error("PWA Feature Error (gracefully degraded)", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    console.warn(
      "PWA feature encountered an error but application continues normally:",
      error,
    );

    // Log to monitoring service
    if (typeof window !== "undefined" && "Sentry" in window) {
      // @ts-expect-error - Sentry is dynamically loaded
      window.Sentry?.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: "pwa",
          feature: this.identifyFeature(error),
        },
        level: "warning", // Not critical - app still works
      });
    }
  }

  /**
   * Pokušava da identifikuje koji PWA feature je failed
   */
  private identifyFeature(error: Error): string {
    const message = error.message.toLowerCase();

    if (
      message.includes("service worker") ||
      message.includes("serviceworker")
    ) {
      return "service-worker";
    }
    if (message.includes("indexeddb") || message.includes("idb")) {
      return "offline-storage";
    }
    if (message.includes("notification") || message.includes("push")) {
      return "notifications";
    }
    if (message.includes("sync") || message.includes("background")) {
      return "background-sync";
    }

    return "unknown";
  }

  render() {
    // Ne prikazujemo error UI - PWA features su enhancement, ne requirement
    // Aplikacija radi i bez njih
    return this.props.children;
  }
}
