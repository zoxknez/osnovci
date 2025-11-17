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
  badge?: string;
}

const variantStyles = {
  blue: {
    bg: "from-blue-600 via-blue-500 to-blue-400",
    accent: "from-blue-400 to-blue-300",
    dot: "bg-blue-300",
    border: "border-blue-300",
    inlineColor: "linear-gradient(to bottom right, #2563eb, #3b82f6, #60a5fa)",
  },
  purple: {
    bg: "from-purple-600 via-purple-500 to-purple-400",
    accent: "from-purple-400 to-purple-300",
    dot: "bg-purple-300",
    border: "border-purple-300",
    inlineColor: "linear-gradient(to bottom right, #7c3aed, #a855f7, #d8b4fe)",
  },
  green: {
    bg: "from-green-600 via-green-500 to-green-400",
    accent: "from-green-400 to-green-300",
    dot: "bg-green-300",
    border: "border-green-300",
    inlineColor: "linear-gradient(to bottom right, #16a34a, #22c55e, #4ade80)",
  },
  orange: {
    bg: "from-orange-600 via-orange-500 to-orange-400",
    accent: "from-orange-400 to-orange-300",
    dot: "bg-orange-300",
    border: "border-orange-300",
    inlineColor: "linear-gradient(to bottom right, #ea580c, #f97316, #fb923c)",
  },
  gradient: {
    bg: "from-blue-600 via-purple-600 to-pink-600",
    accent: "from-blue-400 to-pink-400",
    dot: "bg-pink-300",
    border: "border-pink-300",
    inlineColor: "linear-gradient(to bottom right, #2563eb, #c084fc, #ec4899)",
  },
  pink: {
    bg: "from-pink-600 via-pink-500 to-rose-400",
    accent: "from-pink-400 to-rose-300",
    dot: "bg-pink-300",
    border: "border-pink-300",
    inlineColor: "linear-gradient(to bottom right, #ec4899, #f43f5e, #fb7185)",
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
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="relative mb-8 overflow-hidden hero-glow hero-rounded"
      style={{
        background: styles.inlineColor,
      }}
    >
      {/* Main gradient background */}
      <div
        className={`absolute inset-0 -z-20 bg-gradient-to-br ${styles.bg} opacity-95 hero-rounded`}
        style={{
          background: styles.inlineColor,
          opacity: 0.95,
        }}
      />

      {/* Blurred background accent */}
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-r ${styles.bg} hero-rounded blur-2xl opacity-40`}
        style={{
          background: styles.inlineColor,
          opacity: 0.4,
          filter: "blur(64px)",
        }}
      />

      {/* Animated background pattern */}
      <motion.div
        className="absolute inset-0 -z-10 opacity-20"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)
          `,
        }}
      />

      {/* Content container - Mobile optimized */}
      <div className="relative px-3 py-8 sm:px-8 sm:py-14 md:py-16 lg:px-10 lg:py-18">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-8">
          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Badge */}
            {badge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="inline-block mb-3 sm:mb-4"
              >
                <span
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-lg text-white border ${styles.border} shadow-lg hover:bg-white/30 transition-all cursor-default`}
                >
                  <motion.span
                    className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${styles.dot}`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="hidden sm:inline">{badge}</span>
                  <span className="inline sm:hidden text-xs">
                    {badge?.slice(0, 8)}
                  </span>
                </span>
              </motion.div>
            )}

            {/* Title - Mobile optimized typography */}
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 100 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-2 sm:mb-4 leading-tight"
              style={{
                textShadow: `
                  0 2px 4px rgba(0, 0, 0, 0.1),
                  0 4px 8px rgba(0, 0, 0, 0.15),
                  0 8px 16px rgba(0, 0, 0, 0.2)
                `,
              }}
            >
              {title}
            </motion.h1>

            {/* Description - Mobile optimized */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="text-sm sm:text-lg md:text-xl text-white/95 max-w-2xl leading-snug sm:leading-relaxed font-medium"
              style={{
                textShadow: `
                  0 1px 2px rgba(0, 0, 0, 0.1),
                  0 2px 4px rgba(0, 0, 0, 0.1)
                `,
              }}
            >
              {description}
            </motion.p>
          </div>

          {/* Action button */}
          {action && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
              className="flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {action}
            </motion.div>
          )}
        </div>

        {/* Floating decorative elements */}
        <motion.div
          className="absolute top-8 right-8 w-24 h-24 rounded-full opacity-20 pointer-events-none"
          animate={{
            y: [0, 15, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div
            className={`w-full h-full rounded-full bg-gradient-to-br ${styles.accent} blur-lg`}
          />
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-8 w-32 h-32 rounded-full opacity-15 pointer-events-none"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className={`w-full h-full rounded-full bg-gradient-to-tr ${styles.accent} blur-xl`}
          />
        </motion.div>

        {/* Decorative SVG pattern */}
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none">
          <svg
            className="w-full h-full"
            fill="currentColor"
            viewBox="0 0 100 100"
            aria-hidden="true"
            style={{ color: "white" }}
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

      {/* Bottom accent gradient bar */}
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${styles.accent}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        style={{ transformOrigin: "left" }}
      />

      {/* Glow effect */}
      <div className="absolute inset-0 -z-30 rounded-3xl opacity-0 blur-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
