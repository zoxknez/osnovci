// Raspored časova - Modern Weekly Schedule
"use client";

import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { sr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpen, ChevronLeft, ChevronRight, Clock, Loader } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/features/page-header";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations/variants";
import { useSchedule } from "@/lib/hooks/use-react-query";

interface ScheduleEntry {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: { id: string; name: string; color: string; icon: string | null };
  classroom: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

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

  // React Query hook - automatic caching and refetching
  const { data: scheduleData, isLoading: loading, error } = useSchedule({
    limit: 100,
  });

  // Show error toast if query fails
  if (error) {
    toast.error("Greška pri učitavanju rasporeda");
  }

  const schedule = Array.isArray(scheduleData?.data) ? scheduleData.data : [];

  // Get current week start
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday

  // Get week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Get current time for LIVE indicator
  const now = new Date();
  const currentTime = format(now, "HH:mm");
  const currentDayKey = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1].key;

  // Check if lesson is happening now
  const isLessonActive = (lesson: ScheduleEntry) => {
    if (lesson.dayOfWeek !== currentDayKey) return false;
    return currentTime >= lesson.startTime && currentTime <= lesson.endTime;
  };

  // Get lessons for selected day
  const selectedDayKey =
    DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1].key;
  const dayLessons = schedule.filter(
    (l) => l.dayOfWeek === selectedDayKey,
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

  const isToday = (date: Date) => isSameDay(date, now);

  // Auto-scroll to selected day
  useEffect(() => {
    if (selectedDayRef.current && scrollContainerRef.current) {
      selectedDayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
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
        description="Pregled svih tvojih časova u nedelji. Organizuj se i nikad ne zakasni!"
        variant="orange"
        badge="Aktuelno"
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
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <Button
            variant={viewMode === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("day")}
            aria-label="Prikaži raspored za jedan dan"
            aria-pressed={viewMode === "day"}
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
            aria-pressed={viewMode === "week"}
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
                  const dayKey =
                    DAYS[day.getDay() === 0 ? 6 : day.getDay() - 1];
                  const lessonsCount = schedule.filter(
                    (l) => l.dayOfWeek === dayKey.key,
                  ).length;
                  const selected = isSameDay(day, selectedDate);
                  const today = isToday(day);

                  return (
                    <motion.button
                      key={day.toISOString()}
                      ref={selected ? selectedDayRef : undefined}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-1.5 rounded-lg text-center transition-all flex-shrink-0 
                        w-[64px] sm:w-20 lg:w-auto min-h-[60px] sm:min-h-[60px]
                        touch-manipulation group
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
                        {dayKey.short}
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
                          {lessonsCount} čas
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
                                  >
                                    🔴
                                  </motion.div>
                                  UŽIVO
                                </motion.div>
                              )}
                            </div>

                            {/* Subject Card */}
                            <div
                              className="flex-1 p-4 rounded-lg"
                              style={{
                                backgroundColor: `${lesson.subject.color}15`,
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    {lesson.subject.icon && (
                                      <span className="text-2xl">
                                        {lesson.subject.icon}
                                      </span>
                                    )}
                                    <h3 className="text-xl font-bold text-gray-900">
                                      {lesson.subject.name}
                                    </h3>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="h-4 w-4" />
                                      {lesson.classroom || "Učionica nije određena"}
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
                                    backgroundColor: lesson.subject.color,
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
                    {day.lessons.length} čas
                    {day.lessons.length !== 1 ? "a" : ""}
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
                              backgroundColor: `${lesson.subject.color}10`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {lesson.subject.icon && (
                                <span className="text-2xl">
                                  {lesson.subject.icon}
                                </span>
                              )}
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">
                                  {lesson.subject.name}
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
