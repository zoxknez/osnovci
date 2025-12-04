/**
 * Optimized Image Component
 * Lazy loading sa intersection observer
 */

"use client";

import { useState, useRef, useEffect } from "react";
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

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          width={fill ? "100%" : width}
          height={fill ? "100%" : height}
          className="absolute inset-0"
        />
      )}
      {shouldLoad && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          quality={quality}
          sizes={sizes}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            objectFit === "cover" && "object-cover",
            objectFit === "contain" && "object-contain",
            objectFit === "fill" && "object-fill"
          )}
          onLoad={() => setIsLoaded(true)}
          loading={priority ? undefined : "lazy"}
        />
      )}
    </div>
  );
}

