/**
 * Daily Challenges - Dnevni Izazovi za Učenike
 *
 * Nova funkcionalnost koja motiviše učenike svakodnevnim zadacima:
 * - 3 dnevna izazova (lak, srednji, težak)
 * - Bonus XP za sve 3 izazova
 * - Streak bonus za uzastopne dane
 * - Vizuelni progress
 */

"use client";

import {
  CheckCircle2,
  Clock,
  Flame,
  Gift,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChallengeType = "homework" | "streak" | "time" | "quality" | "social";
type Difficulty = "easy" | "medium" | "hard";

interface ChallengeTemplate {
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  xpBonus: number;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: Difficulty;
  type: ChallengeType;
  target: number;
  current: number;
  completed: boolean;
  icon: React.ReactNode;
}

interface DailyChallengesProps {
  currentStreak?: number;
  todayHomeworkCount?: number;
  completedHomeworkCount?: number;
  className?: string;
}

// Icon based on challenge type
function getChallengeIcon(type: ChallengeType) {
  switch (type) {
    case "homework":
      return <CheckCircle2 className="w-5 h-5" />;
    case "streak":
      return <Flame className="w-5 h-5" />;
    case "time":
      return <Clock className="w-5 h-5" />;
    case "quality":
      return <Star className="w-5 h-5" />;
    case "social":
      return <Gift className="w-5 h-5" />;
    default:
      return <Target className="w-5 h-5" />;
  }
}

// Get progress for a challenge
function getChallengeProgress(
  type: ChallengeType,
  target: number,
  completedHomework: number,
  streak: number,
): number {
  switch (type) {
    case "homework":
      return Math.min(completedHomework, target);
    case "streak":
      return streak;
    default:
      return 0;
  }
}

// Generisanje dnevnih izazova na osnovu datuma (deterministički)
function generateDailyChallenges(
  date: Date,
  streak: number,
  todayHomework: number,
  completedHomework: number,
): DailyChallenge[] {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const seed = dayOfYear + date.getFullYear();

  const easyTemplates: ChallengeTemplate[] = [
    {
      title: "Ranoranilac",
      description: "Završi bar 1 domaći pre 12h",
      type: "time",
      target: 1,
      xpBonus: 25,
    },
    {
      title: "Prvi Korak",
      description: "Započni rad na bilo kom domaćem",
      type: "homework",
      target: 1,
      xpBonus: 20,
    },
    {
      title: "Dnevna Vežba",
      description: "Provedi bar 15 minuta učeći",
      type: "time",
      target: 15,
      xpBonus: 30,
    },
  ];

  const mediumTemplates: ChallengeTemplate[] = [
    {
      title: "Produktivan Dan",
      description: "Završi 2 domaća zadatka",
      type: "homework",
      target: 2,
      xpBonus: 50,
    },
    {
      title: "Perfektni Detalji",
      description: "Dodaj napomene/slike na domaći",
      type: "quality",
      target: 1,
      xpBonus: 40,
    },
    {
      title: "Fokusirana Sesija",
      description: "Radi 30 min bez pauze",
      type: "time",
      target: 30,
      xpBonus: 45,
    },
  ];

  const hardTemplates: ChallengeTemplate[] = [
    {
      title: "Heroj Dana",
      description: "Završi sve današnje domaće",
      type: "homework",
      target: todayHomework || 3,
      xpBonus: 100,
    },
    {
      title: "Rano Predaja",
      description: "Predaj domaći dan pre roka",
      type: "time",
      target: 1,
      xpBonus: 75,
    },
    {
      title: "Streak Master",
      description: "Održi streak još jedan dan",
      type: "streak",
      target: streak + 1,
      xpBonus: 80,
    },
  ];

  // Deterministički izbor izazova
  const easyIndex = seed % easyTemplates.length;
  const mediumIndex = (seed + 1) % mediumTemplates.length;
  const hardIndex = (seed + 2) % hardTemplates.length;

  const easy = easyTemplates[easyIndex];
  const medium = mediumTemplates[mediumIndex];
  const hard = hardTemplates[hardIndex];

  // Build challenges with null checks
  const challenges: DailyChallenge[] = [];

  if (easy) {
    const current = getChallengeProgress(
      easy.type,
      easy.target,
      completedHomework,
      streak,
    );
    challenges.push({
      id: `easy-${seed}`,
      title: easy.title,
      description: easy.description,
      type: easy.type,
      target: easy.target,
      xpReward: easy.xpBonus,
      difficulty: "easy",
      current,
      completed: current >= easy.target,
      icon: getChallengeIcon(easy.type),
    });
  }

  if (medium) {
    const current = getChallengeProgress(
      medium.type,
      medium.target,
      completedHomework,
      streak,
    );
    challenges.push({
      id: `medium-${seed}`,
      title: medium.title,
      description: medium.description,
      type: medium.type,
      target: medium.target,
      xpReward: medium.xpBonus,
      difficulty: "medium",
      current,
      completed: current >= medium.target,
      icon: getChallengeIcon(medium.type),
    });
  }

  if (hard) {
    const current = getChallengeProgress(
      hard.type,
      hard.target,
      completedHomework,
      streak,
    );
    challenges.push({
      id: `hard-${seed}`,
      title: hard.title,
      description: hard.description,
      type: hard.type,
      target: hard.target,
      xpReward: hard.xpBonus,
      difficulty: "hard",
      current,
      completed: current >= hard.target,
      icon: getChallengeIcon(hard.type),
    });
  }

  return challenges;
}

// Izračunaj vreme do ponoći
function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

export function DailyChallenges({
  currentStreak = 0,
  todayHomeworkCount = 3,
  completedHomeworkCount = 0,
  className,
}: DailyChallengesProps) {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const today = new Date();
    setChallenges(
      generateDailyChallenges(
        today,
        currentStreak,
        todayHomeworkCount,
        completedHomeworkCount,
      ),
    );
  }, [currentStreak, todayHomeworkCount, completedHomeworkCount]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const completedCount = challenges.filter((c) => c.completed).length;
  const allCompleted = completedCount === 3;
  const totalXP = challenges.reduce(
    (sum, c) => sum + (c.completed ? c.xpReward : 0),
    0,
  );
  const bonusXP = allCompleted ? 50 : 0;

  const getDifficultyColor = (difficulty: Difficulty, completed: boolean) => {
    if (completed) return "text-green-500 bg-green-50";
    switch (difficulty) {
      case "easy":
        return "text-emerald-600 bg-emerald-50";
      case "medium":
        return "text-amber-600 bg-amber-50";
      case "hard":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "easy":
        return "Lako";
      case "medium":
        return "Srednje";
      case "hard":
        return "Teško";
      default:
        return "";
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Dnevni Izazovi
              </CardTitle>
              <p className="text-sm text-white/80">Osvoji bonus XP!</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-white/70">
              <Clock className="w-3 h-3" />
              <span>Resetuje se za {timeLeft}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    i < completedCount
                      ? "bg-yellow-400 shadow-lg shadow-yellow-400/50"
                      : "bg-white/30",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all duration-300",
              challenge.completed
                ? "border-green-200 bg-green-50/50"
                : "border-gray-100 hover:border-gray-200 hover:shadow-sm",
            )}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  getDifficultyColor(challenge.difficulty, challenge.completed),
                )}
              >
                {challenge.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  challenge.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      getDifficultyColor(
                        challenge.difficulty,
                        challenge.completed,
                      ),
                    )}
                  >
                    {getDifficultyLabel(challenge.difficulty)}
                  </span>
                  <span className="text-xs text-gray-500">
                    +{challenge.xpReward} XP
                  </span>
                </div>
                <h4
                  className={cn(
                    "font-semibold text-sm",
                    challenge.completed
                      ? "text-green-700 line-through"
                      : "text-gray-800",
                  )}
                >
                  {challenge.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {challenge.description}
                </p>

                {/* Progress Bar */}
                {!challenge.completed && challenge.target > 1 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Napredak</span>
                      <span>
                        {challenge.current}/{challenge.target}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{
                          width: `${(challenge.current / challenge.target) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Completed Badge */}
              {challenge.completed && (
                <div className="shrink-0">
                  <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Bonus Section */}
        <div
          className={cn(
            "mt-4 p-4 rounded-xl border-2 border-dashed transition-all",
            allCompleted
              ? "border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50"
              : "border-gray-200 bg-gray-50",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  allCompleted
                    ? "bg-yellow-400 text-white"
                    : "bg-gray-200 text-gray-400",
                )}
              >
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4
                  className={cn(
                    "font-semibold text-sm",
                    allCompleted ? "text-yellow-700" : "text-gray-500",
                  )}
                >
                  Bonus za sve izazove
                </h4>
                <p className="text-xs text-gray-500">
                  {allCompleted
                    ? "Čestitamo! 🎉"
                    : `Završi sva 3 izazova za bonus`}
                </p>
              </div>
            </div>
            <div
              className={cn(
                "text-lg font-bold",
                allCompleted ? "text-yellow-600" : "text-gray-400",
              )}
            >
              +{bonusXP} XP
            </div>
          </div>
        </div>

        {/* Total XP Summary */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">Ukupno danas</span>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-amber-600">
              {totalXP + bonusXP} XP
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DailyChallenges;
