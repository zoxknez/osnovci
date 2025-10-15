import type { LucideIcon } from "lucide-react";

export type BloodType =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"
  | "Nepoznata";

export interface VaccinationRecord {
  name: string;
  date: string;
  booster: boolean;
}

export interface ProfileData {
  name: string;
  birthDate: string;
  address: string;
  school: string;
  grade: number;
  class: string;
  height: number;
  weight: number;
  clothingSize: string;
  hasGlasses: boolean;
  bloodType: BloodType;
  allergies: string[];
  chronicIllnesses: string[];
  medications: string[];
  healthNotes: string;
  specialNeeds: string;
  vaccinations: VaccinationRecord[];
  primaryDoctor: string;
  primaryDoctorPhone: string;
  dentist: string;
  dentistPhone: string;
  emergencyContact1: string;
  emergencyContact1Phone: string;
  emergencyContact2: string;
  emergencyContact2Phone: string;
  hobbies: string;
  sports: string;
  activities: string;
  notes: string;
}

export type ProfileField = keyof ProfileData;

export type ProfileUpdateHandler = <K extends ProfileField>(
  key: K,
  value: ProfileData[K],
) => void;

export interface SectionConfig {
  title: string;
  icon: LucideIcon;
}
