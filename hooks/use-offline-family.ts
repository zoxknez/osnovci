import { useState, useEffect, useCallback, useRef } from "react";
import { offlineStorage } from "@/lib/db/offline-storage";
import type { StoredFamilyMember } from "@/lib/db/offline-storage";
import { toast } from "sonner";
import { getFamilyMembersAction } from "@/app/actions/family";

// API response type for family member
interface ApiFamilyMember {
  id: string;
  name: string;
  email?: string;
  studentName?: string;
  linkCode?: string;
  isActive: boolean;
  permissions: string[];
  linkedAt: string | Date;
  expiresAt?: string | Date;
  role?: string;
  relation?: string;
}

export function useOfflineFamily() {
  const [familyMembers, setFamilyMembers] = useState<StoredFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const toastShownRef = useRef(false);

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
            const members = result.data as ApiFamilyMember[];
            
            // Map to stored format, preserving API values where available
            const storedMembers: StoredFamilyMember[] = members.map((m) => ({
              id: m.id,
              name: m.name,
              role: m.role || "GUARDIAN",
              relation: m.relation || "Roditelj",
              permissions: m.permissions || [],
              linkedAt: typeof m.linkedAt === 'string' ? m.linkedAt : new Date(m.linkedAt).toISOString()
            }));

            await offlineStorage.saveFamilyMembers(storedMembers);
            setFamilyMembers(storedMembers);
            toastShownRef.current = false; // Reset on success
          } else {
             throw new Error(result.error);
          }
        } catch (error) {
          console.error("Failed to fetch family online", error);
          // Fallback to cached data
          const cached = await offlineStorage.getFamilyMembers();
          setFamilyMembers(cached);
          if (online && !toastShownRef.current && cached.length > 0) {
            toastShownRef.current = true;
            toast.info("Prikazujem sačuvane članove porodice");
          }
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
