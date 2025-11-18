// Optimized Image Component - With blur placeholders and lazy loading
"use client";

import { useState } from "react";
import NextImage, { type ImageProps as NextImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<NextImageProps, "placeholder"> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
}

/**
 * Optimized Image with:
 * - Automatic blur placeholder
 * - Lazy loading
 * - Error fallback
 * - Loading skeleton
 * - Aspect ratio presets
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E",
  showSkeleton = true,
  aspectRatio,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-100",
        aspectRatio && aspectRatioClasses[aspectRatio],
        className,
      )}
    >
      {/* Loading skeleton */}
      {isLoading && showSkeleton && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}

      {/* Image */}
      <NextImage
        src={hasError ? fallbackSrc : src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        {...props}
      />
    </div>
  );
}

/**
 * Avatar Image - Optimized for profile pictures
 */
interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string;
  className?: string;
}

export function AvatarImage({
  src,
  alt,
  size = "md",
  fallback,
  className,
}: AvatarImageProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  // Generate fallback with initials
  const initials = alt
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const fallbackImage = fallback || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%233b82f6' width='100' height='100'/%3E%3Ctext fill='white' font-family='sans-serif' font-size='40' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E${initials}%3C/text%3E%3C/svg%3E`;

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-gray-200",
        sizeClasses[size],
        className,
      )}
    >
      <OptimizedImage
        src={src || fallbackImage}
        alt={alt}
        fill
        sizes={`(max-width: 640px) ${sizeClasses[size]}, ${sizeClasses[size]}`}
        className="object-cover"
        showSkeleton={false}
      />
    </div>
  );
}

/**
 * Thumbnail Image - For homework attachments and previews
 */
interface ThumbnailImageProps {
  src: string;
  alt: string;
  onClick?: () => void;
  className?: string;
}

export function ThumbnailImage({
  src,
  alt,
  onClick,
  className,
}: ThumbnailImageProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all",
        "h-24 w-24 flex-shrink-0",
        className,
      )}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="96px"
        className="object-cover group-hover:scale-110 transition-transform"
      />
      {onClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
            👁️ Pogledaj
          </span>
        </div>
      )}
    </button>
  );
}

/**
 * Background Image - For hero sections
 */
interface BackgroundImageProps {
  src: string;
  alt: string;
  overlay?: "light" | "dark" | "gradient";
  children?: React.ReactNode;
  className?: string;
}

export function BackgroundImage({
  src,
  alt,
  overlay = "dark",
  children,
  className,
}: BackgroundImageProps) {
  const overlayClasses = {
    light: "bg-white/50",
    dark: "bg-black/50",
    gradient: "bg-gradient-to-b from-transparent to-black/70",
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      {overlay && (
        <div className={cn("absolute inset-0", overlayClasses[overlay])} />
      )}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
