import { useEffect, useState } from "react";
import { toast } from "sonner";
import { offlineStorage } from "@/lib/db/offline-storage";
import { log } from "@/lib/logger";
import { getProfileAction } from "@/app/actions/profile";
import type { ProfileData } from "@/components/features/profile/types";

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
              const profileData = {
                ...DEFAULT_PROFILE,
                name: data.profile.name || "",
                school: data.profile.school || "",
                // Note: Some fields might not be in FullProfile yet, using defaults or available data
                // grade: data.profile.grade || 1, 
                // class: data.profile.class || "",
                // birthDate: data.profile.birthDate || null,
                // address: data.profile.address || "",
              };

              const userStats: UserStats = {
                xp: data.profile.xp || 0,
                level: data.profile.level || 1,
                completedHomework: data.stats?.completedHomework || 0,
                streak: (data.profile as any).streak || 0,
              };
              
              setProfile(profileData);
              setStats(userStats);
              
              // Cache to IndexedDB
              await offlineStorage.saveProfile({ profile: profileData, stats: userStats });
              setIsOffline(false);
              setLoading(false);
              return;
            }
          } catch (error) {
            log.warn("Failed to fetch profile online, falling back to cache", { error });
          }
        }

        // 2. Fallback to IndexedDB
        const cached = await offlineStorage.getProfile();
        if (cached) {
          // Handle both old (direct profile) and new ({profile, stats}) formats
          if (cached.profile) {
             setProfile(cached.profile);
             setStats(cached.stats || null);
          } else {
             setProfile(cached); // Legacy format
             setStats(null);
          }
          
          setIsOffline(true);
          if (navigator.onLine) {
             toast.info("Prikazujem sačuvani profil (problem sa mrežom)");
          }
        } else {
           // If no cache and offline/error
           if (!navigator.onLine) {
             setIsOffline(true);
             toast.error("Nema sačuvanog profila. Proverite internet konekciju.");
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
