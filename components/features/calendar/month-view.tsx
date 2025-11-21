"use client";

import { getCalendarViewAction } from "@/app/actions/calendar";
import { useEffect, useState } from "react";
import { format, isToday } from "date-fns";
import { CalendarEvent } from "./calendar-event";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  events: Array<{
    id: string;
    title: string;
    type: string;
    startTime: Date;
    endTime: Date;
    color: string;
    subject?: string;
    priority?: string;
  }>;
}

interface MonthViewData {
  monthStart: Date;
  monthEnd: Date;
  weeks: CalendarDay[][];
}

interface MonthViewProps {
  studentId: string;
  date: Date;
  onEventClick?: (eventId: string, eventType: string) => void;
}

export function MonthView({ studentId, date, onEventClick }: MonthViewProps) {
  const [data, setData] = useState<MonthViewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthView();
  }, [studentId, date]);

  const fetchMonthView = async () => {
    try {
      setLoading(true);
      const result = await getCalendarViewAction({
        studentId,
        view: "month",
        date: date.toISOString(),
      });

      if (result.success && result.data) {
        setData(result.data as any);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Month view error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Greška pri učitavanju
      </div>
    );
  }

  const dayNames = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

  return (
    <div className="h-full overflow-auto p-4">
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border border-gray-200 bg-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-700">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {data.weeks.flat().map((day) => (
          <div
            key={day.date.toISOString()}
            className={cn(
              "min-h-[120px] bg-white p-2 dark:bg-gray-900",
              !day.isCurrentMonth && "bg-gray-50 dark:bg-gray-800/50",
              isToday(day.date) && "ring-2 ring-blue-500 ring-inset"
            )}
          >
            {/* Day number */}
            <div className="mb-1 flex items-center justify-between">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium",
                  isToday(day.date)
                    ? "bg-blue-600 text-white"
                    : day.isCurrentMonth
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-600"
                )}
              >
                {format(day.date, "d")}
              </span>
              {day.events.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{day.events.length - 3}
                </span>
              )}
            </div>

            {/* Events (max 3 visible) */}
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event) => (
                <CalendarEvent
                  key={event.id}
                  event={event}
                  view="month"
                  onClick={() => onEventClick?.(event.id, event.type)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
