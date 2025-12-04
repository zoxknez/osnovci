/**
 * Focus Trap Component
 * Za modalne dijaloge - zadržava fokus unutar modala
 */

"use client";

import { useEffect, useRef } from "react";

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  onEscape?: () => void;
}

export function FocusTrap({ children, active = true, onEscape }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        onEscape();
      }
    };

    // Focus first element when trap activates
    firstElement?.focus();

    container.addEventListener("keydown", handleTabKey);
    window.addEventListener("keydown", handleEscape);

    return () => {
      container.removeEventListener("keydown", handleTabKey);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [active, onEscape]);

  return <div ref={containerRef}>{children}</div>;
}

