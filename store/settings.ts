import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  LanguageOption,
  NotificationsSettings,
} from "@/components/features/settings/types";

interface SettingsState {
  language: LanguageOption;
  notifications: NotificationsSettings;
  biometricEnabled: boolean;

  setLanguage: (lang: LanguageOption) => void;
  setNotifications: (settings: NotificationsSettings) => void;
  toggleNotification: (key: keyof NotificationsSettings) => void;
  setBiometric: (enabled: boolean) => void;
}

const DEFAULT_NOTIFICATIONS: NotificationsSettings = {
  grades: true,
  homework: true,
  schedule: false,
  messages: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: "sr",
      notifications: DEFAULT_NOTIFICATIONS,
      biometricEnabled: false,

      setLanguage: (language) => {
        set({ language });
        // Side effect: Set cookie for next-intl if needed
        if (typeof document !== "undefined") {
          document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000; SameSite=Lax`;
        }
      },
      setNotifications: (notifications) => set({ notifications }),
      toggleNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),
      setBiometric: (enabled) => set({ biometricEnabled: enabled }),
    }),
    {
      name: "app-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
