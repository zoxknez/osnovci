// Profil deteta - Kompletan zdravstveni i lični profil
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
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

const DEFAULT_PROFILE: ProfileData = {
  name: "Marko Marković",
  birthDate: "2014-05-15",
  address: "Kneza Miloša 25, Beograd",
  school: 'OŠ "Vuk Karadžić"',
  grade: 5,
  class: "B",
  height: 145,
  weight: 38,
  clothingSize: "152",
  hasGlasses: true,
  bloodType: "A+",
  allergies: ["Kikiriki", "Pelud breze"],
  chronicIllnesses: [],
  medications: [],
  healthNotes: "Nosi inhalator za astmu u torbi",
  specialNeeds: "",
  vaccinations: [
    { name: "BCG", date: "2014-06-01", booster: false },
    { name: "MMR", date: "2015-06-15", booster: false },
    { name: "DTaP", date: "2014-08-15", booster: true },
  ],
  primaryDoctor: "Dr. Jovana Nikolić",
  primaryDoctorPhone: "011/123-4567",
  dentist: "Dr. Petar Simić",
  dentistPhone: "011/765-4321",
  emergencyContact1: "Ana Marković (majka)",
  emergencyContact1Phone: "065/123-4567",
  emergencyContact2: "Petar Marković (otac)",
  emergencyContact2Phone: "064/987-6543",
  hobbies: "Čitanje, crtanje, šah",
  sports: "Fudbal, plivanje",
  activities: "Dramska sekcija, programiranje",
  notes: "",
};

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);

  const handleFieldChange: ProfileUpdateHandler = (key, value) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
