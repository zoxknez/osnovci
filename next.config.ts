import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// i18n Configuration
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Bundle Analyzer (optional, only for development)
let withBundleAnalyzer: (config: NextConfig) => NextConfig;
try {
  withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env["ANALYZE"] === "true",
  });
} catch {
  // Bundle analyzer not installed, use identity function
  withBundleAnalyzer = (config) => config;
}

const nextConfig: NextConfig = {
  // Performance Optimization
  reactStrictMode: true,

  // Allow mobile dev access from local network
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: ["192.168.1.101", "localhost", "127.0.0.1"],
  }),

  // Image Optimization - Modern formats and sizes
  images: {
    formats: ["image/webp", "image/avif"], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Added 2048 for high-DPI displays
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Remote patterns for external images (if needed in future)
    remotePatterns: [],
    // Unoptimized flag for development (can improve dev performance)
    ...(process.env.NODE_ENV === "development" &&
    process.env["UNOPTIMIZED_IMAGES"] === "true"
      ? { unoptimized: true }
      : {}),
  },

  // Headers - Security & Performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Strict Transport Security - DISABLED for development
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
          // DNS Prefetch Control
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Frame Options
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Content Type Options
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
          },
          // XSS Protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Cross-Origin Policies - RELAXED for development
          {
            key: "Cross-Origin-Opener-Policy",
            value:
              process.env.NODE_ENV === "production"
                ? "same-origin"
                : "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value:
              process.env.NODE_ENV === "production"
                ? "require-corp"
                : "unsafe-none",
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=31536000",
          },
        ],
      },
      // Font files caching
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Service Worker caching
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      // Manifest caching
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400",
          },
        ],
      },
    ];
  },

  // Compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"], // Keep errors and warnings for debugging
          }
        : false,
  },

  // React Compiler (React 19) - Automatic memoization (moved to top-level)
  reactCompiler: true,

  // Experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "date-fns",
      "react-hook-form",
      "@tanstack/react-query",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "next-themes",
    ],
    // Server Actions optimizations
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Client Trace Metadata for better debugging
    clientTraceMetadata: ["environment", "nextjs"],
  },

  // Server external packages - exclude problematic packages from bundling
  // This prevents Turbopack from trying to bundle test files and dependencies
  serverExternalPackages: ["pino", "thread-stream", "bullmq", "ioredis"],

  // Output standalone for better Docker builds
  ...(process.env.NODE_ENV === "production" && { output: "standalone" }),
  typescript: {
    ignoreBuildErrors: false,
  },
};

// Wrap with i18n, Bundle Analyzer, and Sentry
export default withSentryConfig(withBundleAnalyzer(withNextIntl(nextConfig)), {
  // Sentry Webpack Plugin Options
  ...(process.env["SENTRY_ORG"] && { org: process.env["SENTRY_ORG"] }),
  ...(process.env["SENTRY_PROJECT"] && {
    project: process.env["SENTRY_PROJECT"],
  }),
  ...(process.env["SENTRY_AUTH_TOKEN"] && {
    authToken: process.env["SENTRY_AUTH_TOKEN"],
  }),

  // Only upload source maps in production
  silent: process.env.NODE_ENV !== "production",

  // Upload source maps
  widenClientFileUpload: true,

  // Disable telemetry
  telemetry: false,
});
