import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance Optimization
  reactStrictMode: true,

  // Allow mobile dev access from local network
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: ["192.168.1.101", "localhost", "127.0.0.1"],
  }),

  // Image Optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers - Security & Performance
  async headers() {
    // Content Security Policy
    const ContentSecurityPolicy = `
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
      ${process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : ""}
    `
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
            value: process.env.NODE_ENV === "production" ? "same-origin" : "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: process.env.NODE_ENV === "production" ? "require-corp" : "unsafe-none",
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
    ];
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};

export default nextConfig;
