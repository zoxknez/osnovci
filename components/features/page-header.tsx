// Page Header Component - Modern Hero Section za sve stranice
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Main title (npr. "📚 Domaći zadaci") */
  title: string;
  /** Subtitle/description (npr. "Upravljaj svojim zadacima i rokovima") */
  description: string;
  /** Optional action button/element */
  action?: ReactNode;
  /** Optional decoration background variant */
  variant?: "blue" | "purple" | "green" | "orange" | "gradient" | "pink";
  /** Optional badge/tag */
  badge?: ReactNode;
}

const variantStyles = {
  blue: {
    bg: "from-blue-600 via-blue-500 to-blue-400",
    accent: "from-blue-400 to-blue-300",
    dot: "bg-blue-300",
    border: "border-blue-300",
    bgClass: "page-header-gradient-blue",
  },
  purple: {
    bg: "from-purple-600 via-purple-500 to-purple-400",
    accent: "from-purple-400 to-purple-300",
    dot: "bg-purple-300",
    border: "border-purple-300",
    bgClass: "page-header-gradient-purple",
  },
  green: {
    bg: "from-green-600 via-green-500 to-green-400",
    accent: "from-green-400 to-green-300",
    dot: "bg-green-300",
    border: "border-green-300",
    bgClass: "page-header-gradient-green",
  },
  orange: {
    bg: "from-orange-600 via-orange-500 to-orange-400",
    accent: "from-orange-400 to-orange-300",
    dot: "bg-orange-300",
    border: "border-orange-300",
    bgClass: "page-header-gradient-orange",
  },
  gradient: {
    bg: "from-blue-600 via-purple-600 to-pink-600",
    accent: "from-blue-400 to-pink-400",
    dot: "bg-pink-300",
    border: "border-pink-300",
    bgClass: "page-header-gradient-mixed",
  },
  pink: {
    bg: "from-pink-600 via-pink-500 to-rose-400",
    accent: "from-pink-400 to-rose-300",
    dot: "bg-pink-300",
    border: "border-pink-300",
    bgClass: "page-header-gradient-pink",
  },
};

export function PageHeader({
  title,
  description,
  action,
  variant = "blue",
  badge,
}: PageHeaderProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative mb-8 overflow-hidden rounded-3xl page-header-shadow ${styles.bgClass}`}
    >
      {/* Blurred background accent - single layer */}
      <div
        className={`absolute inset-0 -z-10 rounded-3xl blur-2xl opacity-30 ${styles.bgClass}`}
      />

      {/* Static background pattern - no animation to reduce flash */}
      <div className="absolute inset-0 -z-10 opacity-10 page-header-pattern" />

      {/* Content container - Mobile optimized */}
      <div className="relative px-3 py-8 sm:px-8 sm:py-14 md:py-16 lg:px-10 lg:py-18">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-8">
          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Badge */}
            {badge && (
              <div className="inline-block mb-3 sm:mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-lg text-white border ${styles.border} shadow-lg hover:bg-white/30 transition-all cursor-default`}
                >
                  <span className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${styles.dot}`} />
                  <span className="hidden sm:inline">{badge}</span>
                  <span className="inline sm:hidden text-xs">
                    {typeof badge === 'string' ? badge.slice(0, 8) : badge}
                  </span>
                </span>
              </div>
            )}

            {/* Title - Mobile optimized typography */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-2 sm:mb-4 leading-tight page-header-text-shadow">
              {title}
            </h1>

            {/* Description - Mobile optimized */}
            <p className="text-sm sm:text-lg md:text-xl text-white/95 max-w-2xl leading-snug sm:leading-relaxed font-medium page-header-text-shadow-sm">
              {description}
            </p>
          </div>

          {/* Action button */}
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>

        {/* Static decorative elements - removed animation */}
        <div
          className="absolute top-8 right-8 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        >
          <div
            className={`w-full h-full rounded-full bg-gradient-to-br ${styles.accent} blur-lg`}
          />
        </div>

        <div
          className="absolute bottom-8 left-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
        >
          <div
            className={`w-full h-full rounded-full bg-gradient-to-tr ${styles.accent} blur-xl`}
          />
        </div>

        {/* Decorative SVG pattern */}
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none">
          <svg
            className="w-full h-full text-white"
            fill="currentColor"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <title>Dekorativni element</title>
            <path
              d="M50 0 C77.6 0 100 22.4 100 50 C100 77.6 77.6 100 50 100 C22.4 100 0 77.6 0 50 C0 22.4 22.4 0 50 0"
              opacity="0.4"
            />
            <circle cx="50" cy="50" r="30" opacity="0.3" />
          </svg>
        </div>
      </div>

      {/* Bottom accent gradient bar - no animation */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${styles.accent}`}
      />
    </motion.div>
  );
}

// Variant: Minimal (za podstranice)
export function PageHeaderMinimal({
  title,
  description,
  action,
}: Omit<PageHeaderProps, "variant" | "badge">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 bg-gradient-to-r from-blue-50/60 via-white to-blue-50/40 rounded-2xl p-6 sm:p-8 border border-blue-100/30 shadow-sm backdrop-blur-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 font-medium">
            {description}
          </p>
        </motion.div>
        {action && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {action}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
