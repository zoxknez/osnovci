// i18n/request.ts
// next-intl configuration for server-side translations

import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

// Supported locales
export const locales = ["sr", "sr-Cyrl", "en"] as const;
export const defaultLocale = "sr" as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  // Get locale from Accept-Language header or use default
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  // Simple locale detection (prefer Serbian)
  let locale: Locale = defaultLocale;

  if (acceptLanguage.toLowerCase().includes("en")) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "Europe/Belgrade",
    now: new Date(),
  };
});
