/**
 * Optimized Image Component
 * Lazy loading sa intersection observer
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Skeleton } from "@/components/features/loading/skeleton-loader";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  sizes,
  fill = false,
  objectFit = "cover",
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: "50px",
    triggerOnce: true,
  });

  const shouldLoad = priority || isIntersecting;
  
  // Build skeleton props conditionally to avoid undefined
  const skeletonProps: {
    variant: "rectangular";
    className: string;
    width?: string | number;
    height?: string | number;
  } = {
    variant: "rectangular",
    className: "absolute inset-0",
  };
  if (fill) {
    skeletonProps.width = "100%";
    skeletonProps.height = "100%";
  } else {
    if (width !== undefined) skeletonProps.width = width;
    if (height !== undefined) skeletonProps.height = height;
  }
  
  // Build image props conditionally
  const imageProps: {
    src: string;
    alt: string;
    fill: boolean;
    quality: number;
    className: string;
    onLoad: () => void;
    width?: number;
    height?: number;
    sizes?: string;
    loading?: "lazy" | "eager";
  } = {
    src,
    alt,
    fill,
    quality,
    className: cn(
      "transition-opacity duration-300",
      isLoaded ? "opacity-100" : "opacity-0",
      objectFit === "cover" && "object-cover",
      objectFit === "contain" && "object-contain",
      objectFit === "fill" && "object-fill"
    ),
    onLoad: () => setIsLoaded(true),
  };
  if (!fill && width !== undefined) imageProps.width = width;
  if (!fill && height !== undefined) imageProps.height = height;
  if (sizes) imageProps.sizes = sizes;
  if (!priority) imageProps.loading = "lazy";

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {!isLoaded && <Skeleton {...skeletonProps} />}
      {shouldLoad && <Image {...imageProps} />}
    </div>
  );
}

