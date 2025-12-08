import type React from "react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Accessibility Context - Global a11y settings and helpers
 * Supports: High Contrast, Dyslexia Mode, ADHD Mode, Reduced Motion, Screen Reader
 */

interface AccessibilitySettings {
  // Visual modes
  highContrast: boolean;
  dyslexiaMode: boolean;
  adhdMode: boolean;
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";

  // Motion preferences
  reducedMotion: boolean;

  // Text preferences
  fontSize: "small" | "medium" | "large" | "x-large";
  textSpacing: boolean;

  // Interaction preferences
  showFocusIndicators: boolean;
  keyboardNavigationMode: boolean;
  touchTargetSize: "normal" | "large";

  // Screen reader
  screenReaderMode: boolean;
  announceChanges: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ) => void;
  resetSettings: () => void;
  announceToScreenReader: (
    message: string,
    priority?: "polite" | "assertive",
  ) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  dyslexiaMode: false,
  adhdMode: false,
  colorBlindMode: "none",
  reducedMotion: false,
  fontSize: "medium",
  textSpacing: false,
  showFocusIndicators: true,
  keyboardNavigationMode: false,
  touchTargetSize: "normal",
  screenReaderMode: false,
  announceChanges: true,
};

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("accessibility-settings");
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // Detect system preferences
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setSettings((prev) => ({ ...prev, reducedMotion: true }));
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings((prev) => ({ ...prev, reducedMotion: e.matches }));
    };

    motionQuery.addEventListener("change", handleMotionChange);

    // Detect high contrast preference
    const contrastQuery = window.matchMedia("(prefers-contrast: high)");
    if (contrastQuery.matches) {
      setSettings((prev) => ({ ...prev, highContrast: true }));
    }

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setSettings((prev) => ({ ...prev, highContrast: e.matches }));
    };

    contrastQuery.addEventListener("change", handleContrastChange);

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        setSettings((prev) => ({ ...prev, keyboardNavigationMode: true }));
      }
    };

    const handleMouseDown = () => {
      setSettings((prev) => ({ ...prev, keyboardNavigationMode: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      contrastQuery.removeEventListener("change", handleContrastChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  // Apply settings to DOM
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    // Apply CSS classes
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle("dyslexia-mode", settings.dyslexiaMode);
    root.classList.toggle("adhd-mode", settings.adhdMode);
    root.classList.toggle("text-spacing-enhanced", settings.textSpacing);
    root.classList.toggle("keyboard-nav", settings.keyboardNavigationMode);

    // Color blind mode
    root.classList.remove("color-blind-rg", "color-blind-by");
    if (
      settings.colorBlindMode === "protanopia" ||
      settings.colorBlindMode === "deuteranopia"
    ) {
      root.classList.add("color-blind-rg");
    } else if (settings.colorBlindMode === "tritanopia") {
      root.classList.add("color-blind-by");
    }

    // Font size
    root.style.fontSize = {
      small: "14px",
      medium: "16px",
      large: "18px",
      "x-large": "20px",
    }[settings.fontSize];

    // Touch target size
    root.style.setProperty(
      "--touch-target-size",
      settings.touchTargetSize === "large" ? "48px" : "44px",
    );

    // Save to localStorage
    localStorage.setItem("accessibility-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem("accessibility-settings");
  };

  const announceToScreenReader = (
    message: string,
    priority: "polite" | "assertive" = "polite",
  ) => {
    if (!settings.announceChanges) return;

    // Create live region if it doesn't exist
    let liveRegion = document.getElementById("a11y-announcer");
    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.id = "a11y-announcer";
      liveRegion.setAttribute("aria-live", priority);
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.className = "sr-only";
      document.body.appendChild(liveRegion);
    }

    // Update message
    liveRegion.setAttribute("aria-live", priority);
    liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (liveRegion) liveRegion.textContent = "";
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        announceToScreenReader,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider",
    );
  }
  return context;
}

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnouncer() {
  const { announceToScreenReader } = useAccessibility();
  return announceToScreenReader;
}

/**
 * Hook for focus management
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  active: boolean,
) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener("keydown", handleKeyDown);
    firstElement?.focus();

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, ref]);
}

/**
 * Skip link component for keyboard navigation
 */
export function SkipLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className="skip-link">
      {children}
    </a>
  );
}
