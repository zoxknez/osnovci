/**
 * Dashboard Skeleton Loader
 * Beautiful skeleton loader for dashboard page
 */

import { Card, CardContent } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid gap-8 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex gap-4">
                      <div className="h-16 w-16 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

