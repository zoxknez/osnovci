/**
 * Level Progress Bar Component
 *
 * Shows current level, XP progress, and next level
 *
 * Usage:
 * ```tsx
 * <LevelProgressBar
 *   level={15}
 *   currentXP={3800}
 *   totalXP={15000}
 * />
 * ```
 */

"use client";

import { Star, Zap } from "lucide-react";
import {
  getLevelProgress,
  getXPForNextLevel,
} from "@/lib/gamification/xp-system-v2";
import { cn } from "@/lib/utils";

interface LevelProgressBarProps {
  level: number;
  currentXP: number;
  totalXP: number;
  className?: string;
  showDetails?: boolean;
}

export function LevelProgressBar({
  level,
  currentXP,
  totalXP,
  className,
  showDetails = true,
}: LevelProgressBarProps) {
  const nextLevelXP = getXPForNextLevel(currentXP);
  const progress = getLevelProgress(currentXP);
  const xpForNext = nextLevelXP - currentXP;

  // Level tier styling
  const getLevelTier = (lvl: number) => {
    if (lvl >= 40)
      return {
        color: "from-purple-500 to-pink-500",
        glow: "shadow-purple-500/50",
      };
    if (lvl >= 30)
      return {
        color: "from-amber-500 to-orange-500",
        glow: "shadow-amber-500/50",
      };
    if (lvl >= 20)
      return { color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/50" };
    if (lvl >= 10)
      return {
        color: "from-green-500 to-emerald-500",
        glow: "shadow-green-500/50",
      };
    return { color: "from-gray-500 to-gray-600", glow: "shadow-gray-500/50" };
  };

  const tier = getLevelTier(level);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Level Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br",
              tier.color,
              tier.glow,
              "shadow-lg",
            )}
          >
            <Star className="absolute w-8 h-8 text-white/20" />
            <span className="relative z-10 text-2xl font-bold text-white">
              {level}
            </span>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Level</div>
            <div className="text-xl font-bold">Level {level}</div>
            {level < 50 && (
              <div className="text-xs text-muted-foreground">
                {xpForNext} XP do Level {level + 1}
              </div>
            )}
          </div>
        </div>

        {showDetails && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total XP</div>
            <div className="text-xl font-bold flex items-center gap-1">
              <Zap className="w-5 h-5 text-amber-500" />
              {totalXP.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {level < 50 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentXP.toLocaleString()} XP</span>
            <span>{progress}%</span>
            <span>{nextLevelXP.toLocaleString()} XP</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden relative">
            {/* Background shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

            {/* Progress fill */}
            <div
              className={cn(
                "h-full bg-gradient-to-r transition-all duration-500 ease-out",
                tier.color,
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Max Level Badge */}
      {level >= 50 && (
        <div className="text-center py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg border border-amber-500/30">
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            🏆 MAX LEVEL ACHIEVED! 🏆
          </span>
        </div>
      )}
    </div>
  );
}
