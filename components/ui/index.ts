/**
 * UI Components - Enhanced & Optimized
 * Centralized export for all reusable UI components
 */

// Core Components
export * from "./button";
export * from "./card";
export * from "./input";
export * from "./textarea";
export * from "./select";
export * from "./accordion";
export * from "./tabs";
export * from "./tooltip";
export * from "./badge";
export * from "./alert";
export * from "./progress";

// Advanced Components
export * from "./empty-state";
export * from "./loading-skeleton";
export * from "./child-error";
export { Card as OptimizedCard, CardHeader as OptimizedCardHeader, CardContent as OptimizedCardContent } from "./optimized-card";
export * from "./virtual-list";

// New Optimized Components
export * from "./patterns";
export * from "./optimized-image";
export * from "./suspense-wrapper";
export * from "./advanced-error-boundary";

// Re-export commonly used utilities
export { cn } from "@/lib/utils";
