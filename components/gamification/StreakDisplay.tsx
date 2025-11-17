/**
 * Streak Display Component
 *
 * Shows current streak with flame animation and freeze power-ups
 *
 * Usage:
 * ```tsx
 * <StreakDisplay
 *   currentStreak={15}
 *   longestStreak={30}
 *   streakFreezes={2}
 * />
 * ```
 */

"use client";

import { motion } from "framer-motion";
import { Flame, Shield, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  streakFreezes?: number;
  className?: string;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  streakFreezes = 0,
  className,
}: StreakDisplayProps) {
  // Streak tier colors
  const getStreakTier = (streak: number) => {
    if (streak >= 100)
      return {
        color: "from-purple-500 to-pink-500",
        text: "text-purple-600 dark:text-purple-400",
      };
    if (streak >= 50)
      return {
        color: "from-amber-500 to-orange-500",
        text: "text-amber-600 dark:text-amber-400",
      };
    if (streak >= 30)
      return {
        color: "from-orange-500 to-red-500",
        text: "text-orange-600 dark:text-orange-400",
      };
    if (streak >= 14)
      return {
        color: "from-red-500 to-orange-500",
        text: "text-red-600 dark:text-red-400",
      };
    if (streak >= 7)
      return {
        color: "from-orange-500 to-yellow-500",
        text: "text-orange-600 dark:text-orange-400",
      };
    return {
      color: "from-yellow-500 to-amber-500",
      text: "text-yellow-600 dark:text-yellow-400",
    };
  };

  const tier = getStreakTier(currentStreak);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Streak */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center justify-center p-6 rounded-xl bg-gradient-to-br",
            tier.color,
            "shadow-lg",
          )}
        >
          <motion.div
            animate={{
              scale: currentStreak > 0 ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Flame className="w-12 h-12 text-white" />
          </motion.div>
          <div className="ml-4 text-white">
            <div className="text-sm font-medium opacity-90">Current Streak</div>
            <div className="text-4xl font-bold">{currentStreak} dana</div>
          </div>
        </div>

        {/* Streak Freeze Badge */}
        {streakFreezes > 0 && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-12 h-12 flex flex-col items-center justify-center shadow-lg">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold">x{streakFreezes}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Longest Streak */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Longest</span>
          </div>
          <div className="text-2xl font-bold">{longestStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>

        {/* Streak Freezes */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Freezes</span>
          </div>
          <div className="text-2xl font-bold">{streakFreezes}</div>
          <div className="text-xs text-muted-foreground">available</div>
        </div>
      </div>

      {/* Freeze Info */}
      {streakFreezes > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Streak Freeze Active!</strong> Možeš propustiti 1 dan bez
              gubitka streak-a. Freeze će se automatski aktivirati.
            </div>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">
          Next Milestones
        </div>
        <div className="space-y-1">
          {[7, 14, 30, 50, 100]
            .map((milestone) => {
              if (currentStreak < milestone) {
                const remaining = milestone - currentStreak;
                return (
                  <div
                    key={milestone}
                    className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Flame className="w-3 h-3" />
                      {milestone} days
                    </span>
                    <span className="text-muted-foreground">
                      {remaining} more
                    </span>
                  </div>
                );
              }
              return null;
            })
            .filter(Boolean)
            .slice(0, 2)}
        </div>
      </div>
    </div>
  );
}
