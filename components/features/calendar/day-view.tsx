"use client";

import { getCalendarViewAction } from "@/app/actions/calendar";
import { useEffect, useState } from "react";
import { CalendarEvent } from "./calendar-event";
import { Skeleton } from "@/components/ui/skeleton";

interface TimeSlot {
  hour: number;
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

interface DayViewData {
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
  timeSlots: TimeSlot[];
}

interface DayViewProps {
  studentId: string;
  date: Date;
  onEventClick?: (eventId: string, eventType: string) => void;
}

export function DayView({ studentId, date, onEventClick }: DayViewProps) {
  const [data, setData] = useState<DayViewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDayView();
  }, [studentId, date]);

  const fetchDayView = async () => {
    try {
      setLoading(true);
      const result = await getCalendarViewAction({
        studentId,
        view: "day",
        date: date.toISOString(),
      });

      if (result.success && result.data) {
        setData(result.data as any);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Day view error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
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

  return (
    <div className="h-full overflow-y-auto">
      {/* Timeline */}
      <div className="relative">
        {data.timeSlots.map((slot) => (
          <div
            key={slot.hour}
            className="flex border-b border-gray-200 dark:border-gray-700"
            style={{ minHeight: "80px" }}
          >
            {/* Hour label */}
            <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-2 text-right text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              {slot.hour}:00
            </div>

            {/* Events column */}
            <div className="relative flex-1 p-2">
              {slot.events.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  —
                </div>
              ) : (
                <div className="space-y-1">
                  {slot.events.map((event) => (
                    <CalendarEvent
                      key={event.id}
                      event={event}
                      view="day"
                      onClick={() => onEventClick?.(event.id, event.type)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current time indicator */}
      <CurrentTimeIndicator />
    </div>
  );
}

// Component to show current time as a red line
function CurrentTimeIndicator() {
  const [position, setPosition] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      // Only show between 6 AM and 11 PM
      if (hour >= 6 && hour <= 23) {
        // Calculate position (80px per hour)
        const hoursSince6AM = hour - 6;
        const minuteOffset = (minute / 60) * 80;
        setPosition((hoursSince6AM * 80) + minuteOffset + 56); // +56 for header
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute left-16 right-0 z-10 flex items-center"
      style={{ top: `${position}px` }}
    >
      <div className="h-2 w-2 rounded-full bg-red-500 shadow-lg" />
      <div className="h-0.5 flex-1 bg-red-500 shadow-sm" />
    </div>
  );
}
