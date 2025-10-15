// Podešavanja - Ultra-Modern Settings Page with Instant Feedback
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/features/settings/settings-header";
import { ProfileSection } from "@/components/features/settings/profile-section";
import { AppearanceSection } from "@/components/features/settings/appearance-section";
import { NotificationsSection } from "@/components/features/settings/notifications-section";
import { SecuritySection } from "@/components/features/settings/security-section";
import { SettingsActions } from "@/components/features/settings/settings-actions";
import { AppInfoCard } from "@/components/features/settings/app-info-card";
import {
  LANGUAGE_OPTIONS,
  NOTIFICATION_OPTIONS,
} from "@/components/features/settings/constants";
import type {
  AutoSaveFn,
  LanguageOption,
  NotificationKey,
  NotificationsSettings,
  ProfileSettings,
  ThemeOption,
} from "@/components/features/settings/types";
import { staggerContainer } from "@/lib/animations/variants";

const DEFAULT_PROFILE: ProfileSettings = {
  name: "Marko Marković",
  email: "ucenik@demo.rs",
  phone: "064 123 4567",
  school: 'OŠ "Vuk Karadžić"',
  class: "5B",
};

const DEFAULT_NOTIFICATIONS: NotificationsSettings = {
  grades: true,
  homework: true,
  schedule: false,
  messages: true,
};

const THEME_LABEL: Record<ThemeOption, string> = {
  light: "Svetla",
  dark: "Tamna",
  auto: "Auto",
};

export default function PodjesavanjaPage() {
  const [theme, setTheme] = useState<ThemeOption>("light");
  const [language, setLanguage] = useState<LanguageOption>("sr");
  const [notifications, setNotifications] = useState<NotificationsSettings>(
    DEFAULT_NOTIFICATIONS,
  );
  const [profileData, setProfileData] = useState<ProfileSettings>(
    DEFAULT_PROFILE,
  );
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const autoSave: AutoSaveFn = async (setting, value) => {
    console.log(`💾 Auto-saving: ${setting} = ${JSON.stringify(value)}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  const handleThemeChange = async (newTheme: ThemeOption) => {
    setTheme(newTheme);
    await autoSave("theme", newTheme);
    toast.success("✨ Tema promenjena", {
      description: `Tema postavljena na: ${THEME_LABEL[newTheme]}`,
      duration: 2000,
    });
  };

  const handleLanguageChange = async (newLanguage: LanguageOption) => {
    setLanguage(newLanguage);
    await autoSave("language", newLanguage);
    const label = LANGUAGE_OPTIONS.find((option) => option.value === newLanguage)?.label;
    toast.success("🌍 Jezik sačuvan", {
      description: `Jezik postavljen na: ${label ?? "Nepoznato"}`,
      duration: 2000,
    });
  };

  const handleNotificationToggle = async (key: NotificationKey) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    await autoSave("notifications", updated);
    const label = NOTIFICATION_OPTIONS.find((option) => option.key === key)?.label ?? "Notifikacije";
    toast.success(`🔔 ${updated[key] ? "Uključeno" : "Isključeno"}`, {
      description: label,
      duration: 2000,
    });
  };

  const handleProfileInput = (field: keyof ProfileSettings, value: string) => {
    setProfileData((previous) => ({ ...previous, [field]: value }));
  };

  const handleProfileSave = async (field: keyof ProfileSettings, value: string) => {
    await autoSave(`profile.${field}`, value);
    toast.success("✅ Sačuvano", {
      description: "Podaci ažurirani",
      duration: 1500,
    });
  };

  const handleAvatarUpload = async () => {
    setIsSavingAvatar(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSavingAvatar(false);
    toast.success("📸 Slika promenjena!", {
      description: "Avatar je uspešno ažuriran",
      duration: 2000,
    });
  };

  const handleBiometricToggle = async () => {
    const next = !biometricEnabled;
    setBiometricEnabled(next);
    await autoSave("biometric", next);
    toast.success(next ? "✅ Aktivirano" : "❌ Deaktivirano", {
      description: `Biometrijska autentifikacija ${next ? "uključena" : "isključena"}`,
      duration: 2000,
    });
  };

  const handleTwoFactorToggle = async () => {
    const next = !twoFactorEnabled;
    setTwoFactorEnabled(next);
    await autoSave("twoFactor", next);
    toast.success(next ? "✅ Aktivirano" : "❌ Deaktivirano", {
      description: `Dvostruka verifikacija ${next ? "uključena" : "isključena"}`,
      duration: 2000,
    });
  };

  const handlePasswordChange = () => {
    toast.info("🔐 Otvaranje forme...", {
      description: "Unesi trenutnu i novu lozinku",
      duration: 2000,
    });
  };

  const handleLogout = () => {
    toast.success("👋 Odjavio si se!", {
      description: "Vidimo se uskoro!",
      duration: 2000,
    });
    setTimeout(() => {
      window.location.href = "/prijava";
    }, 1500);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SettingsHeader />

      <motion.div
        className="space-y-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <ProfileSection
          profile={profileData}
          isSavingAvatar={isSavingAvatar}
          onAvatarUpload={handleAvatarUpload}
          onFieldInput={handleProfileInput}
          onFieldChange={handleProfileSave}
        />

        <AppearanceSection
          theme={theme}
          language={language}
          onThemeChange={handleThemeChange}
          onLanguageChange={handleLanguageChange}
        />

        <NotificationsSection
          notifications={notifications}
          onToggle={handleNotificationToggle}
        />

        <SecuritySection
          biometricEnabled={biometricEnabled}
          twoFactorEnabled={twoFactorEnabled}
          onPasswordChange={handlePasswordChange}
          onToggleBiometric={handleBiometricToggle}
          onToggleTwoFactor={handleTwoFactorToggle}
        />

        <SettingsActions onLogout={handleLogout} />

        <AppInfoCard />
      </motion.div>
    </div>
  );
}
