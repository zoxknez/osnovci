// Loading Skeleton Component - Beautiful placeholders
"use client";

import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width (CSS value ili preset) */
  width?: string | number;
  /** Height (CSS value ili preset) */
  height?: string | number;
  /** Variant shape */
  variant?: "text" | "circular" | "rectangular" | "rounded";
  /** Animation type */
  animation?: "pulse" | "wave" | "none";
}

/**
 * Skeleton - Loading placeholder
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" className="w-48" />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" className="w-full h-32" />
 * ```
 */
export function Skeleton({
  className,
  width,
  height,
  variant = "rectangular",
  animation = "pulse",
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    rounded: "rounded-xl",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "skeleton-wave",
    none: "",
  };

  return (
    <div
      className={cn(
        "bg-gray-200",
        variantClasses[variant],
        animationClasses[animation],
        className,
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      role="status"
      aria-label="Učitavanje..."
      {...props}
    >
      <span className="sr-only">Učitavanje...</span>
    </div>
  );
}

/**
 * Card Skeleton - Za loading card-ova
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-6 space-y-4",
        className,
      )}
    >
      <Skeleton variant="text" className="w-3/4 h-6" />
      <Skeleton variant="text" className="w-1/2 h-4" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-5/6" />
        <Skeleton variant="text" className="w-4/6" />
      </div>
    </div>
  );
}

/**
 * List Item Skeleton
 */
export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-4 p-4", className)}>
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-3/4 h-5" />
        <Skeleton variant="text" className="w-1/2 h-4" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Dashboard Card Skeleton
 */
export function DashboardCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-24 h-4" />
          <Skeleton variant="text" className="w-16 h-8" />
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <Skeleton variant="text" className="w-32 h-4" />
    </div>
  );
}

/**
 * Homework Card Skeleton
 */
export function HomeworkCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex gap-4">
        <Skeleton variant="rectangular" width={4} height={80} />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" className="w-3/4 h-5" />
              <Skeleton variant="text" className="w-1/2 h-4" />
            </div>
            <Skeleton variant="circular" width={20} height={20} />
          </div>
          <Skeleton variant="text" className="w-full" />
          <div className="flex gap-2">
            <Skeleton variant="rounded" className="w-20 h-6" />
            <Skeleton variant="rounded" className="w-24 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Schedule Day Skeleton
 */
export function ScheduleDaySkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="p-4 bg-gray-100">
        <Skeleton variant="text" className="w-32 h-5" />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
          >
            <Skeleton variant="circular" width={32} height={32} />
            <div className="flex-1 space-y-1">
              <Skeleton variant="text" className="w-2/3" />
              <Skeleton variant="text" className="w-1/3 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full Page Skeleton - Za cele stranice
 */
export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="text" className="w-64 h-5" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>

      {/* Content cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * Skeleton Group - Za više skeletona odjednom
 */
export function SkeletonGroup({
  count = 3,
  component: Component = CardSkeleton,
  className,
}: {
  count?: number;
  component?: React.ComponentType<any>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
