// Skip Link Component - Accessibility Must-Have
// Omogućava korisnicima sa keyboard-om da preskoče navigaciju

"use client";

import { cn } from "@/lib/utils/cn";

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Skip Link - omogućava preskakanje ponavljajućeg sadržaja (navigation)
 *
 * Vidljiv samo kada dobije fokus (Tab key)
 * WCAG 2.1 AA requirement: Bypass Blocks (2.4.1)
 *
 * @example
 * ```tsx
 * <SkipLink href="#main-content">
 *   Preskoči na glavni sadržaj
 * </SkipLink>
 * ```
 */
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Default: Skriven (screen reader only)
        "sr-only",

        // Focus visible: Prikaži na top-left
        "focus:not-sr-only",
        "focus:fixed",
        "focus:top-4",
        "focus:left-4",
        "focus:z-50",

        // Styling
        "focus:inline-flex",
        "focus:items-center",
        "focus:gap-2",
        "focus:px-6",
        "focus:py-3",
        "focus:bg-blue-600",
        "focus:text-white",
        "focus:rounded-xl",
        "focus:shadow-2xl",
        "focus:font-medium",
        "focus:outline-none",
        "focus:ring-4",
        "focus:ring-blue-500/50",

        // Animation
        "transition-all",
        "duration-200",

        className,
      )}
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          // Focus target element
          (target as HTMLElement).focus();
          // Scroll into view
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
    >
      {children}
    </a>
  );
}

/**
 * Skip Links Container - Grupa skip linkova
 */
export function SkipLinks({ children }: { children: React.ReactNode }) {
  return (
    <nav aria-label="Skip navigation" className="fixed top-0 left-0 z-50">
      {children}
    </nav>
  );
}
