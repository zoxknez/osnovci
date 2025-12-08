import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getAchievementsAction } from "@/app/actions/achievements";
import type { StoredGamificationData } from "@/lib/db/offline-storage";
import { offlineStorage } from "@/lib/db/offline-storage";

export function useOfflineAchievements() {
  const [data, setData] = useState<StoredGamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const errorShownRef = useRef(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Check online status
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      setIsOnline(online);

      if (online) {
        try {
          const result = await getAchievementsAction();

          if (result.error) {
            throw new Error(result.error);
          }

          if (result.data) {
            const gamificationData: StoredGamificationData = {
              achievements: result.data.achievements.map(
                (a: {
                  id: string;
                  achievementType: string;
                  title: string;
                  description: string;
                  xpReward: number;
                  unlockedAt: string | Date;
                }) => ({
                  ...a,
                  unlockedAt:
                    typeof a.unlockedAt === "string"
                      ? a.unlockedAt
                      : a.unlockedAt.toISOString(),
                }),
              ),
              progress: result.data.progress,
              stats: result.data.stats,
            };
            await offlineStorage.saveGamificationData(gamificationData);
            setData(gamificationData);
            errorShownRef.current = false; // Reset on success
          }
        } catch (error) {
          console.error("Error fetching online achievements:", error);
          // Fallback to offline
          const cached = await offlineStorage.getGamificationData();
          if (cached) {
            setData(cached);
            if (online && !errorShownRef.current) {
              errorShownRef.current = true;
              toast.error(
                "Greška pri učitavanju. Prikazujem sačuvane podatke.",
              );
            }
          }
        }
      } else {
        // Offline mode
        const cached = await offlineStorage.getGamificationData();
        if (cached) {
          setData(cached);
        }
      }
    } catch (error) {
      console.error("Error in useOfflineAchievements:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleOnline = () => {
      setIsOnline(true);
      loadData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadData]);

  return {
    data,
    loading,
    isOnline,
    refresh: loadData,
  };
}
