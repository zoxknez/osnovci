/**
 * Robots.txt generation for SEO
 * Kontroliše pristup pretraživača sajtu
 */

import type { MetadataRoute } from "next";

const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] || "https://osnovci.rs";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/consent-verify/",
          "/account-inactive/",
          "/consent-required/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
