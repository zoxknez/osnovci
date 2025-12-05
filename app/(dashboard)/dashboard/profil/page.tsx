// Profil deteta - Kompletan zdravstveni i lični profil
"use client";

import { motion } from "framer-motion";
import { Loader, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/features/page-header";
import { LastUpdatedNotice } from "@/components/features/profile/last-updated";
import { PrivacyNotice } from "@/components/features/profile/privacy-notice";
import { ProfileHeader } from "@/components/features/profile/profile-header";
import { SectionErrorBoundary } from "@/components/features/section-error-boundary";
import { log } from "@/lib/logger";
import {
  ActivitiesSection,
  BasicInfoSection,
  ContactsSection,
  GamificationSection,
  HealthSection,
  PhysicalSection,
} from "@/components/features/profile/sections";
import type {
  ProfileUpdateHandler,
} from "@/components/features/profile/types";
import { calculateAge } from "@/components/features/profile/utils";
import { staggerContainer } from "@/lib/animations/variants";
import { apiPatch } from "@/lib/utils/api";
import { useOfflineProfile } from "@/hooks/use-offline-profile";

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  const { profile, setProfile, stats, loading, isOffline } = useOfflineProfile();

  const handleFieldChange: ProfileUpdateHandler = (key, value) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }));
  };
// ...existing code...

  const handleSave = async () => {
    if (isOffline) {
      toast.error("Nije moguće sačuvati izmene dok ste offline.");
      setStatusMessage("Nije moguće sačuvati izmene dok ste offline.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("Čuvanje profila u toku...");

    try {
      await apiPatch("/api/profile", {
        name: profile.name,
        school: profile.school,
        grade: profile.grade,
      });

      toast.success("✅ Profil sačuvan!", {
        description: "Sve promene su uspešno sačuvane.",
      });
      setStatusMessage("Profil uspešno sačuvan.");

      setIsEditing(false);
    } catch (error) {
      log.error("Profile update failed", error);
      setStatusMessage("Greška pri čuvanju profila.");
      // Toast already shown by apiPatch
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="👤 Moj profil"
          description="Lični podaci, zdravstvene informacije i sve što trebaju odrasli da znaju o tebi"
          variant="purple"
          badge="Privatno"
        />
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* PageHeader - Hero sekcija */}
      <PageHeader
        title="👤 Moj profil"
        description="Lični podaci, zdravstvene informacije i sve što trebaju odrasli da znaju o tebi"
        variant="purple"
        badge={
          isOffline ? (
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

      <ProfileHeader
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={() => {
          if (isOffline) {
            toast.error("Izmena profila nije dostupna u offline režimu.");
            return;
          }
          setIsEditing(true);
        }}
        onCancel={() => setIsEditing(false)}
        onSave={handleSave}
      />

      {/* Aria-live region for screen readers */}
      <output aria-live="polite" className="sr-only">
        {statusMessage}
      </output>

      <PrivacyNotice />

      <motion.div
        className="grid gap-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <SectionErrorBoundary sectionName="Gamifikacija">
          <GamificationSection stats={stats} />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Osnovne Informacije">
          <BasicInfoSection
            profile={profile}
            isEditing={isEditing}
            onChange={handleFieldChange}
            calculateAge={calculateAge}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Fizičke Karakteristike">
          <PhysicalSection
            profile={profile}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Zdravstvene Informacije">
          <HealthSection
            profile={profile}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Kontakti">
          <ContactsSection
            profile={profile}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Aktivnosti">
          <ActivitiesSection
            profile={profile}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />
        </SectionErrorBoundary>
      </motion.div>

      <LastUpdatedNotice />
    </div>
  );
}
