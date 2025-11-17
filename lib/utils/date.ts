// Date utilities prilagođene srpskom jeziku
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import { sr } from "date-fns/locale";

export function formatDate(
  date: Date | string,
  formatStr = "dd.MM.yyyy",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, formatStr, { locale: sr });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH:mm");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd.MM.yyyy HH:mm", { locale: sr });
}

export function formatRelative(
  date: Date | string,
  locale: "sr-Latn" | "sr-Cyrl" | "en" = "sr-Latn",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isToday(d)) return "Danas";
  if (isTomorrow(d)) return "Sutra";
  if (isYesterday(d)) return "Juče";

  return formatDistanceToNow(d, {
    addSuffix: true,
    ...(locale !== "en" && { locale: sr }),
  });
}

export function getWeekDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const days = [
    "Nedelja",
    "Ponedeljak",
    "Utorak",
    "Sreda",
    "Četvrtak",
    "Petak",
    "Subota",
  ];
  const day = days[d.getDay()];
  return day ?? "Nepoznat dan";
}

export function isOverdue(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d < new Date();
}

export function getDaysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
