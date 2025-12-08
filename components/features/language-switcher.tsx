// components/features/language-switcher.tsx
"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "sr", name: "Srpski (latinica)", flag: "🇷🇸" },
  { code: "sr-Cyrl", name: "Српски (ћирилица)", flag: "🇷🇸" },
  { code: "en", name: "English", flag: "🇬🇧" },
] as const;

export function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Detect current locale from cookie or default to 'sr'
  const [currentLocale, setCurrentLocale] = useState<string>(
    typeof document !== "undefined"
      ? document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1] || "sr"
      : "sr",
  );

  const handleLanguageChange = (locale: string) => {
    startTransition(() => {
      // Set cookie for locale persistence
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;

      setCurrentLocale(locale);
      setIsOpen(false);

      // Refresh to apply new locale
      router.refresh();
    });
  };

  const currentLanguage =
    languages.find((lang) => lang.code === currentLocale) || languages[0];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage.flag}</span>
        <span className="hidden md:inline">{currentLanguage.name}</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={currentLocale === language.code}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 first:rounded-t-md last:rounded-b-md"
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
                {currentLocale === language.code && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
