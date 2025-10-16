import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./mobile-enhancements.css";
import "./dyslexia-mode.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><text y='60' font-size='120'>📚</text></svg>" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="true" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-50 transition-colors duration-300`}
      >
        <ErrorBoundary>
          {/* Main Content */}
          <main id="main-content">
            {children}
          </main>
          
          {/* Toast Notifications */}
          <Toaster position="top-center" />
          
          {/* Analytics */}
          <Analytics />
          <SpeedInsights />
        </ErrorBoundary>
      </body>
    </html>
  );
}
