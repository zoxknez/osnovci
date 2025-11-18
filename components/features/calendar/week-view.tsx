"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { CalendarEvent } from "./calendar-event";
import { Skeleton } from "@/components/ui/skeleton";

interface WeekViewData {
  weekStart: Date;
  weekEnd: Date;
  days: Array<{
    date: Date;
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
  }>;
}

interface WeekViewProps {
  studentId: string;
  date: Date;
  onEventClick?: (eventId: string, eventType: string) => void;
}

export function WeekView({ studentId, date, onEventClick }: WeekViewProps) {
  const [data, setData] = useState<WeekViewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeekView();
  }, [studentId, date]);

  const fetchWeekView = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        studentId,
        view: "week",
        date: date.toISOString(),
      });

      const response = await fetch(`/api/calendar?${params}`);
      if (!response.ok) throw new Error("Failed to fetch week view");

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Week view error:", error);
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

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayNames = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

  return (
    <div className="h-full overflow-auto">
      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
        {/* Day headers */}
        {days.map((day, i) => (
          <div
            key={day.toISOString()}
            className="bg-gray-50 p-3 text-center dark:bg-gray-800"
          >
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {dayNames[i]}
            </div>
            <div className={`mt-1 text-lg font-semibold ${
              format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                ? "text-blue-600"
                : "text-gray-900 dark:text-gray-100"
            }`}>
              {format(day, "d")}
            </div>
          </div>
        ))}

        {/* Day columns with events */}
        {data.days.map((dayData) => (
          <div
            key={dayData.date.toISOString()}
            className="min-h-[400px] bg-white p-2 dark:bg-gray-900"
          >
            {dayData.events.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-xs text-gray-400">
                Nema događaja
              </div>
            ) : (
              <div className="space-y-1">
                {dayData.events.map((event) => (
                  <CalendarEvent
                    key={event.id}
                    event={event}
                    view="week"
                    onClick={() => onEventClick?.(event.id, event.type)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
