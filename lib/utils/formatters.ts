/**
 * Formatters Utilities
 * Centralizovani formateri za konzistentno formatiranje
 */

import { format, formatDistanceToNow } from "date-fns";
import { sr } from "date-fns/locale";

/**
 * Format date for display
 */
export function formatDate(date: Date | string, formatStr: string = "dd.MM.yyyy"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: sr });
}

/**
 * Format date as relative time (e.g., "pre 2 sata")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: sr });
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("sr-RS").format(num);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration (minutes to readable string)
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} ${hours === 1 ? "sat" : "sata"}`;
  }
  
  return `${hours} ${hours === 1 ? "sat" : "sata"} ${mins} min`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

