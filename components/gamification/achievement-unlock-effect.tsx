"use client";

/**
 * AchievementUnlockEffect - Spektakularni efekti za otključane achievement-e
 * 
 * Features:
 * - Konfeti animacije
 * - Zvučni efekti (optional)
 * - Haptic feedback za mobilne
 * - Progressive reveal animacije
 * - WCAG 2.1 AAA compliant (reduced motion support)
 */

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Trophy,
  Star,
  Medal,
  Crown,
  Sparkles,
  PartyPopper,
  Target,
  Flame,
  Zap,
  Heart,
  BookOpen,
  Clock,
  CheckCircle2,
  Award,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Achievement categories with their icons and colors
const ACHIEVEMENT_CATEGORIES = {
  homework: { icon: BookOpen, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-100" },
  streak: { icon: Flame, color: "from-orange-500 to-red-500", bgColor: "bg-orange-100" },
  grade: { icon: Star, color: "from-yellow-400 to-amber-500", bgColor: "bg-yellow-100" },
  speed: { icon: Zap, color: "from-purple-500 to-pink-500", bgColor: "bg-purple-100" },
  focus: { icon: Target, color: "from-green-500 to-emerald-500", bgColor: "bg-green-100" },
  social: { icon: Heart, color: "from-pink-500 to-rose-500", bgColor: "bg-pink-100" },
  milestone: { icon: Trophy, color: "from-amber-500 to-yellow-500", bgColor: "bg-amber-100" },
  special: { icon: Crown, color: "from-indigo-500 to-violet-500", bgColor: "bg-indigo-100" },
  time: { icon: Clock, color: "from-teal-500 to-cyan-500", bgColor: "bg-teal-100" },
  perfect: { icon: Medal, color: "from-emerald-500 to-green-500", bgColor: "bg-emerald-100" },
};

export type AchievementCategory = keyof typeof ACHIEVEMENT_CATEGORIES;

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  category?: AchievementCategory;
  rarity?: "common" | "rare" | "epic" | "legendary";
  icon?: React.ElementType;
}

interface AchievementUnlockEffectProps {
  achievement: Achievement;
  isVisible: boolean;
  onClose: () => void;
  onClaim?: (achievement: Achievement) => void;
  enableSound?: boolean;
  enableHaptics?: boolean;
}

// Confetti particle component
function ConfettiParticle({ 
  color,
  shouldReduceMotion,
}: { 
  index?: number; 
  color: string;
  shouldReduceMotion: boolean;
}) {
  const randomX = Math.random() * 400 - 200;
  const randomDelay = Math.random() * 0.5;
  const randomDuration = 1.5 + Math.random() * 1;
  const randomRotation = Math.random() * 720 - 360;
  const size = 8 + Math.random() * 8;
  
  if (shouldReduceMotion) {
    return null;
  }

  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: "50%",
        top: "50%",
      }}
      initial={{ 
        x: 0, 
        y: 0, 
        opacity: 1,
        rotate: 0,
        scale: 0,
      }}
      animate={{ 
        x: randomX, 
        y: 300 + Math.random() * 200,
        opacity: 0,
        rotate: randomRotation,
        scale: [0, 1, 1, 0.5, 0],
      }}
      transition={{ 
        duration: randomDuration,
        delay: randomDelay,
        ease: "easeOut",
      }}
    />
  );
}

// Star burst component
function StarBurst({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const stars = Array.from({ length: 12 }, (_, i) => i);
  
  if (shouldReduceMotion) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((i) => {
        const angle = (i / 12) * 360;
        const radians = (angle * Math.PI) / 180;
        
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 text-yellow-400"
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0, 
              opacity: 1,
            }}
            animate={{ 
              x: Math.cos(radians) * 120,
              y: Math.sin(radians) * 120,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0],
            }}
            transition={{ 
              duration: 0.8,
              delay: 0.2,
              ease: "easeOut",
            }}
          >
            <Star className="h-4 w-4 fill-current" />
          </motion.div>
        );
      })}
    </div>
  );
}

// Glow ring effect
function GlowRing({ 
  color, 
  delay,
  shouldReduceMotion,
}: { 
  color: string; 
  delay: number;
  shouldReduceMotion: boolean;
}) {
  if (shouldReduceMotion) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "absolute inset-0 rounded-full border-4",
        color
      )}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 2, opacity: [0, 0.5, 0] }}
      transition={{ 
        duration: 1,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

export function AchievementUnlockEffect({
  achievement,
  isVisible,
  onClose,
  onClaim,
  enableSound = false,
  enableHaptics = true,
}: AchievementUnlockEffectProps) {
  const [claimed, setClaimed] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const category = achievement.category || "milestone";
  const categoryConfig = ACHIEVEMENT_CATEGORIES[category];
  const IconComponent = achievement.icon || categoryConfig.icon;

  // Get rarity colors
  const rarityConfig = {
    common: { border: "border-gray-300", glow: "shadow-gray-300/50", label: "Obično" },
    rare: { border: "border-blue-400", glow: "shadow-blue-400/50", label: "Rijetko" },
    epic: { border: "border-purple-500", glow: "shadow-purple-500/50", label: "Epsko" },
    legendary: { border: "border-amber-400", glow: "shadow-amber-400/50", label: "Legendarno" },
  };
  
  const rarity = achievement.rarity || "common";
  const rarityStyles = rarityConfig[rarity];

  // Confetti colors based on category
  const confettiColors = [
    "#FFD700", // Gold
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#A78BFA", // Purple
    "#60A5FA", // Blue
    "#34D399", // Green
    "#F472B6", // Pink
    "#FBBF24", // Amber
  ];

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && "vibrate" in navigator) {
      // Pattern: celebration vibration
      navigator.vibrate([50, 30, 100, 30, 50]);
    }
  }, [enableHaptics]);

  // Play sound effect
  const playSound = useCallback(() => {
    if (enableSound && typeof Audio !== "undefined") {
      // Note: You would need to add actual sound files
      try {
        const audio = new Audio("/sounds/achievement-unlock.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Sound playback failed, ignore
        });
      } catch {
        // Audio not supported
      }
    }
  }, [enableSound]);

  // Effects on mount
  useEffect(() => {
    if (isVisible) {
      triggerHaptic();
      playSound();
    }
  }, [isVisible, triggerHaptic, playSound]);

  // Handle claim
  const handleClaim = () => {
    setClaimed(true);
    triggerHaptic();
    
    setTimeout(() => {
      onClaim?.(achievement);
      onClose();
      setClaimed(false);
    }, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-labelledby="achievement-title"
          aria-describedby="achievement-description"
        >
          {/* Confetti layer */}
          {!shouldReduceMotion && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {confettiColors.flatMap((color, colorIndex) =>
                Array.from({ length: 8 }, (_, i) => (
                  <ConfettiParticle
                    key={`${colorIndex}-${i}`}
                    index={colorIndex * 8 + i}
                    color={color}
                    shouldReduceMotion={shouldReduceMotion ?? false}
                  />
                ))
              )}
            </div>
          )}

          {/* Main achievement card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 15,
              }
            }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm mx-4",
              "shadow-2xl",
              rarityStyles.border,
              "border-2"
            )}
          >
            {/* Glow rings */}
            <GlowRing 
              color="border-yellow-400" 
              delay={0} 
              shouldReduceMotion={shouldReduceMotion ?? false} 
            />
            <GlowRing 
              color="border-amber-400" 
              delay={0.2} 
              shouldReduceMotion={shouldReduceMotion ?? false} 
            />
            <GlowRing 
              color="border-orange-400" 
              delay={0.4} 
              shouldReduceMotion={shouldReduceMotion ?? false} 
            />

            {/* Star burst */}
            <StarBurst shouldReduceMotion={shouldReduceMotion ?? false} />

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              aria-label="Zatvori"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Header */}
            <div className="text-center mb-6 relative z-10">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-1 mb-2"
              >
                <PartyPopper className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  Achievement Otključan!
                </span>
                <PartyPopper className="h-5 w-5 text-yellow-500 scale-x-[-1]" />
              </motion.div>

              {/* Rarity badge */}
              {rarity !== "common" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-bold mb-3",
                    rarity === "rare" && "bg-blue-100 text-blue-700",
                    rarity === "epic" && "bg-purple-100 text-purple-700",
                    rarity === "legendary" && "bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900"
                  )}
                >
                  ⭐ {rarityStyles.label}
                </motion.div>
              )}
            </div>

            {/* Achievement icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
                transition: {
                  delay: 0.3,
                  type: "spring",
                  stiffness: 200,
                }
              }}
              className="relative mx-auto mb-6"
            >
              <div
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br",
                  categoryConfig.color,
                  "shadow-lg",
                  rarityStyles.glow,
                  "relative overflow-hidden"
                )}
              >
                {/* Shimmer effect */}
                {!shouldReduceMotion && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                      repeatDelay: 1,
                    }}
                  />
                )}
                <IconComponent className="h-12 w-12 text-white relative z-10" />
              </div>

              {/* Floating sparkles */}
              {!shouldReduceMotion && (
                <>
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{
                      y: [0, -5, 0],
                      rotate: [0, 15, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-1 -left-2"
                    animate={{
                      y: [0, 5, 0],
                      rotate: [0, -15, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  >
                    <Star className="h-5 w-5 text-amber-400 fill-current" />
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* Achievement info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-6 relative z-10"
            >
              <h2 
                id="achievement-title"
                className="text-xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
              >
                {achievement.title}
              </h2>
              <p 
                id="achievement-description"
                className="text-sm text-muted-foreground"
              >
                {achievement.description}
              </p>
            </motion.div>

            {/* XP Reward */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                transition: {
                  delay: 0.5,
                  type: "spring",
                  stiffness: 300,
                }
              }}
              className={cn(
                "mx-auto mb-6 px-6 py-3 rounded-2xl",
                "bg-gradient-to-r from-yellow-100 to-amber-100",
                "dark:from-yellow-900/30 dark:to-amber-900/30",
                "border border-yellow-200 dark:border-yellow-800"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={!shouldReduceMotion ? {
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                  }}
                >
                  <Award className="h-6 w-6 text-yellow-600" />
                </motion.div>
                <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                  +{achievement.xpReward} XP
                </span>
              </div>
            </motion.div>

            {/* Claim button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={handleClaim}
                disabled={claimed}
                size="lg"
                className={cn(
                  "w-full text-lg font-bold",
                  "bg-gradient-to-r",
                  categoryConfig.color,
                  "hover:opacity-90 transition-opacity",
                  "shadow-lg",
                  claimed && "opacity-50"
                )}
              >
                {claimed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Preuzeto!
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Preuzmi Nagradu
                  </span>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing achievement unlocks
export function useAchievementUnlock() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);

  const showAchievement = useCallback((achievement: Achievement) => {
    if (currentAchievement) {
      // Queue if one is already showing
      setQueue(prev => [...prev, achievement]);
    } else {
      setCurrentAchievement(achievement);
    }
  }, [currentAchievement]);

  const hideAchievement = useCallback(() => {
    setCurrentAchievement(null);
    
    // Show next in queue after a short delay
    setTimeout(() => {
      setQueue(prev => {
        if (prev.length > 0) {
          const [next, ...rest] = prev;
          if (next) {
            setCurrentAchievement(next);
          }
          return rest;
        }
        return prev;
      });
    }, 300);
  }, []);

  return {
    currentAchievement,
    showAchievement,
    hideAchievement,
    queueLength: queue.length,
  };
}

// Export achievement categories for use elsewhere
export { ACHIEVEMENT_CATEGORIES };

export default AchievementUnlockEffect;
