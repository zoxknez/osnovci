import { useState, useEffect, useMemo } from "react";
import { useHomework } from "@/hooks/use-homework";
import { useOfflineHomework } from "@/hooks/use-offline-homework";
import { offlineStorage } from "@/lib/db/offline-storage";

export function useHomeworkList(page: number, searchQuery: string, filterStatus: string) {
  const { data: onlineData, isLoading: isOnlineLoading, error: onlineError } = useHomework({
    page,
    limit: 20,
    sortBy: "dueDate",
    order: "asc",
    search: searchQuery || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  const { offlineItems, saveOffline, syncOfflineItems, hasOfflineItems, unsyncedCount } = useOfflineHomework();
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Cache online data when received
  useEffect(() => {
    if (onlineData?.data) {
      const cacheData = async () => {
        try {
          for (const item of onlineData.data) {
             await offlineStorage.saveHomework({
               id: item.id,
               studentId: "current-user", // API doesn't return studentId, use placeholder
               subjectId: item.subject.id,
               subjectName: item.subject.name,
               ...(item.subject.color ? { subjectColor: item.subject.color } : {}),
               title: item.title,
               ...(item.description ? { description: item.description } : {}),
               dueDate: new Date(item.dueDate).toISOString(),
               priority: item.priority,
               status: item.status,
               createdAt: new Date(item.createdAt).toISOString(),
               updatedAt: new Date(item.updatedAt).toISOString(),
               synced: true
             });
          }
        } catch (e) {
          console.error("Failed to cache homework", e);
        }
      };
      cacheData();
      setIsOfflineMode(false);
    }
  }, [onlineData]);

  // Detect offline/error state
  useEffect(() => {
    if (onlineError) {
      setIsOfflineMode(true);
    }
  }, [onlineError]);

  // Combine data
  const combinedData = useMemo(() => {
    // If we have online data, use it + unsynced offline items
    if (onlineData?.data && !isOfflineMode) {
       const onlineIds = new Set(onlineData.data.map(i => i.id));
       const unsynced = offlineItems.filter(i => !i.synced && !onlineIds.has(i.id));
       
       // Map online data to common format
       let mappedOnline = onlineData.data.map(hw => ({
         id: hw.id,
         subject: hw.subject.name,
         subjectId: hw.subject.id,
         title: hw.title,
         description: hw.description,
         dueDate: new Date(hw.dueDate),
         status: hw.status.toLowerCase(),
         priority: hw.priority.toLowerCase(),
         attachments: hw.attachmentsCount,
         color: hw.subject.color,
         isOffline: false,
         synced: true,
       }));

       // Filter online data by search query (client-side for current page)
       if (searchQuery) {
         const query = searchQuery.toLowerCase();
         mappedOnline = mappedOnline.filter(i => 
           i.title.toLowerCase().includes(query) || 
           i.subject.toLowerCase().includes(query)
         );
       }

       // Map offline data
       let mappedOffline = unsynced.map(item => ({
         id: item.id,
         subject: item.subjectName || "Offline",
         subjectId: item.subjectId,
         title: item.title,
         description: item.description,
         dueDate: item.dueDate,
         status: item.status.toLowerCase(),
         priority: item.priority.toLowerCase(),
         attachments: 0,
         color: item.subjectColor || "#9ca3af",
         isOffline: true,
         synced: false,
       }));

       // Filter unsynced items
       if (searchQuery) {
         const query = searchQuery.toLowerCase();
         mappedOffline = mappedOffline.filter(i => 
           i.title.toLowerCase().includes(query) || 
           i.subject.toLowerCase().includes(query)
         );
       }

       if (filterStatus && filterStatus !== "all") {
         if (filterStatus === "active") {
           mappedOffline = mappedOffline.filter(i => i.status !== "done" && i.status !== "submitted");
         } else if (filterStatus === "done") {
           mappedOffline = mappedOffline.filter(i => i.status === "done" || i.status === "submitted");
         }
       }

       return [...mappedOnline, ...mappedOffline];
    } 
    
    // If offline/error, use all offline items (which includes cached synced ones)
    let items = offlineItems;

    // Client-side filtering for offline mode
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(i => 
        i.title.toLowerCase().includes(query) || 
        (i.subjectName && i.subjectName.toLowerCase().includes(query))
      );
    }

    if (filterStatus && filterStatus !== "all") {
      if (filterStatus === "active") {
        items = items.filter(i => i.status !== "DONE" && i.status !== "SUBMITTED");
      } else if (filterStatus === "done") {
        items = items.filter(i => i.status === "DONE" || i.status === "SUBMITTED");
      }
    }

    return items.map(item => ({
         id: item.id,
         subject: item.subjectName || "Offline",
         subjectId: item.subjectId,
         title: item.title,
         description: item.description,
         dueDate: item.dueDate,
         status: item.status.toLowerCase(),
         priority: item.priority.toLowerCase(),
         attachments: 0,
         color: item.subjectColor || "#9ca3af",
         isOffline: true,
         synced: item.synced,
    }));

  }, [onlineData, offlineItems, isOfflineMode, searchQuery, filterStatus]);

  return {
    data: combinedData,
    pagination: onlineData?.pagination,
    isLoading: isOnlineLoading && !isOfflineMode && offlineItems.length === 0,
    error: onlineError,
    isOfflineMode,
    saveOffline,
    syncOfflineItems,
    hasOfflineItems,
    unsyncedCount
  };
}
