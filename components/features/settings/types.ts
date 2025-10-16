export type ThemeOption = "light" | "dark" | "auto";
export type LanguageOption = "sr" | "en";

export type NotificationKey = "grades" | "homework" | "schedule" | "messages";

export interface NotificationsSettings {
  grades: boolean;
  homework: boolean;
  schedule: boolean;
  messages: boolean;
}

export interface ProfileSettings {
  name: string;
  email: string;
  phone: string;
  school: string;
  class: string;
}

export interface AutoSaveFn {
  (
    setting: string,
    value: string | boolean | Record<string, unknown>,
  ): Promise<void>;
}
