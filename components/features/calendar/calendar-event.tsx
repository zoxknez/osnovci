"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, AlertCircle, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEventProps {
  event: {
    id: string;
    title: string;
    type: string;
    startTime: Date;
    endTime: Date;
    color: string;
    subject?: string;
    priority?: string;
    description?: string;
  };
  view: "day" | "week" | "month" | "agenda";
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export function CalendarEvent({
  event,
  view,
  onClick,
  onDragStart,
  onDragEnd,
}: CalendarEventProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("eventId", event.id);
    e.dataTransfer.setData("eventType", event.type);
    onDragStart?.(e);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  // Get icon based on event type
  const getIcon = () => {
    switch (event.type) {
      case "homework":
        return <FileText className="h-3 w-3" />;
      case "class":
        return <BookOpen className="h-3 w-3" />;
      case "test":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Format time display
  const timeText = `${format(event.startTime, "HH:mm")} - ${format(event.endTime, "HH:mm")}`;

  // Compact view for month/small screens
  if (view === "month") {
    return (
      <button
        onClick={onClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          "group relative mb-1 flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-xs transition-all hover:shadow-md",
          isDragging && "opacity-50"
        )}
        style={{
          backgroundColor: `${event.color}20`,
          borderLeft: `3px solid ${event.color}`,
        }}
      >
        {getIcon()}
        <span className="truncate font-medium">{event.title}</span>
      </button>
    );
  }

  // Full card view for day/week/agenda
  return (
    <button
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "group relative flex w-full flex-col gap-1 rounded-lg p-2 text-left shadow-sm transition-all hover:shadow-md",
        "border-l-4",
        isDragging && "opacity-50 cursor-grabbing",
        !isDragging && "cursor-grab hover:scale-[1.02]"
      )}
      style={{
        backgroundColor: `${event.color}15`,
        borderLeftColor: event.color,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
          {getIcon()}
          <span className="font-semibold text-sm">{event.title}</span>
        </div>
        {event.priority === "HIGH" && (
          <span className="flex-shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Hitno
          </span>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
        <Clock className="h-3 w-3" />
        <span>{timeText}</span>
      </div>

      {/* Subject (if present) */}
      {event.subject && (
        <div className="text-xs text-gray-500 dark:text-gray-500">
          {event.subject}
        </div>
      )}

      {/* Description (if present, truncated) */}
      {event.description && view === "agenda" && (
        <div className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
          {event.description}
        </div>
      )}

      {/* Drag indicator */}
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex flex-col gap-0.5">
          <div className="h-0.5 w-3 rounded-full bg-gray-400" />
          <div className="h-0.5 w-3 rounded-full bg-gray-400" />
          <div className="h-0.5 w-3 rounded-full bg-gray-400" />
        </div>
      </div>
    </button>
  );
}
