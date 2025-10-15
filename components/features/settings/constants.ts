import type { LanguageOption, NotificationKey, ThemeOption } from "./types";
import { Moon, Smartphone, Sun } from "lucide-react";

export const THEME_OPTIONS: Array<{
  value: ThemeOption;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Svetla", icon: Sun },
  { value: "dark", label: "Tamna", icon: Moon },
  { value: "auto", label: "Auto", icon: Smartphone },
];

export const LANGUAGE_OPTIONS: Array<{
  value: LanguageOption;
  label: string;
  flag: string;
}> = [
  { value: "sr", label: "Srpski", flag: "🇷🇸" },
  { value: "en", label: "English", flag: "🇬🇧" },
];

export const NOTIFICATION_OPTIONS: Array<{
  key: NotificationKey;
  label: string;
  icon: string;
}> = [
  { key: "grades", label: "Nove ocene", icon: "📊" },
  { key: "homework", label: "Novi domaći zadaci", icon: "📚" },
  { key: "schedule", label: "Promene rasporeda", icon: "📅" },
  { key: "messages", label: "Poruke", icon: "💬" },
];
