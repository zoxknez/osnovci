/**
 * Sitemap generation for SEO
 * Generiše sitemap.xml za pretraživače
 */

import type { MetadataRoute } from "next";

const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] || "https://osnovci.rs";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  // Static pages
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/prijava`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/registracija`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];

  // Dashboard pages (visible to search engines for discoverability)
  const dashboardPages = [
    "dashboard",
    "dashboard/domaci",
    "dashboard/ocene",
    "dashboard/raspored",
    "dashboard/porodica",
    "dashboard/postignuca",
    "dashboard/profil",
    "dashboard/podesavanja",
    "dashboard/pernica",
  ].map((path) => ({
    url: `${BASE_URL}/${path}`,
    lastModified: currentDate,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...dashboardPages];
}
