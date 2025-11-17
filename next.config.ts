import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

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
    ...(process.env.NODE_ENV === "development" && process.env["UNOPTIMIZED_IMAGES"] === "true"
      ? { unoptimized: true }
      : {}),
  },

  // Headers - Security & Performance
  async headers() {
    // Content Security Policy - Relaxed for development, strict for production
    const ContentSecurityPolicy = (
      process.env.NODE_ENV === "production"
        ? `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https:;
        font-src 'self' data: https://cdn.jsdelivr.net;
        connect-src 'self' https: wss: https://vitals.vercel-insights.com;
        media-src 'self' blob:;
        worker-src 'self' blob:;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
        upgrade-insecure-requests;
      `
        : `
        default-src 'self' 'unsafe-inline' 'unsafe-eval';
        script-src 'self' 'unsafe-eval' 'unsafe-inline';
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https: http:;
        font-src 'self' data: https: http:;
        connect-src 'self' https: http: ws: wss:;
        media-src 'self' blob:;
        worker-src 'self' blob:;
      `
    )
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      {
        source: "/:path*",
        headers: [
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy,
          },
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
      bodySizeLimit: "2mb",
    },
    // Turbopack optimizations (when using --turbopack)
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Reduce build output
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

// Wrap with Sentry for error tracking
export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // Sentry Webpack Plugin Options
  ...(process.env["SENTRY_ORG"] && { org: process.env["SENTRY_ORG"] }),
  ...(process.env["SENTRY_PROJECT"] && { project: process.env["SENTRY_PROJECT"] }),
  ...(process.env["SENTRY_AUTH_TOKEN"] && { authToken: process.env["SENTRY_AUTH_TOKEN"] }),

  // Only upload source maps in production
  silent: process.env.NODE_ENV !== "production",

  // Upload source maps
  widenClientFileUpload: true,

  // Disable telemetry
  telemetry: false,
});
