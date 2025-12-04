/**
 * ARIA Live Region Component
 * Za screen reader announcements
 */

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AriaLiveRegionProps {
  message: string;
  priority?: "polite" | "assertive";
  className?: string;
}

export function AriaLiveRegion({
  message,
  priority = "polite",
  className,
}: AriaLiveRegionProps) {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      // Clear after announcement
      const timer = setTimeout(() => setAnnouncement(""), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {announcement}
    </div>
  );
}

/**
 * Hook for announcing messages to screen readers
 */
export function useAriaAnnouncer() {
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"polite" | "assertive">("polite");

  const announce = (text: string, urgent = false) => {
    setPriority(urgent ? "assertive" : "polite");
    setMessage(text);
  };

  return {
    announce,
    AriaLiveRegion: (
      <AriaLiveRegion message={message} priority={priority} />
    ),
  };
}

