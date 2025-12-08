import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getProfileAction } from "@/app/actions/profile";
import type { ProfileData } from "@/components/features/profile/types";
import { offlineStorage } from "@/lib/db/offline-storage";
import { log } from "@/lib/logger";

// Extended profile data from API that includes streak
interface ApiProfileData {
  id: string;
  email: string;
  role: string;
  name?: string;
  school?: string;
  xp?: number;
  level?: number;
  streak?: number;
  [key: string]: unknown;
}

interface CachedProfileData {
  profile: ProfileData;
  stats: UserStats | null;
}

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

export interface UserStats {
  xp: number;
  level: number;
  completedHomework: number;
  streak: number;
}

export function useOfflineProfile() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const toastShownRef = useRef(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // 1. Try to fetch from API
        if (navigator.onLine) {
          try {
            const result = await getProfileAction();
            if (result.data) {
              const data = result.data;
              const apiProfile = data.profile as ApiProfileData;

              const profileData: ProfileData = {
                ...DEFAULT_PROFILE,
                name: apiProfile.name || "",
                school: apiProfile.school || "",
                // Note: Some fields might not be in FullProfile yet, using defaults or available data
                // grade: apiProfile.grade || 1,
                // class: apiProfile.class || "",
                // birthDate: apiProfile.birthDate || null,
                // address: apiProfile.address || "",
              };

              const userStats: UserStats = {
                xp: apiProfile.xp || 0,
                level: apiProfile.level || 1,
                completedHomework: data.stats?.completedHomework || 0,
                streak: apiProfile.streak || 0,
              };

              setProfile(profileData);
              setStats(userStats);
              toastShownRef.current = false; // Reset on success

              // Cache to IndexedDB
              await offlineStorage.saveProfile({
                profile: profileData,
                stats: userStats,
              });
              setIsOffline(false);
              setLoading(false);
              return;
            }
          } catch (error) {
            log.warn("Failed to fetch profile online, falling back to cache", {
              error,
            });
          }
        }

        // 2. Fallback to IndexedDB
        const cached = await offlineStorage.getProfile();
        if (cached) {
          // Handle both old (direct profile) and new ({profile, stats}) formats
          const cachedData = cached as CachedProfileData | ProfileData;

          if ("profile" in cachedData && cachedData.profile) {
            setProfile(cachedData.profile);
            setStats(cachedData.stats || null);
          } else {
            setProfile(cachedData as ProfileData); // Legacy format
            setStats(null);
          }

          setIsOffline(true);
          if (navigator.onLine && !toastShownRef.current) {
            toastShownRef.current = true;
            toast.info("Prikazujem sačuvani profil (problem sa mrežom)");
          }
        } else {
          // If no cache and offline/error
          if (!navigator.onLine) {
            setIsOffline(true);
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast.error(
                "Nema sačuvanog profila. Proverite internet konekciju.",
              );
            }
          }
        }
      } catch (error) {
        log.error("Error in profile fetch", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { profile, setProfile, stats, loading, isOffline };
}
