/**
 * Skeleton Loader Components
 * Za bolje UX tokom učitavanja
 */

"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = "bg-gray-200 rounded";
  const variantClasses = {
    text: "h-4",
    circular: "rounded-full",
    rectangular: "rounded",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animate && "animate-pulse",
        className,
      )}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
      aria-label="Učitavanje..."
      role="status"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="40%" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-2">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              variant="rectangular"
              className="flex-1 h-10"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
