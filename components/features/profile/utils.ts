import type { BloodType, ProfileData } from "./types";

/**
 * Checks if a date string is valid and parseable
 */
export const isValidDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
};

/**
 * Formats a date string safely, returning null if invalid
 */
export const formatDateSafe = (
  dateString: string | null | undefined,
): string | null => {
  if (!isValidDate(dateString) || !dateString) return null;
  return new Date(dateString).toISOString().split("T")[0] ?? null;
};

/**
 * Gets display value for a date with age calculation
 */
export const getDateDisplayValue = (
  dateString: string | null | undefined,
  calculateAge: (date: string) => number,
): string => {
  if (!isValidDate(dateString) || !dateString) return "Nije postavljeno";
  const date = new Date(dateString);
  return `${date.toLocaleDateString("sr-RS")} (${calculateAge(dateString)} godina)`;
};

export const BLOOD_TYPE_OPTIONS: BloodType[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Nepoznata",
];

export const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
};

export const calculateBMI = (height: number, weight: number) => {
  if (!height || !weight) {
    return "0.0";
  }

  const heightInM = height / 100;
  const bmi = weight / (heightInM * heightInM);
  return bmi ? bmi.toFixed(1) : "0.0";
};

export const getUpdatedProfile = (
  profile: ProfileData,
  updates: Partial<ProfileData>,
): ProfileData => ({
  ...profile,
  ...updates,
});
