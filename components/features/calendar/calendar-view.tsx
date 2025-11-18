"use client";

import { useState } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, startOfMonth, addMonths, subMonths } from "date-fns";
import { sr } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
} from "lucide-react";
import { DayView } from "./day-view";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { AgendaView } from "./agenda-view";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarViewType = "day" | "week" | "month" | "agenda";

interface CalendarViewProps {
  studentId: string;
  initialDate?: Date;
  initialView?: CalendarViewType;
  onEventClick?: (eventId: string, eventType: string) => void;
  onCreateEvent?: () => void;
}

export function CalendarView({
  studentId,
  initialDate = new Date(),
  initialView = "week",
  onEventClick,
  onCreateEvent,
}: CalendarViewProps) {
  const [view, setView] = useState<CalendarViewType>(initialView);
  const [currentDate, setCurrentDate] = useState(initialDate);

  // Navigation handlers
  const goToPrevious = () => {
    switch (view) {
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "agenda":
        setCurrentDate(subDays(currentDate, 7));
        break;
    }
  };

  const goToNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "agenda":
        setCurrentDate(addDays(currentDate, 7));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleExport = async () => {
    try {
      const startDate = view === "month" ? startOfMonth(currentDate) : currentDate;
      const endDate = view === "month" ? addMonths(startDate, 1) : addDays(currentDate, 30);

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export_calendar",
          studentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `calendar-${format(new Date(), "yyyy-MM-dd")}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  // Format date range for display
  const getDateRangeText = () => {
    switch (view) {
      case "day":
        return format(currentDate, "d. MMMM yyyy", { locale: sr });
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, "d. MMM", { locale: sr })} - ${format(weekEnd, "d. MMM yyyy", { locale: sr })}`;
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: sr });
      case "agenda":
        return "Predstojećih 7 dana";
      default:
        return "";
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-950/20 dark:to-indigo-950/20">
        {/* Top row: View switcher */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm dark:bg-gray-800">
            {(["day", "week", "month", "agenda"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  view === v
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                {v === "day" && "Dan"}
                {v === "week" && "Nedelja"}
                {v === "month" && "Mesec"}
                {v === "agenda" && "Agenda"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="hidden sm:flex"
            >
              <Download className="mr-2 h-4 w-4" />
              Izvezi
            </Button>
            <Button size="sm" onClick={onCreateEvent}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Dodaj događaj</span>
              <span className="sm:hidden">Dodaj</span>
            </Button>
          </div>
        </div>

        {/* Bottom row: Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">{getDateRangeText()}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="ml-2"
            >
              Danas
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-auto">
        {view === "day" && (
          <DayView
            studentId={studentId}
            date={currentDate}
            {...(onEventClick && { onEventClick })}
          />
        )}
        {view === "week" && (
          <WeekView
            studentId={studentId}
            date={currentDate}
            {...(onEventClick && { onEventClick })}
          />
        )}
        {view === "month" && (
          <MonthView
            studentId={studentId}
            month={currentDate}
            {...(onEventClick && { onEventClick })}
          />
        )}
        {view === "agenda" && (
          <AgendaView
            studentId={studentId}
            {...(onEventClick && { onEventClick })}
          />
        )}
      </div>
    </div>
  );
}
