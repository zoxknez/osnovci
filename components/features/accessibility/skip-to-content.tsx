/**
 * Skip to Content Link
 * Accessibility feature za keyboard navigation
 */

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SkipToContent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show skip link on Tab key press
      if (e.key === "Tab" && !isVisible) {
        setIsVisible(true);
      }
    };

    const handleClick = () => {
      setIsVisible(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClick);
    };
  }, [isVisible]);

  const handleClick = () => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
      className={cn(
        "fixed top-4 left-4 z-[9999] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        !isVisible && "sr-only focus:not-sr-only focus:block"
      )}
      aria-label="Preskoči na glavni sadržaj"
    >
      Preskoči na sadržaj
    </a>
  );
}

