/**
 * Weekly Progress Report - Nedeljni Pregled Napretka
 *
 * Vizualni prikaz napretka učenika kroz sedmicu:
 * - Grafikon aktivnosti po danima
 * - Statistike domaćih zadataka
 * - Uporedba sa prethodnom sedmicom
 * - Motivacijske poruke
 */

"use client";

import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Minus,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DayData {
  day: string;
  date: Date;
  homeworkCompleted: number;
  minutesStudied: number;
  xpEarned: number;
}

interface WeeklyProgressProps {
  currentWeek: DayData[];
  previousWeek?: DayData[];
  totalHomeworkThisWeek?: number;
  streak?: number;
  className?: string;
}

const DAYS_SHORT = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];
const DAYS_FULL = [
  "Ponedeljak",
  "Utorak",
  "Srijeda",
  "Četvrtak",
  "Petak",
  "Subota",
  "Nedelja",
];

// Generišu se mock podaci ako nisu proslijeđeni
function generateMockWeekData(weekOffset: number = 0): DayData[] {
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // 0 = Monday

  return DAYS_FULL.map((day, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - currentDayIndex + index - weekOffset * 7);

    const isPast = date < today;
    const isToday = date.toDateString() === today.toDateString();

    return {
      day,
      date,
      homeworkCompleted: isPast || isToday ? Math.floor(Math.random() * 4) : 0,
      minutesStudied:
        isPast || isToday ? Math.floor(Math.random() * 90) + 15 : 0,
      xpEarned: isPast || isToday ? Math.floor(Math.random() * 150) + 25 : 0,
    };
  });
}

// Izračunaj trend
function calculateTrend(
  current: number,
  previous: number,
): {
  trend: "up" | "down" | "same";
  percentage: number;
} {
  if (previous === 0)
    return { trend: current > 0 ? "up" : "same", percentage: 0 };

  const diff = ((current - previous) / previous) * 100;

  if (Math.abs(diff) < 5) return { trend: "same", percentage: 0 };
  return {
    trend: diff > 0 ? "up" : "down",
    percentage: Math.abs(Math.round(diff)),
  };
}

// Motivacijska poruka na osnovu performansi
function getMotivationalMessage(
  completedHomework: number,
  totalHomework: number,
  trend: "up" | "down" | "same",
): string {
  const completionRate =
    totalHomework > 0 ? completedHomework / totalHomework : 0;

  if (completionRate >= 1) {
    return "🏆 Savršena sedmica! Sve si završio/la!";
  }
  if (completionRate >= 0.8) {
    return "⭐ Odličan rad! Samo još malo do savršenstva!";
  }
  if (completionRate >= 0.5) {
    if (trend === "up") return "📈 Dobar napredak! Nastavi tako!";
    return "💪 Možeš bolje! Fokusiraj se na prioritete.";
  }
  if (trend === "up") return "🌱 Lijepo napredovanje! Svaki korak se računa.";
  return "🎯 Nova sedmica, nove prilike! Kreni jako!";
}

export function WeeklyProgress({
  currentWeek = generateMockWeekData(0),
  previousWeek = generateMockWeekData(1),
  totalHomeworkThisWeek = 12,
  streak = 5,
  className,
}: WeeklyProgressProps) {
  // Izračunaj statistike
  const stats = useMemo(() => {
    const totalCompleted = currentWeek.reduce(
      (sum, d) => sum + d.homeworkCompleted,
      0,
    );
    const totalMinutes = currentWeek.reduce(
      (sum, d) => sum + d.minutesStudied,
      0,
    );
    const totalXP = currentWeek.reduce((sum, d) => sum + d.xpEarned, 0);

    const prevCompleted = previousWeek.reduce(
      (sum, d) => sum + d.homeworkCompleted,
      0,
    );
    const prevMinutes = previousWeek.reduce(
      (sum, d) => sum + d.minutesStudied,
      0,
    );
    const prevXP = previousWeek.reduce((sum, d) => sum + d.xpEarned, 0);

    return {
      completed: totalCompleted,
      minutes: totalMinutes,
      xp: totalXP,
      completedTrend: calculateTrend(totalCompleted, prevCompleted),
      minutesTrend: calculateTrend(totalMinutes, prevMinutes),
      xpTrend: calculateTrend(totalXP, prevXP),
    };
  }, [currentWeek, previousWeek]);

  // Max vrijednost za skaliranje grafa
  const maxHomework = Math.max(
    ...currentWeek.map((d) => d.homeworkCompleted),
    1,
  );

  // Današnji dan
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;

  const message = getMotivationalMessage(
    stats.completed,
    totalHomeworkThisWeek,
    stats.completedTrend.trend,
  );

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "same" }) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Nedeljni Pregled
              </CardTitle>
              <p className="text-xs text-white/80 mt-0.5">{message}</p>
            </div>
          </div>

          {streak >= 3 && (
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg">
              <Flame className="w-4 h-4 text-orange-300" />
              <span className="text-sm font-medium">{streak} dana</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Activity Chart */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Završeni zadaci po danima
          </h4>

          <div className="flex items-end justify-between gap-2 h-24">
            {currentWeek.map((day, index) => {
              const height =
                maxHomework > 0
                  ? (day.homeworkCompleted / maxHomework) * 100
                  : 0;
              const isToday = index === todayIndex;
              const isPast = index < todayIndex;

              return (
                <div
                  key={day.day}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  {/* Bar */}
                  <div className="w-full h-20 flex items-end justify-center">
                    <div
                      className={cn(
                        "w-full max-w-8 rounded-t-lg transition-all duration-500",
                        isToday
                          ? "bg-gradient-to-t from-blue-500 to-blue-400"
                          : isPast
                            ? day.homeworkCompleted > 0
                              ? "bg-gradient-to-t from-green-500 to-green-400"
                              : "bg-gray-200"
                            : "bg-gray-100",
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>

                  {/* Count */}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isToday ? "text-blue-600" : "text-gray-500",
                    )}
                  >
                    {day.homeworkCompleted}
                  </span>

                  {/* Day label */}
                  <span
                    className={cn(
                      "text-xs",
                      isToday ? "text-blue-600 font-medium" : "text-gray-400",
                    )}
                  >
                    {DAYS_SHORT[index]}
                  </span>

                  {/* Today indicator */}
                  {isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Completed */}
          <div className="p-3 bg-green-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <TrendIcon trend={stats.completedTrend.trend} />
            </div>
            <span className="block text-2xl font-bold text-gray-800">
              {stats.completed}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Završeno</span>
              {stats.completedTrend.percentage > 0 && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    stats.completedTrend.trend === "up"
                      ? "text-green-600"
                      : "text-red-600",
                  )}
                >
                  {stats.completedTrend.trend === "up" ? "+" : "-"}
                  {stats.completedTrend.percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Minutes */}
          <div className="p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <TrendIcon trend={stats.minutesTrend.trend} />
            </div>
            <span className="block text-2xl font-bold text-gray-800">
              {Math.floor(stats.minutes / 60)}h
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Učenja</span>
              {stats.minutesTrend.percentage > 0 && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    stats.minutesTrend.trend === "up"
                      ? "text-green-600"
                      : "text-red-600",
                  )}
                >
                  {stats.minutesTrend.trend === "up" ? "+" : "-"}
                  {stats.minutesTrend.percentage}%
                </span>
              )}
            </div>
          </div>

          {/* XP */}
          <div className="p-3 bg-amber-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-amber-500" />
              <TrendIcon trend={stats.xpTrend.trend} />
            </div>
            <span className="block text-2xl font-bold text-gray-800">
              {stats.xp}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">XP</span>
              {stats.xpTrend.percentage > 0 && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    stats.xpTrend.trend === "up"
                      ? "text-green-600"
                      : "text-red-600",
                  )}
                >
                  {stats.xpTrend.trend === "up" ? "+" : "-"}
                  {stats.xpTrend.percentage}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress to Goal */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Target className="w-4 h-4" />
              <span>Sedmični cilj</span>
            </div>
            <span className="text-sm font-medium">
              {stats.completed}/{totalHomeworkThisWeek}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                stats.completed >= totalHomeworkThisWeek
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500",
              )}
              style={{
                width: `${Math.min((stats.completed / totalHomeworkThisWeek) * 100, 100)}%`,
              }}
            />
          </div>

          {stats.completed >= totalHomeworkThisWeek && (
            <div className="flex items-center gap-2 mt-2 text-green-600">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium">Cilj dostignut! 🎉</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
