"use client";

import { getCalendarViewAction } from "@/app/actions/calendar";
import { useEffect, useState } from "react";
import { format, isSameDay } from "date-fns";
import { sr } from "date-fns/locale";
import { CalendarEvent } from "./calendar-event";
import { Skeleton } from "@/components/ui/skeleton";

interface AgendaViewData {
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
    description?: string;
  }>;
}

interface AgendaViewProps {
  studentId: string;
  onEventClick?: (eventId: string, eventType: string) => void;
}

export function AgendaView({ studentId, onEventClick }: AgendaViewProps) {
  const [data, setData] = useState<AgendaViewData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgendaView();
  }, [studentId]);

  const fetchAgendaView = async () => {
    try {
      setLoading(true);
      const result = await getCalendarViewAction({
        studentId,
        view: "agenda",
        agendaDays: 7,
      });

      if (result.success && result.data) {
        setData(result.data as any);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Agenda view error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Nema predstojećih događaja
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {data.map((dayData) => (
          <div key={dayData.date.toISOString()} className="space-y-2">
            {/* Date header */}
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b-2 border-blue-500 bg-white/95 pb-2 backdrop-blur-sm dark:bg-gray-900/95">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {format(dayData.date, "d")}
                </span>
                <span className="text-xs uppercase text-gray-500">
                  {format(dayData.date, "MMM", { locale: sr })}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {isSameDay(dayData.date, new Date())
                    ? "Danas"
                    : format(dayData.date, "EEEE", { locale: sr })}
                </h3>
                <p className="text-sm text-gray-500">
                  {dayData.events.length}{" "}
                  {dayData.events.length === 1
                    ? "događaj"
                    : dayData.events.length < 5
                    ? "događaja"
                    : "događaja"}
                </p>
              </div>
            </div>

            {/* Events list */}
            <div className="space-y-2">
              {dayData.events.map((event) => (
                <CalendarEvent
                  key={event.id}
                  event={event}
                  view="agenda"
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
