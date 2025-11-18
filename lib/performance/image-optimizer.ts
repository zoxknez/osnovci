/**
 * Image Optimization Utilities
 * 
 * Provides client-side and server-side image optimization:
 * - Compression before upload
 * - Format conversion (WebP/AVIF)
 * - Responsive image generation
 * - Lazy loading helpers
 * - Blurhash placeholders
 */

import imageCompression from "browser-image-compression";
import { log } from "@/lib/logger";

// ===========================================
// CLIENT-SIDE COMPRESSION
// ===========================================

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  quality?: number;
}

/**
 * Compress image file before upload
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 1, // Target 1MB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true,
    fileType: "image/webp", // Convert to WebP
    quality: 0.8, // 80% quality
    ...options,
  };

  try {
    log.info("Compressing image", {
      originalSize: file.size,
      name: file.name,
    });

    const compressedFile = await imageCompression(file, defaultOptions);

    log.info("Image compressed", {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      reduction: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
    });

    return compressedFile;
  } catch (error) {
    log.error("Image compression failed", error);
    return file; // Return original on error
  }
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options?: CompressionOptions
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.1, // 100KB max
    maxWidthOrHeight: size,
    quality: 0.7,
  });
}

// ===========================================
// IMAGE VALIDATION
// ===========================================

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate image file
 */
export function validateImage(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Nepodržan format slike. Koristite JPG, PNG ili WebP.",
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: "Slika je prevelika. Maksimalna veličina je 10MB.",
    };
  }

  return { valid: true };
}

// ===========================================
// IMAGE URL HELPERS
// ===========================================

/**
 * Generate Next.js Image loader URL with optimization params
 */
export function getOptimizedImageUrl(
  src: string,
  _options: {
    width?: number;
    quality?: number;
  } = {}
): string {
  // Width and quality will be handled by Next.js Image component
  // _options parameter reserved for future custom optimization logic
  
  // If external URL, return as-is (Next.js Image will handle it)
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  
  // For local images, Next.js will optimize via /_next/image
  return src;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920]
): string {
  return widths
    .map((width) => `${getOptimizedImageUrl(src, { width })} ${width}w`)
    .join(", ");
}

// ===========================================
// LAZY LOADING HELPERS
// ===========================================

/**
 * Create IntersectionObserver for lazy loading
 */
export function createLazyLoadObserver(
  onIntersect: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: "50px", // Start loading 50px before visible
    threshold: 0.01,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        onIntersect(entry);
      }
    });
  }, defaultOptions);
}

// ===========================================
// BLURHASH PLACEHOLDERS
// ===========================================

/**
 * Generate CSS background for blurhash placeholder
 */
export function getBlurhashBackground(blurhash?: string): string {
  if (!blurhash) {
    return "bg-gray-200 dark:bg-gray-800";
  }
  
  // In production, decode blurhash to canvas and get data URL
  // For now, return gradient placeholder
  return "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700";
}

// ===========================================
// IMAGE DIMENSION HELPERS
// ===========================================

/**
 * Get image dimensions from File
 */
export function getImageDimensions(file: File): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Calculate aspect ratio
 */
export function getAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Calculate dimensions for target aspect ratio
 */
export function calculateDimensionsForAspectRatio(
  originalWidth: number,
  originalHeight: number,
  targetAspectRatio: number
): {
  width: number;
  height: number;
  cropX: number;
  cropY: number;
} {
  const originalAspect = originalWidth / originalHeight;

  if (originalAspect > targetAspectRatio) {
    // Original is wider, crop width
    const targetWidth = originalHeight * targetAspectRatio;
    return {
      width: targetWidth,
      height: originalHeight,
      cropX: (originalWidth - targetWidth) / 2,
      cropY: 0,
    };
  } else {
    // Original is taller, crop height
    const targetHeight = originalWidth / targetAspectRatio;
    return {
      width: originalWidth,
      height: targetHeight,
      cropX: 0,
      cropY: (originalHeight - targetHeight) / 2,
    };
  }
}

// ===========================================
// PERFORMANCE MONITORING
// ===========================================

/**
 * Measure image loading performance
 */
export function measureImageLoadTime(
  src: string,
  onLoad: (duration: number) => void
): HTMLImageElement {
  const img = new Image();
  const startTime = performance.now();

  img.onload = () => {
    const duration = performance.now() - startTime;
    onLoad(duration);
    log.info("Image loaded", { src, duration: `${duration.toFixed(2)}ms` });
  };

  img.src = src;
  return img;
}

/**
 * Preload critical images
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        })
    )
  );
}
