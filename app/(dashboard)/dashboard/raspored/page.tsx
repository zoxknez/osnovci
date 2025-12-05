// Raspored časova - Modern Weekly Schedule
"use client";

import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { sr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Loader,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/features/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOfflineSchedule } from "@/hooks/use-offline-schedule";
import { useSchedule } from "@/hooks/use-schedule";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations/variants";
import { exportScheduleToPDF } from "@/lib/utils/schedule-pdf-export";
import { useAuthStore, useSyncStore } from "@/store";

interface ScheduleEntry {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject?:
    | {
        id: string;
        name: string;
        color?: string | undefined;
        icon?: string | null | undefined;
      }
    | null
    | undefined;
  room?: string | null | undefined;
  notes?: string | null | undefined;
  createdAt?: string | Date | undefined;
  updatedAt?: string | Date | undefined;
  customTitle?: string | null | undefined;
  customColor?: string | null | undefined;
}

// Helper to safely get lesson properties that might not exist on all types
const getLessonProp = <T,>(
  lesson: ScheduleEntry,
  prop: keyof ScheduleEntry,
  fallback: T,
): T => {
  const value = lesson[prop];
  return (value ?? fallback) as T;
};

// Helper za srpsku deklinaciju broja časova
const formatLessonCount = (count: number): string => {
  if (count === 1) return "čas";
  if (count >= 2 && count <= 4) return "časa";
  return "časova";
};

// Helper za dobijanje učionice iz lesson objekta
const getLessonRoom = (lesson: ScheduleEntry): string => {
  return lesson.room || "Učionica nije određena";
};

const DAYS = [
  { key: "MONDAY", label: "Ponedeljak", short: "Pon" },
  { key: "TUESDAY", label: "Utorak", short: "Uto" },
  { key: "WEDNESDAY", label: "Sreda", short: "Sre" },
  { key: "THURSDAY", label: "Četvrtak", short: "Čet" },
  { key: "FRIDAY", label: "Petak", short: "Pet" },
  { key: "SATURDAY", label: "Subota", short: "Sub" },
  { key: "SUNDAY", label: "Nedelja", short: "Ned" },
];

export default function RasporedPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedDayRef = useRef<HTMLButtonElement>(null);

  // Offline support
  const { offlineSchedule, cacheSchedule, hasOfflineSchedule } =
    useOfflineSchedule();
  const { isOnline } = useSyncStore();
  const { user } = useAuthStore();

  // React Query hook - automatic caching and refetching
  const {
    data: scheduleData,
    isLoading: loading,
    error,
  } = useSchedule({
    limit: 100,
  });

  // Cache schedule when loaded online
  useEffect(() => {
    if (scheduleData?.data && Array.isArray(scheduleData.data)) {
      // Type assertion needed because API returns slightly different structure
      cacheSchedule(
        scheduleData.data.map((item) => ({
          id: item.id,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          subject: item.subject
            ? {
                id: item.subject.id,
                name: item.subject.name,
                color: item.subject.color || "#3b82f6",
                icon: item.subject.icon || null,
              }
            : {
                id: "",
                name: "Nepoznat predmet",
                color: "#3b82f6",
                icon: null,
              },
          classroom: item.room || null,
          notes: item.notes || null,
          createdAt: item.createdAt?.toString() || new Date().toISOString(),
          updatedAt: item.updatedAt?.toString() || new Date().toISOString(),
        })),
      );
    }
  }, [scheduleData, cacheSchedule]);

  // Determine which schedule to use
  const schedule = useMemo(() => {
    if (isOnline && scheduleData?.data) {
      return scheduleData.data;
    }
    if (!isOnline && hasOfflineSchedule) {
      return offlineSchedule;
    }
    return Array.isArray(scheduleData?.data) ? scheduleData.data : [];
  }, [isOnline, scheduleData, offlineSchedule, hasOfflineSchedule]);

  // Show error toast if query fails and no offline data
  const errorShownRef = useRef(false);
  useEffect(() => {
    if (error && !hasOfflineSchedule && !errorShownRef.current) {
      errorShownRef.current = true;
      toast.error("Greška pri učitavanju rasporeda");
    }
    if (!error) {
      errorShownRef.current = false;
    }
  }, [error, hasOfflineSchedule]);

  // PDF Export handler (defined after schedule is available)
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    try {
      // Allow UI to update before blocking operation
      await new Promise((resolve) => setTimeout(resolve, 0));
      const fileName = exportScheduleToPDF(
        schedule,
        user?.student?.name || "Učenik",
      );
      toast.success("PDF je generisan!", {
        description: `Sačuvano kao ${fileName}`,
      });
    } catch (err) {
      toast.error("Greška pri generisanju PDF-a");
      console.error(err);
    } finally {
      setIsExportingPDF(false);
    }
  }, [isExportingPDF, schedule, user?.student?.name]);

  // Get current week start
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday

  // Get week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Get current time for LIVE indicator - refresh every minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentTime = format(now, "HH:mm");
  const currentDayIndex = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
  const currentDayKey = currentDayIndex?.key ?? "MONDAY";

  // Check if lesson is happening now
  const isLessonActive = (lesson: ScheduleEntry) => {
    if (lesson.dayOfWeek !== currentDayKey) return false;
    return currentTime >= lesson.startTime && currentTime <= lesson.endTime;
  };

  // Calculate lesson progress
  const getLessonProgress = (lesson: ScheduleEntry) => {
    if (!isLessonActive(lesson)) return 0;

    const startParts = lesson.startTime.split(":").map(Number);
    const endParts = lesson.endTime.split(":").map(Number);
    const nowParts = currentTime.split(":").map(Number);

    const startH = startParts[0] ?? 0;
    const startM = startParts[1] ?? 0;
    const endH = endParts[0] ?? 0;
    const endM = endParts[1] ?? 0;
    const nowH = nowParts[0] ?? 0;
    const nowM = nowParts[1] ?? 0;

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const nowMinutes = nowH * 60 + nowM;

    const totalDuration = endMinutes - startMinutes;
    const elapsed = nowMinutes - startMinutes;

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  // Get lessons for selected day
  const selectedDayIndex =
    DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];
  const selectedDayKey = selectedDayIndex?.key ?? "MONDAY";
  const dayLessons = useMemo(
    () => schedule.filter((l) => l.dayOfWeek === selectedDayKey),
    [schedule, selectedDayKey],
  );

  // Group lessons by day for week view
  const weekSchedule = useMemo(() => {
    return DAYS.map((day) => ({
      day: day.key,
      label: day.label,
      short: day.short,
      lessons: schedule.filter((l) => l.dayOfWeek === day.key),
    }));
  }, [schedule]);

  // Auto-scroll to selected day when it changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedDate triggers scroll intentionally
  useEffect(() => {
    if (selectedDayRef.current && scrollContainerRef.current) {
      selectedDayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDate]);

  if (loading && !hasOfflineSchedule) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="📅 Raspored časova"
          description="Pregled svih tvojih časova u nedelji. Organizuj se i nikad ne zakasni!"
          variant="orange"
          badge="Aktuelno"
        />
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* PageHeader - Hero sekcija */}
      <PageHeader
        title="📅 Raspored časova"
        description={
          isOnline
            ? "Pregled svih tvojih časova u nedelji. Organizuj se i nikad ne zakasni!"
            : "Offline režim - prikazujem sačuvani raspored"
        }
        variant="orange"
        badge="Aktuelno"
        action={
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="hidden sm:flex"
              aria-label="Preuzmi raspored kao PDF"
            >
              {isExportingPDF ? (
                <Loader
                  className="h-4 w-4 mr-2 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              PDF
            </Button>
          </div>
        }
      />

      {/* Header - Mobile optimized */}
      <motion.div
        className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        <div>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {format(selectedDate, "EEEE, d. MMMM yyyy.", { locale: sr })}
          </p>
        </div>

        {/* View Mode Toggle - Enhanced mobile */}
        <div
          className="flex gap-2 bg-gray-100 p-1 rounded-xl"
          role="tablist"
          aria-label="Izbor prikaza rasporeda"
        >
          <Button
            variant={viewMode === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("day")}
            aria-label="Prikaži raspored za jedan dan"
            aria-selected={viewMode === "day"}
            role="tab"
            className={`
              flex-1 sm:flex-none px-6 sm:px-4 touch-manipulation
              ${viewMode === "day" ? "shadow-md" : "hover:bg-gray-200"}
            `}
          >
            Dan
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("week")}
            aria-label="Prikaži raspored za celu nedelju"
            aria-selected={viewMode === "week"}
            role="tab"
            className={`
              flex-1 sm:flex-none px-6 sm:px-4 touch-manipulation
              ${viewMode === "week" ? "shadow-md" : "hover:bg-gray-200"}
            `}
          >
            Nedelja
          </Button>
        </div>
      </motion.div>

      {/* Week Navigation - Enhanced mobile design */}
      <Card className="shadow-md">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedDate(
                  addDays(selectedDate, viewMode === "day" ? -1 : -7),
                )
              }
              aria-label={
                viewMode === "day" ? "Prethodni dan" : "Prethodna nedelja"
              }
              className="flex-shrink-0 h-10 w-10 sm:h-9 sm:w-auto sm:px-3 p-0 touch-manipulation"
            >
              <ChevronLeft
                className="h-5 w-5 sm:h-4 sm:w-4"
                aria-hidden="true"
              />
            </Button>

            {/* Horizontalni scroll na mobilnom, grid na desktopu - Mobile optimized */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto scroll-smooth scrollbar-hide"
            >
              <div className="flex lg:grid lg:grid-cols-7 gap-2 sm:gap-3 pb-1">
                {weekDays.map((day) => {
                  const dayKeyObj =
                    DAYS[day.getDay() === 0 ? 6 : day.getDay() - 1];
                  const dayKey = dayKeyObj?.key ?? "MONDAY";
                  const lessonsCount = schedule.filter(
                    (l) => l.dayOfWeek === dayKey,
                  ).length;
                  const selected = isSameDay(day, selectedDate);
                  const today = isSameDay(day, now);

                  return (
                    <motion.button
                      key={day.toISOString()}
                      ref={selected ? selectedDayRef : undefined}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(day)}
                      aria-label={`${dayKeyObj?.label ?? "Dan"}, ${format(day, "d. MMMM", { locale: sr })}${today ? ", danas" : ""}${lessonsCount > 0 ? `, ${lessonsCount} ${formatLessonCount(lessonsCount)}` : ""}`}
                      aria-current={today ? "date" : undefined}
                      className={`
                        relative p-1.5 rounded-lg text-center transition-all flex-shrink-0 
                        w-[64px] sm:w-20 lg:w-auto min-h-[60px] sm:min-h-[60px]
                        touch-manipulation group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                        ${
                          selected
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                            : "bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-md"
                        }
                        ${today && !selected ? "ring-2 ring-offset-2 ring-blue-400" : ""}
                      `}
                    >
                      {/* Day label */}
                      <div
                        className={`text-[10px] sm:text-sm font-semibold mb-1 uppercase tracking-wide ${selected ? "text-blue-100" : "text-gray-500"}`}
                      >
                        {dayKeyObj?.short ?? ""}
                      </div>

                      {/* Date number */}
                      <div
                        className={`text-xl sm:text-2xl font-bold mb-1 ${selected ? "text-white" : "text-gray-900"}`}
                      >
                        {format(day, "d")}
                      </div>

                      {/* Lessons indicator */}
                      {lessonsCount > 0 && (
                        <div
                          className={`
                          text-[9px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full inline-block
                          ${
                            selected
                              ? "bg-white/20 text-white"
                              : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                          }
                        `}
                        >
                          {lessonsCount} {formatLessonCount(lessonsCount)}
                        </div>
                      )}

                      {/* Today indicator dot */}
                      {today && (
                        <div className="absolute top-1.5 right-1.5">
                          <span
                            className={`block w-2 h-2 rounded-full ${selected ? "bg-white" : "bg-blue-500"}`}
                          ></span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedDate(
                  addDays(selectedDate, viewMode === "day" ? 1 : 7),
                )
              }
              aria-label={
                viewMode === "day" ? "Sledeći dan" : "Sledeća nedelja"
              }
              className="flex-shrink-0 h-10 w-10 sm:h-9 sm:w-auto sm:px-3 p-0 touch-manipulation"
            >
              <ChevronRight
                className="h-5 w-5 sm:h-4 sm:w-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Content */}
      <AnimatePresence mode="wait">
        {viewMode === "day" ? (
          <motion.div
            key="day-view"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
            className="space-y-4"
          >
            {dayLessons.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nema časova!
                  </h3>
                  <p className="text-gray-600">Uživaj u slobodnom danu</p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-3"
              >
                {dayLessons.map((lesson, idx) => {
                  const isActive = isLessonActive(lesson);
                  return (
                    <motion.div key={lesson.id} variants={staggerItem}>
                      <Card
                        className={`
                          transition-all hover:shadow-lg
                          ${isActive ? "ring-2 ring-green-500 shadow-xl" : ""}
                        `}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Time */}
                            <div className="flex-shrink-0 text-center min-w-[80px]">
                              <div className="text-2xl font-bold text-gray-900">
                                {lesson.startTime}
                              </div>
                              <div className="text-sm text-gray-500">
                                {lesson.endTime}
                              </div>
                              {isActive && (
                                <output
                                  aria-live="polite"
                                  aria-label="Čas je trenutno u toku"
                                >
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium"
                                  >
                                    <motion.div
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 2,
                                      }}
                                      aria-hidden="true"
                                    >
                                      🔴
                                    </motion.div>
                                    UŽIVO
                                  </motion.div>
                                </output>
                              )}

                              {isActive && (
                                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <motion.div
                                    className="bg-green-500 h-full rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${getLessonProgress(lesson)}%`,
                                    }}
                                    transition={{ duration: 1 }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Subject Card */}
                            <div
                              className="flex-1 p-4 rounded-lg"
                              style={{
                                backgroundColor: `${lesson.subject?.color || ("customColor" in lesson ? lesson.customColor : null) || "#3b82f6"}15`,
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    {lesson.subject?.icon && (
                                      <span className="text-2xl">
                                        {lesson.subject.icon}
                                      </span>
                                    )}
                                    <h3 className="text-xl font-bold text-gray-900">
                                      {lesson.subject?.name ||
                                        ("customTitle" in lesson
                                          ? lesson.customTitle
                                          : null) ||
                                        "Događaj"}
                                    </h3>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <BookOpen
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      />
                                      {getLessonRoom(lesson)}
                                    </div>
                                    {lesson.notes && (
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {lesson.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Class Number Badge */}
                                <div
                                  className="text-center px-4 py-2 rounded-lg font-bold text-white"
                                  style={{
                                    backgroundColor:
                                      lesson.subject?.color ||
                                      getLessonProp(
                                        lesson,
                                        "customColor",
                                        "#3b82f6",
                                      ),
                                  }}
                                >
                                  <div className="text-xs">Čas</div>
                                  <div className="text-2xl">{idx + 1}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="week-view"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeInUp}
            className="grid gap-4 lg:grid-cols-2"
          >
            {weekSchedule.map((day) => (
              <Card key={day.day} className="overflow-hidden">
                <div
                  className={`p-4 ${
                    day.day === currentDayKey
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  <h3 className="text-lg font-bold">{day.label}</h3>
                  <p className="text-sm opacity-90">
                    {day.lessons.length} {formatLessonCount(day.lessons.length)}
                  </p>
                </div>
                <CardContent className="p-4">
                  {day.lessons.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Nema časova
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {day.lessons.map((lesson) => {
                        const isActive = isLessonActive(lesson);
                        return (
                          <div
                            key={lesson.id}
                            className={`
                              p-3 rounded-lg transition-all
                              ${isActive ? "ring-2 ring-green-500 shadow-lg" : ""}
                            `}
                            style={{
                              backgroundColor: `${lesson.subject?.color || getLessonProp(lesson, "customColor", "#3b82f6")}10`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {lesson.subject?.icon && (
                                <span className="text-2xl">
                                  {lesson.subject.icon}
                                </span>
                              )}
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">
                                  {lesson.subject?.name ||
                                    getLessonProp(
                                      lesson,
                                      "customTitle",
                                      "Događaj",
                                    )}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {lesson.startTime} - {lesson.endTime}
                                </div>
                              </div>
                              {isActive && (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="text-xl"
                                >
                                  🔴
                                </motion.div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions - Enhanced with shortcuts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid gap-3 sm:gap-4 md:grid-cols-2"
      >
        {/* Notifications Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Podsetnici
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Aktiviraj notifikacije za časove
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                aria-label="Podesi podsetnik za časove"
                className="touch-manipulation w-full sm:w-auto"
              >
                Podesi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links Card - Mobile only */}
        <Card className="hover:shadow-lg transition-shadow md:hidden">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">
              Brze prečice
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/dashboard"
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all touch-manipulation"
                aria-label="Idi na danas"
              >
                <span className="text-2xl">🏠</span>
                <span className="text-xs font-medium text-gray-700">Danas</span>
              </Link>
              <Link
                href="/dashboard/domaci"
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all touch-manipulation"
                aria-label="Idi na domaće"
              >
                <span className="text-2xl">📚</span>
                <span className="text-xs font-medium text-gray-700">
                  Domaći
                </span>
              </Link>
              <Link
                href="/dashboard/ocene"
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all touch-manipulation"
                aria-label="Idi na ocene"
              >
                <span className="text-2xl">📊</span>
                <span className="text-xs font-medium text-gray-700">Ocene</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
