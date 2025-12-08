/**
 * Enhanced Loading States Components
 * Better loading feedback for different scenarios
 */

"use client";

import { Loader, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Simple loading spinner
 */
export function LoadingSpinner({
  message = "Učitavanje...",
  size = "md",
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <Loader className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}

/**
 * Loading card with skeleton
 */
export function LoadingCard({
  message = "Učitavanje podataka...",
}: {
  message?: string;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading state with retry option
 */
export function LoadingWithRetry({
  message = "Učitavanje...",
  onRetry,
  error,
}: {
  message?: string;
  onRetry?: () => void;
  error?: Error | string;
}) {
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-red-100 p-3">
              <RefreshCw className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Greška pri učitavanju
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {error instanceof Error ? error.message : error}
              </p>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Pokušaj ponovo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <LoadingCard message={message} />;
}

/**
 * Inline loading indicator
 */
export function InlineLoading({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Loader className="h-4 w-4 animate-spin text-blue-600" />
      <span className="text-sm text-gray-600">Učitavanje...</span>
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonLoading({
  children,
  isLoading,
  className,
}: {
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {isLoading && <Loader className="h-4 w-4 animate-spin" />}
      {children}
    </div>
  );
}
