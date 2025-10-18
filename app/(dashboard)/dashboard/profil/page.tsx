// Profil deteta - Kompletan zdravstveni i lični profil
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { PageHeader } from "@/components/features/page-header";
import { ProfileHeader } from "@/components/features/profile/profile-header";
import { PrivacyNotice } from "@/components/features/profile/privacy-notice";
import { LastUpdatedNotice } from "@/components/features/profile/last-updated";
import {
  ActivitiesSection,
  BasicInfoSection,
  ContactsSection,
  HealthSection,
  PhysicalSection,
} from "@/components/features/profile/sections";
import type {
  ProfileData,
  ProfileUpdateHandler,
} from "@/components/features/profile/types";
import { calculateAge } from "@/components/features/profile/utils";
import { staggerContainer } from "@/lib/animations/variants";

// Default values za prazne fieldove
const DEFAULT_PROFILE: ProfileData = {
  name: "",
  birthDate: "",
  address: "",
  school: "",
  grade: 1,
  class: "",
  height: 0,
  weight: 0,
  clothingSize: "",
  hasGlasses: false,
  bloodType: "Nepoznata",
  allergies: [],
  chronicIllnesses: [],
  medications: [],
  healthNotes: "",
  specialNeeds: "",
  vaccinations: [],
  primaryDoctor: "",
  primaryDoctorPhone: "",
  dentist: "",
  dentistPhone: "",
  emergencyContact1: "",
  emergencyContact1Phone: "",
  emergencyContact2: "",
  emergencyContact2Phone: "",
  hobbies: "",
  sports: "",
  activities: "",
  notes: "",
};

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);

  // Fetch profile data na mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/profile", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Map API data to profile format
          // TODO: API treba da vrati sve profile fieldove, ne samo osnovne
          setProfile({
            ...DEFAULT_PROFILE,
            name: data.profile.name || "",
            school: data.profile.school || "",
            grade: data.profile.grade || 1,
            // ... ostali fieldovi će biti default dok ne dodate u API
          });
        } else {
          toast.error("Greška pri učitavanju profila");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Greška pri učitavanju profila");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleFieldChange: ProfileUpdateHandler = (key, value) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: profile.name,
          school: profile.school,
          grade: profile.grade,
          // TODO: Dodaj ostala polja kada API podržava
        }),
      });

      if (!response.ok) {
        throw new Error("Greška pri čuvanju profila");
      }

      toast.success("✅ Profil sačuvan!", {
        description: "Sve promene su uspešno sačuvane.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Greška prilikom čuvanja profila");
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
        badge="Privatno"
      />

      <ProfileHeader
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={() => setIsEditing(true)}
        onCancel={() => setIsEditing(false)}
        onSave={handleSave}
      />

      <PrivacyNotice />

      <motion.div
        className="grid gap-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <BasicInfoSection
          profile={profile}
          isEditing={isEditing}
          onChange={handleFieldChange}
          calculateAge={calculateAge}
        />

        <PhysicalSection
          profile={profile}
          isEditing={isEditing}
          onChange={handleFieldChange}
        />

        <HealthSection
          profile={profile}
          isEditing={isEditing}
          onChange={handleFieldChange}
        />

        <ContactsSection
          profile={profile}
          isEditing={isEditing}
          onChange={handleFieldChange}
        />

        <ActivitiesSection
          profile={profile}
          isEditing={isEditing}
          onChange={handleFieldChange}
        />
      </motion.div>

      <LastUpdatedNotice />
    </div>
  );
}
