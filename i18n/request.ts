// i18n/request.ts
// next-intl configuration for server-side translations

import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

// Supported locales
export const locales = ["sr", "sr-Cyrl", "en"] as const;
export const defaultLocale = "sr" as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  // 1. Check cookie first (User preference)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  if (localeCookie && (locales as readonly string[]).includes(localeCookie)) {
    return {
      locale: localeCookie as Locale,
      messages: (await import(`./messages/${localeCookie}.json`)).default,
      timeZone: "Europe/Belgrade",
      now: new Date(),
    };
  }

  // 2. Get locale from Accept-Language header or use default
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
