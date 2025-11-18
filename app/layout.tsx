import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./animations.css";
import "./accessibility.css";
import "./mobile.css";
import "./mobile-enhancements.css";
import "./mobile-optimizations.css";
import "./dyslexia-mode.css";
import "./page-header.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true,
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: {
    default: "Osnovci - Aplikacija za učenike i roditelje",
    template: "%s | Osnovci",
  },
  description:
    "Savršena aplikacija za učenike osnovne škole i njihove roditelje. Domaći zadaci sa dokazima, raspored časova, ocene, analitika i mnogo više.",
  keywords: [
    "osnovci",
    "škola",
    "domaći zadaci",
    "učenici",
    "roditelji",
    "raspored",
    "ocene",
  ],
  authors: [{ name: "Osnovci Tim" }],
  creator: "Osnovci",
  metadataBase: new URL(
    process.env["NEXTAUTH_URL"] || 
    (process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : "http://localhost:3000")
  ),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Osnovci",
    // iOS specific optimizations
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: "/",
    title: "Osnovci - Aplikacija za učenike i roditelje",
    description: "Savršena aplikacija za učenike i roditelje",
    siteName: "Osnovci",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // Support for notch/insets
};

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { getNonce } from "@/lib/security/csp";
import { Providers } from "./providers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get CSP nonce from middleware
  const nonce = await getNonce();

  return (
    <html lang="sr" data-scroll-behavior="smooth">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>"
        />
        <link
          rel="apple-touch-icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><text y='60' font-size='120'>📚</text></svg>"
        />
        {/* Mobile Optimizations */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        {/* DNS Prefetch & Preconnect for critical resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://vercel.app" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        {/* Performance hints */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-50 transition-colors duration-300`}
      >
        <Providers nonce={nonce}>
          <ErrorBoundary>
            {/* Main Content */}
            <main id="main-content">{children}</main>

            {/* Toast Notifications */}
            <Toaster position="top-center" />

            {/* Analytics */}
            <Analytics />
            <SpeedInsights />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
