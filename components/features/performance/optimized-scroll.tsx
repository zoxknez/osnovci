/**
 * Optimized Scroll Component
 * Throttled scroll handler za bolje performanse
 */

"use client";

import { useEffect, useRef } from "react";
import { throttle } from "@/lib/utils/performance";

interface OptimizedScrollProps {
  onScroll: (scrollTop: number) => void;
  throttleMs?: number;
  children: React.ReactNode;
  className?: string;
}

export function OptimizedScroll({
  onScroll,
  throttleMs = 100,
  children,
  className,
}: OptimizedScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const throttledOnScroll = throttle(() => {
      onScroll(container.scrollTop);
    }, throttleMs);

    container.addEventListener("scroll", throttledOnScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", throttledOnScroll);
    };
  }, [onScroll, throttleMs]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

