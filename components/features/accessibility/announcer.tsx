/**
 * Screen Reader Announcer
 * Za dinamičke promene koje screen reader mora da čuje
 */

"use client";

import React from "react";
import { useAriaAnnouncer } from "./aria-live-region";

interface AnnouncerContextType {
  announce: (message: string, urgent?: boolean) => void;
}

export const AnnouncerContext =
  React.createContext<AnnouncerContextType | null>(null);

export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const { announce, AriaLiveRegion } = useAriaAnnouncer();

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      {AriaLiveRegion}
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer() {
  const context = React.useContext(AnnouncerContext);
  if (!context) {
    // Fallback - still works but logs warning
    console.warn("useAnnouncer used outside AnnouncerProvider");
    return {
      announce: (message: string) => {
        // Create temporary live region
        const region = document.createElement("div");
        region.setAttribute("role", "status");
        region.setAttribute("aria-live", "polite");
        region.className = "sr-only";
        region.textContent = message;
        document.body.appendChild(region);
        setTimeout(() => document.body.removeChild(region), 1000);
      },
    };
  }
  return context;
}
