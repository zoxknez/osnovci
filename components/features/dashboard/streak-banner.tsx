"use client";

import { Crown, Flame, Sparkles, Star, Trophy } from "lucide-react";
import { useMemo } from "react";

interface StreakBannerProps {
  currentStreak: number;
}

// Konfiguracija streak nivoa
const STREAK_LEVELS = [
  {
    minDays: 3,
    title: "Dobar početak!",
    message: "Super ti ide! Nastavi ovako!",
    gradient: "from-orange-400 to-orange-500",
    icon: Flame,
    badge: null,
  },
  {
    minDays: 7,
    title: "Cela nedelja!",
    message: "Neverovatno! Cela nedelja učenja u nizu! 🌟",
    gradient: "from-orange-500 to-red-500",
    icon: Star,
    badge: "Uporni učenik",
  },
  {
    minDays: 14,
    title: "Dve nedelje u nizu!",
    message: 'Prava mašina za učenje! Blizu si "Nepokolebljivog" bedža! 🎯',
    gradient: "from-red-500 to-pink-500",
    icon: Trophy,
    badge: "Fokusiran",
  },
  {
    minDays: 30,
    title: "Mesec dana!",
    message: "LEGENDARNO! Ceo mesec bez prekida! Ti si pravi šampion! 🏆👑",
    gradient: "from-purple-500 to-pink-500",
    icon: Crown,
    badge: "Nepokolebljivi",
  },
  {
    minDays: 60,
    title: "Dva meseca!",
    message: "Neverovatno postignuće! Tvoja posvećenost je inspiracija! ✨",
    gradient: "from-yellow-400 via-orange-500 to-red-500",
    icon: Sparkles,
    badge: "Legenda",
  },
] as const;

export function StreakBanner({ currentStreak }: StreakBannerProps) {
  // Ne prikazuj ako streak nije bar 3 dana
  if (currentStreak < 3) return null;

  const streakLevel = useMemo(() => {
    // Pronađi najviši nivo koji je korisnik dostigao
    for (let i = STREAK_LEVELS.length - 1; i >= 0; i--) {
      if (currentStreak >= STREAK_LEVELS[i]!.minDays) {
        return STREAK_LEVELS[i]!;
      }
    }
    return STREAK_LEVELS[0]!;
  }, [currentStreak]);

  // Izračunaj progress do sledećeg nivoa
  const nextLevel = useMemo(() => {
    const currentIndex = STREAK_LEVELS.findIndex(
      (l) => l.minDays === streakLevel.minDays,
    );
    if (currentIndex < STREAK_LEVELS.length - 1) {
      return STREAK_LEVELS[currentIndex + 1];
    }
    return null;
  }, [streakLevel]);

  const progressToNext = useMemo(() => {
    if (!nextLevel) return 100;
    const prevThreshold = streakLevel.minDays;
    const nextThreshold = nextLevel.minDays;
    const progress =
      ((currentStreak - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
    return Math.min(Math.round(progress), 100);
  }, [currentStreak, streakLevel, nextLevel]);

  const Icon = streakLevel.icon;

  return (
    <div
      className={`bg-gradient-to-r ${streakLevel.gradient} text-white rounded-xl p-6 shadow-lg relative overflow-hidden`}
      role="status"
      aria-label={`Streak: ${currentStreak} dana u nizu`}
    >
      {/* Background decorative flames */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 text-8xl">🔥</div>
        <div className="absolute bottom-0 left-0 text-6xl">🔥</div>
      </div>

      <div className="relative flex items-center gap-4">
        <div
          className="text-5xl flex items-center justify-center"
          aria-hidden="true"
        >
          <Icon className="h-12 w-12 animate-pulse" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-2xl">{streakLevel.title}</span>
            {streakLevel.badge && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                {streakLevel.badge}
              </span>
            )}
          </div>
          <p className="text-white/90 text-sm mb-2">{streakLevel.message}</p>

          {/* Progress do sledećeg nivoa */}
          {nextLevel && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>{currentStreak} dana</span>
                <span>
                  {nextLevel.minDays} dana do "{nextLevel.title}"
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-4xl font-bold" aria-hidden="true">
            {currentStreak}
          </div>
          <div className="text-sm opacity-90">dana</div>
        </div>
      </div>
    </div>
  );
}
