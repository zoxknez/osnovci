// Advanced Accessibility Helpers - WCAG 2.1 AAA Compliance
"use client";

/**
 * Announce to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite",
): void {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announced
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within element (for modals, dropdowns)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (firstFocusable && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (lastFocusable && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener("keydown", handleKeyDown);

  // Return cleanup function
  return () => {
    element.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Get readable color contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Calculate luminance
    const linear = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
    );

    const rLinear = linear[0] ?? 0;
    const gLinear = linear[1] ?? 0;
    const bLinear = linear[2] ?? 0;

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if colors meet WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA",
  size: "normal" | "large" = "normal",
): boolean {
  const ratio = getContrastRatio(foreground, background);

  const requirements = {
    AA: size === "large" ? 3 : 4.5,
    AAA: size === "large" ? 4.5 : 7,
  };

  return ratio >= requirements[level];
}

/**
 * Generate accessible label for time
 */
export function getAccessibleTime(date: Date): string {
  return new Intl.DateTimeFormat("sr-RS", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(date);
}

/**
 * Generate accessible label for date
 */
export function getAccessibleDate(date: Date): string {
  return new Intl.DateTimeFormat("sr-RS", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Generate accessible label for relative time
 */
export function getAccessibleRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "danas";
  if (days === 1) return "sutra";
  if (days === -1) return "juče";
  if (days > 1) return `za ${days} dana`;
  if (days < -1) return `pre ${Math.abs(days)} dana`;

  return getAccessibleDate(date);
}

/**
 * Add skip link for keyboard navigation
 */
export function addSkipLink(
  targetId: string,
  label: string = "Preskoči na glavni sadržaj",
): HTMLAnchorElement {
  const skipLink = document.createElement("a");
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className =
    "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded";

  document.body.insertBefore(skipLink, document.body.firstChild);

  return skipLink;
}

/**
 * Keyboard shortcut manager
 */
export class KeyboardShortcutManager {
  private shortcuts = new Map<string, () => void>();

  register(key: string, callback: () => void, description?: string): void {
    this.shortcuts.set(key.toLowerCase(), callback);

    if (description) {
      console.log(`[Keyboard Shortcut] ${key}: ${description}`);
    }
  }

  unregister(key: string): void {
    this.shortcuts.delete(key.toLowerCase());
  }

  listen(): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const withCtrl = e.ctrlKey || e.metaKey;
      const withShift = e.shiftKey;

      const shortcutKey = `${withCtrl ? "ctrl+" : ""}${withShift ? "shift+" : ""}${key}`;

      const callback = this.shortcuts.get(shortcutKey);
      if (callback) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }

  getRegisteredShortcuts(): Array<{ key: string }> {
    return Array.from(this.shortcuts.keys()).map((key) => ({ key }));
  }
}

/**
 * High contrast mode detection
 */
export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: more)").matches;
}

/**
 * Reduced motion detection
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Add ARIA live region
 */
export function createLiveRegion(
  id: string,
  priority: "polite" | "assertive" = "polite",
): HTMLDivElement {
  const existing = document.getElementById(id);
  if (existing) {
    return existing as HTMLDivElement;
  }

  const liveRegion = document.createElement("div");
  liveRegion.id = id;
  liveRegion.setAttribute("role", "status");
  liveRegion.setAttribute("aria-live", priority);
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.className = "sr-only";

  document.body.appendChild(liveRegion);

  return liveRegion;
}

/**
 * Update live region with message
 */
export function updateLiveRegion(id: string, message: string): void {
  const liveRegion = document.getElementById(id);
  if (liveRegion) {
    liveRegion.textContent = message;
  }
}

/**
 * Get accessible file size
 */
export function getAccessibleFileSize(bytes: number): string {
  const units = ["bajtova", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
