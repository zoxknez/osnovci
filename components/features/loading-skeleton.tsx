/**
 * Reusable Loading Skeleton Components
 * Various skeleton loaders for different use cases
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CardSkeleton() {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg">
          <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-4 bg-gray-200 rounded animate-pulse"
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="flex-1 h-4 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
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
  );
}

export function FormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
        <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse" />
      </CardContent>
    </Card>
  );
}
