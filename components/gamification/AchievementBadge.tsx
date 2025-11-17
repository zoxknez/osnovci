/**
 * Achievement Badge Component
 *
 * Displays individual achievement badge with rarity styling and unlock animation
 *
 * Usage:
 * ```tsx
 * <AchievementBadge
 *   achievement={achievement}
 *   size="md"
 *   showAnimation={justUnlocked}
 * />
 * ```
 */

"use client";

import type { AchievementRarity } from "@prisma/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  achievement: {
    title: string;
    description?: string | null;
    icon?: string | null;
    rarity: AchievementRarity;
    xpReward: number;
    unlockedAt?: Date;
    progress?: number | null;
    target?: number | null;
    isHidden?: boolean;
  };
  size?: "sm" | "md" | "lg";
  showAnimation?: boolean;
  isLocked?: boolean;
}

const RARITY_STYLES: Record<
  AchievementRarity,
  { bg: string; border: string; glow: string; text: string }
> = {
  COMMON: {
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-300 dark:border-gray-600",
    glow: "shadow-gray-300/50",
    text: "text-gray-700 dark:text-gray-300",
  },
  RARE: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-400 dark:border-blue-600",
    glow: "shadow-blue-400/50",
    text: "text-blue-700 dark:text-blue-300",
  },
  EPIC: {
    bg: "bg-purple-50 dark:bg-purple-950",
    border: "border-purple-400 dark:border-purple-600",
    glow: "shadow-purple-400/50",
    text: "text-purple-700 dark:text-purple-300",
  },
  LEGENDARY: {
    bg: "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950",
    border: "border-amber-400 dark:border-amber-600",
    glow: "shadow-amber-400/70",
    text: "text-amber-800 dark:text-amber-200",
  },
};

const SIZE_STYLES = {
  sm: {
    container: "w-20 h-20",
    icon: "text-2xl",
    title: "text-xs",
    xp: "text-xs",
  },
  md: {
    container: "w-28 h-28",
    icon: "text-4xl",
    title: "text-sm",
    xp: "text-sm",
  },
  lg: {
    container: "w-36 h-36",
    icon: "text-5xl",
    title: "text-base",
    xp: "text-base",
  },
};

export function AchievementBadge({
  achievement,
  size = "md",
  showAnimation = false,
  isLocked = false,
}: AchievementBadgeProps) {
  const rarity = RARITY_STYLES[achievement.rarity];
  const sizeStyle = SIZE_STYLES[size];

  const badge = (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all",
        sizeStyle.container,
        isLocked
          ? "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-50 grayscale"
          : `${rarity.bg} ${rarity.border} ${rarity.glow} shadow-lg hover:scale-105`,
        !isLocked && "cursor-pointer",
      )}
      title={achievement.description || achievement.title}
    >
      {/* Icon */}
      <div className={cn("mb-2", sizeStyle.icon, isLocked && "opacity-30")}>
        {isLocked ? "🔒" : achievement.icon || "🏆"}
      </div>

      {/* Title */}
      <div
        className={cn(
          "font-bold text-center line-clamp-2",
          sizeStyle.title,
          isLocked ? "text-gray-500" : rarity.text,
        )}
      >
        {isLocked && achievement.isHidden ? "???" : achievement.title}
      </div>

      {/* XP Reward */}
      {!isLocked && (
        <div className="absolute top-1 right-1 bg-black/20 dark:bg-white/20 rounded-full px-2 py-0.5">
          <span className={cn("font-semibold", sizeStyle.xp)}>
            +{achievement.xpReward} XP
          </span>
        </div>
      )}

      {/* Progress Bar for locked achievements */}
      {isLocked &&
        achievement.progress !== null &&
        achievement.progress !== undefined &&
        achievement.target && (
          <div className="absolute bottom-1 left-1 right-1">
            <div className="h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{
                  width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

      {/* Rarity Badge */}
      {!isLocked && (
        <div className="absolute bottom-1 left-1 right-1 flex justify-center">
          <span
            className={cn(
              "text-xs font-bold uppercase px-2 py-0.5 rounded-full",
              achievement.rarity === "COMMON" &&
                "bg-gray-500/20 text-gray-700 dark:text-gray-300",
              achievement.rarity === "RARE" &&
                "bg-blue-500/20 text-blue-700 dark:text-blue-300",
              achievement.rarity === "EPIC" &&
                "bg-purple-500/20 text-purple-700 dark:text-purple-300",
              achievement.rarity === "LEGENDARY" &&
                "bg-amber-500/30 text-amber-800 dark:text-amber-200",
            )}
          >
            {achievement.rarity}
          </span>
        </div>
      )}
    </div>
  );

  // Wrap with animation if just unlocked
  if (showAnimation) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: 3,
            ease: "easeInOut",
          }}
        >
          {badge}
        </motion.div>
      </motion.div>
    );
  }

  return badge;
}
