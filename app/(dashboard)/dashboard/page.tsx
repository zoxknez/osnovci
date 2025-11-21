"use client";

import { Loader, Wifi, WifiOff, Trophy } from "lucide-react";
import { PageHeader } from "@/components/features/page-header";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DemoModeBanner } from "@/components/features/dashboard/demo-mode-banner";
import { StreakBanner } from "@/components/features/dashboard/streak-banner";
import { DailyTip } from "@/components/features/dashboard/daily-tip";
import { QuickStats } from "@/components/features/dashboard/quick-stats";
import { TodaySchedule } from "@/components/features/dashboard/today-schedule";
import { ActiveHomework } from "@/components/features/dashboard/active-homework";

export default function DashboardPage() {
  const {
    loading,
    homework,
    todayClasses,
    studentName,
    xp,
    level,
    nextLevelXP,
    xpProgress,
    currentStreak,
    completedHomeworkCount,
    isOnline,
    now
  } = useDashboardData();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Dobar dan! 👋"
          description="Tvoj pregled aktivnosti za danas"
          variant="gradient"
          badge="Današnjih napredaka"
        />
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <DemoModeBanner />

      <PageHeader
        title={`Dobar dan, ${studentName}! 👋`}
        description={
          isOnline
            ? "Tvoj pregled aktivnosti za danas"
            : "Offline režim - prikazujem sačuvane podatke"
        }
        variant="gradient"
        badge="Današnjih napredaka"
        action={
          <div className="flex flex-col items-end gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isOnline
                  ? "bg-white/20 text-white"
                  : "bg-amber-500/80 text-white"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  Offline
                </>
              )}
            </div>
            {/* Level & XP Card */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl p-6 shadow-lg min-w-[240px] self-start hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  <span className="font-bold text-lg">Level {level}</span>
                </div>
                <span className="text-sm opacity-90 font-semibold">{xp} XP</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden mb-2 relative">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${xpProgress}%` }}
                >
                  <div className="absolute inset-0 animate-shine opacity-50" />
                </div>
              </div>

              <p className="text-xs opacity-90">
                {nextLevelXP - xp} XP do Level {level + 1}
              </p>
            </div>
          </div>
        }
      />

      <StreakBanner currentStreak={currentStreak} />

      <DailyTip />

      <QuickStats 
        todayClassesCount={todayClasses.length}
        activeHomeworkCount={homework.filter((h) => h.status !== "DONE" && h.status !== "SUBMITTED").length}
        completedHomeworkCount={completedHomeworkCount}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <TodaySchedule todayClasses={todayClasses} now={now} />
        <ActiveHomework homework={homework} now={now} />
      </div>
    </div>
  );
}
