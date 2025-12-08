/**
 * Reduced Motion Component
 * Automatski prilagođava animacije za korisnike koji preferiraju reduced motion
 */

"use client";

import { useEffect } from "react";

export function ReducedMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return <>{children}</>;
}
