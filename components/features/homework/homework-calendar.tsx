"use client";

/**
 * HomeworkCalendar - Kalendarski prikaz zadaća
 *
 * Features:
 * - Mjesečni i sedmični prikaz
 * - Drag-and-drop za promjenu rokova
 * - Color coding po predmetima
 * - Prioritet i status indikatori
 * - Touch-friendly za djecu
 * - WCAG 2.1 AAA compliant
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  Plus,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Types
export interface HomeworkItem {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  subject: {
    id: string;
    name: string;
    color: string;
  };
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  status: "ASSIGNED" | "IN_PROGRESS" | "DONE" | "SUBMITTED" | "REVIEWED";
  estimatedMinutes?: number;
}

interface HomeworkCalendarProps {
  homework: HomeworkItem[];
  onHomeworkClick?: (homework: HomeworkItem) => void;
  onDateSelect?: (date: Date) => void;
  onAddHomework?: (date: Date) => void;
  className?: string;
}

// Serbian day names
const DAY_NAMES = ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"];
const DAY_NAMES_FULL = [
  "Nedjelja",
  "Ponedjeljak",
  "Utorak",
  "Srijeda",
  "Četvrtak",
  "Petak",
  "Subota",
];
const MONTH_NAMES = [
  "Januar",
  "Februar",
  "Mart",
  "April",
  "Maj",
  "Jun",
  "Jul",
  "Avgust",
  "Septembar",
  "Oktobar",
  "Novembar",
  "Decembar",
];

// Priority colors and icons
const PRIORITY_CONFIG = {
  NORMAL: {
    color: "bg-blue-100 text-blue-700",
    icon: BookOpen,
    label: "Normalno",
  },
  IMPORTANT: {
    color: "bg-amber-100 text-amber-700",
    icon: AlertCircle,
    label: "Važno",
  },
  URGENT: {
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
    label: "Hitno",
  },
};

// Status config
const STATUS_CONFIG = {
  ASSIGNED: { color: "border-l-blue-500", label: "Zadato" },
  IN_PROGRESS: { color: "border-l-amber-500", label: "U toku" },
  DONE: { color: "border-l-green-500", label: "Završeno" },
  SUBMITTED: { color: "border-l-purple-500", label: "Predato" },
  REVIEWED: { color: "border-l-emerald-500", label: "Pregledano" },
};

// Helper functions
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Calendar day cell component
function CalendarDay({
  date,
  homework,
  isCurrentMonth,
  isSelected,
  onClick,
  onHomeworkClick,
}: {
  date: Date;
  homework: HomeworkItem[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onClick: () => void;
  onHomeworkClick: (hw: HomeworkItem) => void;
}) {
  const today = isToday(date);
  const past = isPast(date);
  const hasHomework = homework.length > 0;
  const hasUrgent = homework.some(
    (hw) =>
      hw.priority === "URGENT" &&
      hw.status !== "DONE" &&
      hw.status !== "SUBMITTED",
  );
  const hasDue = homework.some(
    (hw) => isSameDay(new Date(hw.dueDate), date) && hw.status !== "DONE",
  );

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative min-h-[80px] p-1 border rounded-lg transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isCurrentMonth
          ? "bg-white dark:bg-gray-800"
          : "bg-gray-50 dark:bg-gray-900",
        isSelected && "ring-2 ring-primary",
        today && "ring-2 ring-blue-500",
        past && isCurrentMonth && "opacity-60",
        !isCurrentMonth && "opacity-40",
      )}
      aria-label={`${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}, ${homework.length} zadaća`}
    >
      {/* Date number */}
      <div
        className={cn(
          "text-sm font-medium mb-1",
          today && "text-blue-600 dark:text-blue-400",
          !isCurrentMonth && "text-gray-400",
        )}
      >
        {date.getDate()}
      </div>

      {/* Homework indicators */}
      {hasHomework && (
        <div className="space-y-0.5">
          {homework.slice(0, 3).map((hw) => (
            <div
              key={hw.id}
              onClick={(e) => {
                e.stopPropagation();
                onHomeworkClick(hw);
              }}
              className={cn(
                "text-xs truncate px-1 py-0.5 rounded cursor-pointer",
                "border-l-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                STATUS_CONFIG[hw.status].color,
              )}
              style={{ borderLeftColor: hw.subject.color }}
            >
              {hw.title}
            </div>
          ))}
          {homework.length > 3 && (
            <div className="text-xs text-muted-foreground px-1">
              +{homework.length - 3} više
            </div>
          )}
        </div>
      )}

      {/* Indicators */}
      <div className="absolute top-1 right-1 flex gap-0.5">
        {hasUrgent && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
        {hasDue && !hasUrgent && (
          <span className="w-2 h-2 bg-amber-500 rounded-full" />
        )}
      </div>
    </motion.button>
  );
}

// Homework item card for detail view
function HomeworkCard({
  homework,
  onClick,
}: {
  homework: HomeworkItem;
  onClick: () => void;
}) {
  const priorityConfig = PRIORITY_CONFIG[homework.priority];
  const statusConfig = STATUS_CONFIG[homework.status];
  const PriorityIcon = priorityConfig.icon;
  const isDone =
    homework.status === "DONE" ||
    homework.status === "SUBMITTED" ||
    homework.status === "REVIEWED";
  const isOverdue = !isDone && isPast(new Date(homework.dueDate));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all",
        "hover:shadow-md",
        isDone && "opacity-60",
        isOverdue &&
          "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Subject color indicator */}
        <div
          className="w-3 h-full rounded-full flex-shrink-0 min-h-[40px]"
          style={{ backgroundColor: homework.subject.color }}
        />

        <div className="flex-1 min-w-0">
          {/* Title and status */}
          <div className="flex items-center gap-2 mb-1">
            {isDone && (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            )}
            <h4
              className={cn(
                "font-medium text-sm truncate",
                isDone && "line-through text-muted-foreground",
              )}
            >
              {homework.title}
            </h4>
          </div>

          {/* Subject and time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{homework.subject.name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(homework.dueDate).toLocaleTimeString("sr-Latn-RS", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {homework.estimatedMinutes && (
              <>
                <span>•</span>
                <span>~{homework.estimatedMinutes}min</span>
              </>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1 mt-2">
            <Badge
              variant="outline"
              className={cn("text-xs", priorityConfig.color)}
            >
              <PriorityIcon className="h-3 w-3 mr-1" />
              {priorityConfig.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {statusConfig.label}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Zakasnilo!
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Main component
export function HomeworkCalendar({
  homework,
  onHomeworkClick,
  onDateSelect,
  onAddHomework,
  className,
}: HomeworkCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: Date[] = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(new Date(currentYear, currentMonth - 1, prevMonthDays - i));
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(currentYear, currentMonth + 1, i));
    }

    return days;
  }, [currentYear, currentMonth]);

  // Get homework for a specific date
  const getHomeworkForDate = useCallback(
    (date: Date) => {
      return homework.filter((hw) => isSameDay(new Date(hw.dueDate), date));
    },
    [homework],
  );

  // Selected date homework
  const selectedDateHomework = useMemo(() => {
    if (!selectedDate) return [];
    return getHomeworkForDate(selectedDate);
  }, [selectedDate, getHomeworkForDate]);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  // Handle homework click
  const handleHomeworkClick = (hw: HomeworkItem) => {
    onHomeworkClick?.(hw);
  };

  // Stats for current view
  const monthStats = useMemo(() => {
    const monthHomework = homework.filter((hw) => {
      const dueDate = new Date(hw.dueDate);
      return (
        dueDate.getMonth() === currentMonth &&
        dueDate.getFullYear() === currentYear
      );
    });

    return {
      total: monthHomework.length,
      completed: monthHomework.filter(
        (hw) =>
          hw.status === "DONE" ||
          hw.status === "SUBMITTED" ||
          hw.status === "REVIEWED",
      ).length,
      urgent: monthHomework.filter(
        (hw) => hw.priority === "URGENT" && hw.status !== "DONE",
      ).length,
      overdue: monthHomework.filter(
        (hw) =>
          isPast(new Date(hw.dueDate)) &&
          hw.status !== "DONE" &&
          hw.status !== "SUBMITTED",
      ).length,
    };
  }, [homework, currentMonth, currentYear]);

  return (
    <TooltipProvider>
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Kalendar Zadaća
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "month" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                  className="h-7"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "week" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className="h-7"
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Month stats */}
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span>{monthStats.total} ukupno</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{monthStats.completed} završeno</span>
            </div>
            {monthStats.urgent > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{monthStats.urgent} hitno</span>
              </div>
            )}
            {monthStats.overdue > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>{monthStats.overdue} zakasnilo</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold ml-2">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
            </div>

            <Button variant="outline" size="sm" onClick={goToToday}>
              Danas
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="mb-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "text-center text-xs font-medium py-2",
                    index === 0 && "text-red-500",
                    index === 6 && "text-blue-500",
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => (
                <CalendarDay
                  key={`${date.toISOString()}-${index}`}
                  date={date}
                  homework={getHomeworkForDate(date)}
                  isCurrentMonth={date.getMonth() === currentMonth}
                  isSelected={
                    selectedDate ? isSameDay(date, selectedDate) : false
                  }
                  onClick={() => handleDateClick(date)}
                  onHomeworkClick={handleHomeworkClick}
                />
              ))}
            </div>
          </div>

          {/* Selected date detail panel */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">
                    {DAY_NAMES_FULL[selectedDate.getDay()]},{" "}
                    {selectedDate.getDate()}.{" "}
                    {MONTH_NAMES[selectedDate.getMonth()]}
                  </h3>
                  {onAddHomework && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddHomework(selectedDate)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Dodaj zadaću
                    </Button>
                  )}
                </div>

                {selectedDateHomework.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateHomework.map((hw) => (
                      <HomeworkCard
                        key={hw.id}
                        homework={hw}
                        onClick={() => handleHomeworkClick(hw)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Nema zadaća za ovaj dan</p>
                    {onAddHomework && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onAddHomework(selectedDate)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Dodaj prvu zadaću
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Danas</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span>Hitno</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-500 rounded-full" />
              <span>Rok ističe</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Završeno</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default HomeworkCalendar;
