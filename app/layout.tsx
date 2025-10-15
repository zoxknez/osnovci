import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./mobile-enhancements.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
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
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Osnovci",
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
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { PWAInstaller } from "@/components/features/pwa-installer";
import { SkipLink } from "@/components/features/skip-link";
import { SyncManager } from "@/components/features/sync-manager";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-50 dark:bg-gray-900`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            {/* Accessibility: Skip Links - WCAG 2.1 AA */}
            <SkipLink href="#main-content">Preskoči na glavni sadržaj</SkipLink>

            {/* PWA Features */}
            <PWAInstaller />
            <SyncManager />

            {/* Main Content */}
            {children}

            {/* Global Notifications */}
            <Toaster position="top-center" richColors />

            {/* Analytics & Performance Monitoring */}
            <Analytics />
            <SpeedInsights />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
