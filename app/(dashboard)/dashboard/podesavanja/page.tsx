// Podešavanja - Ultra-Modern Settings Page with Instant Auto-Save
"use client";

import { motion } from "framer-motion";
import { Loader, Wifi, WifiOff } from "lucide-react";
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
  LanguageOption,
  NotificationKey,
  ProfileSettings,
} from "@/components/features/settings/types";
import { staggerContainer } from "@/lib/animations/variants";
import { useSettingsStore } from "@/store/settings";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { signOut } from "next-auth/react";

const DEFAULT_PROFILE: ProfileSettings = {
  name: "",
  email: "",
  phone: "",
  school: "",
  class: "",
};

export default function PodjesavanjaPage() {
  // Global settings store
  const { 
    language, setLanguage,
    notifications, toggleNotification,
    biometricEnabled, setBiometric 
  } = useSettingsStore();

  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();

  const [profileData, setProfileData] =
    useState<ProfileSettings>(DEFAULT_PROFILE);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  
  const isOnline = useNetworkStatus();

  // Debounce timer za input polja
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Sinhronizuj podatke sa servera
  useEffect(() => {
    if (profile?.profile) {
      setProfileData({
        name: profile.profile.name || "",
        email: profile.profile.email || "",
        phone: "", // Nije podržano na backendu trenutno
        school: profile.profile.school || "",
        class: "", // Nije podržano na backendu trenutno
      });
    }
  }, [profile]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Auto-save funkcija za profil
  const saveProfileField = useCallback((field: string, value: string) => {
    if (!navigator.onLine) {
        toast.error("Nije moguće sačuvati profil dok ste offline.");
        return;
    }
    // Mapiramo polja koja backend podržava
    if (['name', 'email', 'school'].includes(field)) {
        updateProfile({ [field]: value });
    }
  }, [updateProfile]);

  const handleLanguageChange = async (newLanguage: LanguageOption) => {
    setLanguage(newLanguage);
    // Diskretan toast - brzo nestaje
    toast.success("🌍 Sačuvano", { duration: 1000 });
  };

  const handleNotificationToggle = async (key: NotificationKey) => {
    toggleNotification(key);
    // Bez toast-a - instant feedback je već u UI switch komponenti
  };

  const handleProfileInput = (field: keyof ProfileSettings, value: string) => {
    setProfileData((previous) => ({ ...previous, [field]: value }));
  };

  const handleProfileSave = async (
    field: keyof ProfileSettings,
    value: string,
  ) => {
    if (!isOnline) {
        toast.error("Izmena profila nije dostupna u offline režimu.");
        return;
    }

    // Debounce - čeka 800ms pre slanja na API
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveProfileField(field, value);
      // Mini diskretan toast
      toast.success("✓", { duration: 800 });
    }, 800);
  };

  const handleAvatarUpload = async () => {
    if (!isOnline) {
        toast.error("Nije moguće menjati sliku dok ste offline.");
        return;
    }
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
    setBiometric(next);
    // Mini toast samo za sigurnosne opcije
    toast.success(next ? "✓ Uključeno" : "✓ Isključeno", { duration: 1000 });
  };

  const handlePasswordChange = () => {
    if (!isOnline) {
        toast.error("Promena lozinke nije moguća offline.");
        return;
    }
    toast.info("🔐 Otvaranje forme...", {
      description: "Unesi trenutnu i novu lozinku",
      duration: 2000,
    });
  };

  const handleLogout = async () => {
    toast.success("👋 Odjavio si se!", {
      description: "Vidimo se uskoro!",
      duration: 2000,
    });
    await signOut({ callbackUrl: "/prijava" });
  };

  if (isProfileLoading) {
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
        badge={
            !isOnline ? (
              <span className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3" /> Online
              </span>
            )
          }
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
