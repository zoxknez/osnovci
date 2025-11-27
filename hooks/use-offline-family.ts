import { useState, useEffect, useCallback } from "react";
import { offlineStorage, StoredFamilyMember } from "@/lib/db/offline-storage";
import { getFamilyMembersAction } from "@/app/actions/family";

export function useOfflineFamily() {
  const [familyMembers, setFamilyMembers] = useState<StoredFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const loadFamily = useCallback(async () => {
    try {
      setLoading(true);
      const online = navigator.onLine;
      setIsOnline(online);

      if (online) {
        try {
          const result = await getFamilyMembersAction({ 
            page: 1, 
            limit: 100,
            sortBy: "createdAt",
            order: "desc"
          });
          
          if (result.success && result.data) {
            const members = result.data;
            
            // Map to stored format if needed (dates to strings)
            const storedMembers: StoredFamilyMember[] = members.map((m: any) => ({
              id: m.id,
              name: m.name,
              role: "GUARDIAN", // Default role as API might not return it explicitly in the same format
              relation: "Roditelj", // Default relation
              permissions: m.permissions,
              linkedAt: new Date(m.linkedAt).toISOString()
            }));

            await offlineStorage.saveFamilyMembers(storedMembers);
            setFamilyMembers(storedMembers);
          } else {
             throw new Error(result.error);
          }
        } catch (error) {
          console.error("Failed to fetch family online", error);
          // Fallback
          const cached = await offlineStorage.getFamilyMembers();
          setFamilyMembers(cached);
        }
      } else {
        const cached = await offlineStorage.getFamilyMembers();
        setFamilyMembers(cached);
      }
    } catch (error) {
      console.error("Error loading family", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamily();
    
    const handleOnline = () => {
      setIsOnline(true);
      loadFamily();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadFamily]);

  return {
    familyMembers,
    loading,
    isOnline,
    refresh: loadFamily
  };
}
