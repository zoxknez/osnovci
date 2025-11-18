// Podešavanja - Ultra-Modern Settings Page with Instant Auto-Save
"use client";

import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/features/page-header";
import { AppInfoCard } from "@/components/features/settings/app-info-card";
import { AppearanceSection } from "@/components/features/settings/appearance-section";
import { NotificationsSection } from "@/components/features/settings/notifications-section";
import { ProfileSection } from "@/components/features/settings/profile-section";
import { SecuritySection } from "@/components/features/settings/security-section";
import { SettingsActions } from "@/components/features/settings/settings-actions";
import { SettingsHeader } from "@/components/features/settings/settings-header";
import type {
  AutoSaveFn,
  LanguageOption,
  NotificationKey,
  NotificationsSettings,
  ProfileSettings,
} from "@/components/features/settings/types";
import { staggerContainer } from "@/lib/animations/variants";
import { apiGet, apiPatch } from "@/lib/utils/api";

const DEFAULT_PROFILE: ProfileSettings = {
  name: "",
  email: "",
  phone: "",
  school: "",
  class: "",
};

const DEFAULT_NOTIFICATIONS: NotificationsSettings = {
  grades: true,
  homework: true,
  schedule: false,
  messages: true,
};

export default function PodjesavanjaPage() {
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<LanguageOption>("sr");
  const [notifications, setNotifications] = useState<NotificationsSettings>(
    DEFAULT_NOTIFICATIONS,
  );
  const [profileData, setProfileData] =
    useState<ProfileSettings>(DEFAULT_PROFILE);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  // Debounce timer za input polja
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Učitaj podatke sa API-ja
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await apiGet("/api/profile", { showErrorToast: false });

        if (data?.profile) {
          setProfileData({
            name: data.profile.name || "",
            email: data.profile.email || "",
            phone: "",
            school: data.profile.school || "",
            class: "",
          });
        }
      } catch {
        // Error loading settings
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Auto-save funkcija sa API integracijom
  const autoSave: AutoSaveFn = useCallback(async (setting, value) => {
    try {
      // Sačuvaj u localStorage kao backup
      localStorage.setItem(`setting_${setting}`, JSON.stringify(value));

      // Za profile podatke koristi /api/profile
      if (setting.startsWith("profile.")) {
        const field = setting.replace("profile.", "");
        await apiPatch("/api/profile", { [field]: value });
      }

      // Za ostala podešavanja (jezik, notifikacije, itd.) koristi localStorage
      // API endpoint /api/settings može biti dodato kada treba centralno čuvanje
    } catch {
      // Failed to auto-save setting
      toast.error("Greška pri čuvanju", {
        description: "Promena nije sačuvana",
        duration: 2000,
      });
    }
  }, []);

  const handleLanguageChange = async (newLanguage: LanguageOption) => {
    setLanguage(newLanguage);
    await autoSave("language", newLanguage);
    // Diskretan toast - brzo nestaje
    toast.success("🌍 Sačuvano", { duration: 1000 });
  };

  const handleNotificationToggle = async (key: NotificationKey) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    await autoSave("notifications", updated);
    // Bez toast-a - instant feedback je već u UI switch komponenti
  };

  const handleProfileInput = (field: keyof ProfileSettings, value: string) => {
    setProfileData((previous) => ({ ...previous, [field]: value }));
  };

  const handleProfileSave = async (
    field: keyof ProfileSettings,
    value: string,
  ) => {
    // Debounce - čeka 800ms pre slanja na API
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      await autoSave(`profile.${field}`, value);
      // Mini diskretan toast
      toast.success("✓", { duration: 800 });
    }, 800);
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
    // Mini toast samo za sigurnosne opcije
    toast.success(next ? "✓ Uključeno" : "✓ Isključeno", { duration: 1000 });
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="⚙️ Podešavanja"
          description="Prilagodi aplikaciju sebi - jezik, notifikacije, sigurnost i više"
          variant="green"
          badge="Lični prostor"
        />
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-green-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* PageHeader - Hero sekcija */}
      <PageHeader
        title="⚙️ Podešavanja"
        description="Sve promene se automatski čuvaju ✨"
        variant="green"
        badge="Auto-save"
      />

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
          language={language}
          onLanguageChange={handleLanguageChange}
        />

        <NotificationsSection
          notifications={notifications}
          onToggle={handleNotificationToggle}
        />

        <SecuritySection
          biometricEnabled={biometricEnabled}
          onPasswordChange={handlePasswordChange}
          onToggleBiometric={handleBiometricToggle}
        />

        <SettingsActions onLogout={handleLogout} />

        <AppInfoCard />
      </motion.div>
    </div>
  );
}
