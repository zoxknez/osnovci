import { useMemo, useState, useEffect } from "react";
import { useHomework } from "@/hooks/use-homework";
import { useProfile } from "@/hooks/use-profile";
import { useSchedule } from "@/hooks/use-schedule";
import { useOfflineSchedule } from "@/hooks/use-offline-schedule";
import { useOfflineHomework } from "@/hooks/use-offline-homework";
import { useOfflineProfile } from "@/hooks/use-offline-profile";
import { useSyncStore } from "@/store";
import { log } from "@/lib/logger";
import { toast } from "sonner";

export function useDashboardData() {
  const [dayOfWeek, setDayOfWeek] = useState<string | undefined>(undefined);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const today = new Date();
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    setDayOfWeek(days[today.getDay()]);
    setNow(today);

    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { isOnline } = useSyncStore();
  const { offlineSchedule, hasOfflineSchedule } = useOfflineSchedule();
  const { offlineItems: offlineHomework, hasOfflineItems: hasOfflineHomework } = useOfflineHomework();
  const { profile: offlineProfile, stats: offlineStats } = useOfflineProfile();

  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();
  const {
    data: homeworkData,
    isLoading: homeworkLoading,
    error: homeworkError,
  } = useHomework({
    limit: 5,
    sortBy: "dueDate",
    order: "asc",
    status: "ASSIGNED,IN_PROGRESS",
  });
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useSchedule({
    ...(dayOfWeek !== undefined && { dayOfWeek }),
    limit: 10,
  });

  const isServer = typeof window === 'undefined';
  const loading = isServer || ((profileLoading || homeworkLoading || scheduleLoading) && isOnline);

  const homework = useMemo(() => {
    if (isOnline && Array.isArray(homeworkData?.data)) {
      return homeworkData.data;
    }
    if (!isOnline && hasOfflineHomework) {
      return offlineHomework.map(h => ({
        id: h.id,
        title: h.title,
        description: h.description,
        dueDate: h.dueDate,
        priority: h.priority,
        status: h.status,
        subject: { name: "Offline predmet", color: "#9ca3af" },
        isOffline: true
      }));
    }
    return Array.isArray(homeworkData?.data) ? homeworkData.data : [];
  }, [isOnline, homeworkData, offlineHomework, hasOfflineHomework]);

  const todayClasses = useMemo(() => {
    if (isOnline && Array.isArray(scheduleData?.data)) {
      return scheduleData.data;
    }
    if (!isOnline && hasOfflineSchedule) {
      const currentDayKey = dayOfWeek || "MONDAY";
      return offlineSchedule.filter((s: any) => s.dayOfWeek === currentDayKey);
    }
    return Array.isArray(scheduleData?.data) ? scheduleData.data : [];
  }, [isOnline, scheduleData, offlineSchedule, hasOfflineSchedule, dayOfWeek]);

  log.info("Dashboard data loaded", {
    homeworkCount: homework.length,
    isArray: Array.isArray(homework),
    hasSchedule: todayClasses.length > 0,
    isOnline
  });

  const studentName = (isOnline ? profileData?.profile?.name : offlineProfile?.name)?.split(" ")[0] || "Učeniče";
  const xp = (isOnline ? profileData?.profile?.xp : offlineStats?.xp) || 0;
  const level = (isOnline ? profileData?.profile?.level : offlineStats?.level) || 1;
  const nextLevelXP = level * 1000;
  const xpProgress = (xp / nextLevelXP) * 100;
  const currentStreak = (isOnline ? (profileData?.profile as any)?.streak : offlineStats?.streak) || 5;
  const completedHomeworkCount = (isOnline ? (profileData?.stats as any)?.completedHomework : offlineStats?.completedHomework) || 0;

  if (profileError && isOnline) toast.error("Greška pri učitavanju profila");
  if (homeworkError && isOnline && !hasOfflineHomework) toast.error("Greška pri učitavanju domaćih zadataka");
  if (scheduleError && isOnline && !hasOfflineSchedule) toast.error("Greška pri učitavanju rasporeda");

  return {
    loading,
    homework,
    todayClasses,
    studentName,
    xp,
    level,
    nextLevelXP,
    xpProgress,
    currentStreak,
    completedHomeworkCount,
    isOnline,
    now
  };
}
