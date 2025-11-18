// Dashboard "Danas" ekran - glavni pregled (Performance Optimized!)
// Fixed: Ensure homework is always an array to prevent .filter() errors
"use client";

import { log } from "@/lib/logger";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Loader,
  Plus,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/features/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useHomework,
  useProfile,
  useSchedule,
} from "@/lib/hooks/use-react-query";

export default function DashboardPage() {
  // Get today's day of week for schedule
  const today = new Date();
  const dayOfWeek = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][today.getDay()];

  // React Query hooks - automatic caching, refetching, and error handling
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();
  const {
    data: homeworkData,
    isLoading: homeworkLoading,
    error: homeworkError,
  } = useHomework({
    limit: 5,
    sortBy: "dueDate",
    order: "asc",
    status: "ASSIGNED,IN_PROGRESS",
  });
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useSchedule({
    ...(dayOfWeek !== undefined && { dayOfWeek }),
    limit: 10,
  });

  // Combine loading states
  const loading = profileLoading || homeworkLoading || scheduleLoading;

  // Extract data immediately with safe defaults (before any returns)
  // Ensure homework is ALWAYS an array, even if API returns unexpected structure
  const homework = Array.isArray(homeworkData?.data) ? homeworkData.data : [];
  const todayClasses = Array.isArray(scheduleData?.data)
    ? scheduleData.data
    : [];

  // Debug logging
  log.info("Dashboard data loaded", {
    homeworkCount: homework.length,
    isArray: Array.isArray(homework),
    hasSchedule: todayClasses.length > 0,
  });

  // Gamification data - safely access profile data
  const studentName = profileData?.profile?.name?.split(" ")[0] || "Učeniče";
  const xp = profileData?.profile?.xp || 0;
  const level = profileData?.profile?.level || 1;
  const nextLevelXP = level * 1000; // XP needed for next level
  const xpProgress = (xp / nextLevelXP) * 100;
  // Get streak from gamification API or use default
  const currentStreak = (profileData?.profile as any)?.streak || 5;

  // Show error toast if any query fails
  if (profileError) toast.error("Greška pri učitavanju profila");
  if (homeworkError) toast.error("Greška pri učitavanju domaćih zadataka");
  if (scheduleError) toast.error("Greška pri učitavanju rasporeda");

  // Show loading state early (after extracting data with safe defaults)
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

  // Helper function to determine class status
  const getClassStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startParts = startTime.split(":").map(Number);
    const endParts = endTime.split(":").map(Number);
    const startHour = startParts[0] ?? 0;
    const startMin = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 0;
    const endMin = endParts[1] ?? 0;
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    if (currentTime >= start && currentTime <= end) return "current";
    if (currentTime > end) return "done";
    return "upcoming";
  };

  // Helper function to format due date
  const getDaysUntil = (dueDate: string | Date) => {
    const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    const diff = Math.ceil(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (diff < 0) return "Rok prošao";
    if (diff === 0) return "Danas";
    if (diff === 1) return "Sutra";
    return `Za ${diff} dana`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 🎮 Demo Mode Banner */}
      <div className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 text-white rounded-2xl p-6 shadow-xl border-2 border-white/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">🎮 Demo Mode Aktivan</h2>
              <p className="text-white/90 text-sm">
                Istraži sve funkcionalnosti bez potrebe za registracijom! Podaci
                su simulirani.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/40"
            >
              📚 Dokumentacija
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Header sa gamification */}
      <PageHeader
        title={`Dobar dan, ${studentName}! 👋`}
        description="Tvoj pregled aktivnosti za danas"
        variant="gradient"
        badge="Današnjih napredaka"
        action={
          /* Level & XP Card */
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl p-6 shadow-lg min-w-[240px] self-start hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                <span className="font-bold text-lg">Level {level}</span>
              </div>
              <span className="text-sm opacity-90 font-semibold">{xp} XP</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>

            <p className="text-xs opacity-90">
              {nextLevelXP - xp} XP do Level {level + 1}
            </p>
          </div>
        }
      />

      {/* Streak & Motivation Banner */}
      {currentStreak >= 3 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-5xl">
              🔥
            </div>
            <div className="flex-1">
              <div className="font-bold text-2xl mb-1">
                {currentStreak} dana u nizu!
              </div>
              <p className="text-white/90">
                Super ti ide! Nastavi ovako i otključaj "Nepokolebljivi" bedž!
                🏆
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{currentStreak}</div>
              <div className="text-sm opacity-90">Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Link href="/dashboard/raspored">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Današnjih časova
                    </p>
                    <p className="text-4xl font-bold text-blue-900">
                      {todayClasses.length}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    <Calendar
                      className="h-7 w-7 text-white"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <Link href="/dashboard/domaci">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Aktivnih zadataka
                    </p>
                    <p className="text-4xl font-bold text-purple-900">
                      {
                        homework.filter(
                          (h) =>
                            h.status !== "DONE" && h.status !== "SUBMITTED",
                        ).length
                      }
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                    <BookOpen
                      className="h-7 w-7 text-white"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Završeno danas
                  </p>
                  <p className="text-4xl font-bold text-green-900">
                    {(profileData?.profile as any)?.completedHomework || 0}
                  </p>
                  <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    +10 XP zarada danas
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-green-700 flex items-center justify-center">
                  <CheckCircle2
                    className="h-7 w-7 text-white"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Raspored danas */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock
                      className="h-5 w-5 text-blue-600"
                      aria-hidden="true"
                    />
                    Raspored danas
                  </CardTitle>
                  <CardDescription>Tvoji časovi za danas</CardDescription>
                </div>
                <Link href="/dashboard/raspored">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Idi na pun raspored"
                  >
                    Vidi sve →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {todayClasses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nema časova danas 🎉
                </p>
              ) : (
                <ul className="space-y-3" aria-label="Današnji časovi">
                  {todayClasses.map((classItem) => {
                    const status = getClassStatus(
                      classItem.startTime,
                      classItem.endTime,
                    );
                    return (
                      <li
                        key={classItem.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          status === "current"
                            ? "bg-blue-50 border-2 border-blue-500 shadow-md"
                            : status === "done"
                              ? "bg-gray-50 opacity-60"
                              : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${
                            status === "current"
                              ? "bg-blue-600 text-white"
                              : status === "done"
                                ? "bg-gray-300 text-gray-600"
                                : "bg-gray-100 text-gray-700"
                          }`}
                          role="img"
                          aria-label={`Čas u ${classItem.startTime}`}
                        >
                          {classItem.startTime}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {(classItem as any).subject.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {(classItem as any).classroom || "Nema učionice"}
                          </p>
                        </div>

                        {status === "current" && (
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <span>🔴</span>
                            Trenutno
                          </span>
                        )}
                        {status === "done" && (
                          <CheckCircle2
                            className="h-5 w-5 text-green-700"
                            aria-label="Završeno"
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Domaći zadaci */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen
                      className="h-5 w-5 text-purple-600"
                      aria-hidden="true"
                    />
                    Domaći zadaci
                  </CardTitle>
                  <CardDescription>Aktivni zadaci i rokovi</CardDescription>
                </div>
                <Link href="/dashboard/domaci">
                  <Button
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    aria-label="Dodaj novi domaći zadatak"
                  >
                    Dodaj
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {homework.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nema aktivnih zadataka! 🎉
                </p>
              ) : (
                <ul className="space-y-3" aria-label="Skoriji domaći zadaci">
                  {homework.map((task) => (
                    <li key={task.id}>
                      <Link href="/dashboard/domaci">
                        <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer group">
                          <div
                            className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center text-xl group-hover:scale-110 group-hover:rotate-6 transition-transform ${
                              task.priority === "URGENT"
                                ? "bg-red-100"
                                : task.priority === "IMPORTANT"
                                  ? "bg-orange-100"
                                  : "bg-blue-100"
                            }`}
                            aria-hidden="true"
                          >
                            {task.status === "DONE" ? "✅" : "📝"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1 gap-2">
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {task.title}
                              </h4>
                              {task.priority === "URGENT" && (
                                <AlertCircle
                                  className="h-5 w-5 text-red-600"
                                  aria-label="Hitno"
                                />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {(task as any).subject.name}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  task.status === "DONE"
                                    ? "bg-green-100 text-green-700"
                                    : task.status === "IN_PROGRESS"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {task.status === "DONE"
                                  ? "Urađeno"
                                  : task.status === "IN_PROGRESS"
                                    ? "Radim"
                                    : "Novo"}
                              </span>
                              <span className="text-xs text-gray-500">
                                • {getDaysUntil(task.dueDate)}
                              </span>
                              {task.status === "DONE" && (
                                <span className="text-xs text-green-700 font-medium">
                                  +10 XP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
