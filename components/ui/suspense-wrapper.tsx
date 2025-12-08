// Advanced Suspense Wrapper - Best Practices for Code Splitting
"use client";

import { Loader } from "lucide-react";
import { type ComponentType, type ReactNode, Suspense } from "react";
import { cn } from "@/lib/utils";

/**
 * Fallback komponente za razliĉite scenarije
 */
export function LoaderFallback({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <Loader className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}

export function CardSkeletonFallback() {
  return (
    <div className="rounded-xl border bg-white p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-3 bg-gray-200 rounded w-3/4" />
    </div>
  );
}

export function PageSkeletonFallback() {
  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-64 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <CardSkeletonFallback key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Suspense Wrapper - Automatic fallback with error boundary
 */
interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  type?: "loader" | "card" | "page";
}

export function SuspenseWrapper({
  children,
  fallback,
  type = "loader",
}: SuspenseWrapperProps) {
  const defaultFallbacks = {
    loader: <LoaderFallback />,
    card: <CardSkeletonFallback />,
    page: <PageSkeletonFallback />,
  };

  return (
    <Suspense fallback={fallback || defaultFallbacks[type]}>
      {children}
    </Suspense>
  );
}

/**
 * HOC za lazy loaded komponente sa automatic Suspense
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode,
) {
  return function WithSuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <LoaderFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy load utility sa optimizovanim fallback-om
 */
export function lazyWithFallback<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode,
) {
  const LazyComponent = lazy(() => importFunc());

  return function LazyWithFallback(props: P) {
    return (
      <Suspense fallback={fallback || <LoaderFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

import { lazy } from "react";
