/**
 * Infinite Scroll Component
 * Za paginaciju sa automatskim učitavanjem
 */

"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Loader } from "lucide-react";

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  children: React.ReactNode;
  loader?: React.ReactNode;
  threshold?: number;
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  children,
  loader,
  threshold = 0.1,
}: InfiniteScrollProps) {
  const [loadMoreRef, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    threshold,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore]);

  return (
    <>
      {children}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loader || (
            <Loader className="h-6 w-6 animate-spin text-blue-500" />
          )}
        </div>
      )}
    </>
  );
}

