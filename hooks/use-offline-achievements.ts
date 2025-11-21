import { useState, useEffect, useCallback } from "react";
import { offlineStorage, StoredGamificationData } from "@/lib/db/offline-storage";
import { toast } from "sonner";
import { getAchievementsAction } from "@/app/actions/achievements";

export function useOfflineAchievements() {
  const [data, setData] = useState<StoredGamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check online status
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOnline(online);

      if (online) {
        try {
          const result = await getAchievementsAction();
          
          if (result.error) {
             throw new Error(result.error);
          }
          
          if (result.data) {
             await offlineStorage.saveGamificationData(result.data as any);
             setData(result.data as any);
          }
        } catch (error) {
          console.error("Error fetching online achievements:", error);
          // Fallback to offline
          const cached = await offlineStorage.getGamificationData();
          if (cached) {
            setData(cached);
            if (online) {
              toast.error("Greška pri učitavanju. Prikazujem sačuvane podatke.");
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
    refresh: loadData
  };
}
