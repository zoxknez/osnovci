import type { BloodType, ProfileData } from "./types";

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
