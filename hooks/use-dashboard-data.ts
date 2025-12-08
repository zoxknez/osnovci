import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHomework } from "@/hooks/use-homework";
import { useOfflineHomework } from "@/hooks/use-offline-homework";
import { useOfflineProfile } from "@/hooks/use-offline-profile";
import { useOfflineSchedule } from "@/hooks/use-offline-schedule";
import { useProfile } from "@/hooks/use-profile";
import { useSchedule } from "@/hooks/use-schedule";
import { getXPProgress } from "@/lib/gamification/xp-calculator";
import { log } from "@/lib/logger";
import { useSyncStore } from "@/store";

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
  const { offlineItems: offlineHomework, hasOfflineItems: hasOfflineHomework } =
    useOfflineHomework();
  const { profile: offlineProfile, stats: offlineStats } = useOfflineProfile();

  const { data: currentUser } = useCurrentUser();
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

  const isServer = typeof window === "undefined";
  const loading =
    isServer ||
    ((profileLoading || homeworkLoading || scheduleLoading) && isOnline);

  const homework = useMemo(() => {
    if (isOnline && Array.isArray(homeworkData?.data)) {
      return homeworkData.data;
    }
    if (!isOnline && hasOfflineHomework) {
      return offlineHomework.map((h) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        dueDate: h.dueDate,
        priority: h.priority,
        status: h.status,
        subject: { name: "Offline predmet", color: "#9ca3af" },
        isOffline: true,
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
    isOnline,
  });

  const studentName =
    (isOnline ? profileData?.profile?.name : offlineProfile?.name)?.split(
      " ",
    )[0] || "Učeniče";
  const xp = (isOnline ? profileData?.profile?.xp : offlineStats?.xp) || 0;
  const level =
    (isOnline ? profileData?.profile?.level : offlineStats?.level) || 1;

  // Koristi centralizovanu XP kalkulaciju
  const xpProgressData = useMemo(() => getXPProgress(xp), [xp]);
  const nextLevelXP =
    xpProgressData.requiredXP +
    (xpProgressData.currentLevel > 1 ? xp - xpProgressData.currentXP : 0);
  const xpProgress = Math.round(xpProgressData.progress * 100);
  const xpToNextLevel = xpProgressData.requiredXP - xpProgressData.currentXP;

  // Popravljeni tipovi - izbegavamo 'any'
  const profileWithStreak = profileData?.profile as
    | { streak?: number }
    | undefined;
  const statsWithHomework = profileData?.stats as
    | { completedHomework?: number }
    | undefined;
  const currentStreak =
    (isOnline ? profileWithStreak?.streak : offlineStats?.streak) || 0;
  const completedHomeworkCount =
    (isOnline
      ? statsWithHomework?.completedHomework
      : offlineStats?.completedHomework) || 0;

  // Prikaži greške u useEffect da izbegnemo pozive toasta tokom renderovanja
  const errorShownRef = useRef<{
    profile: boolean;
    homework: boolean;
    schedule: boolean;
  }>({
    profile: false,
    homework: false,
    schedule: false,
  });

  useEffect(() => {
    if (profileError && isOnline && !errorShownRef.current.profile) {
      toast.error("Greška pri učitavanju profila");
      errorShownRef.current.profile = true;
    }
    if (
      homeworkError &&
      isOnline &&
      !hasOfflineHomework &&
      !errorShownRef.current.homework
    ) {
      toast.error("Greška pri učitavanju domaćih zadataka");
      errorShownRef.current.homework = true;
    }
    if (
      scheduleError &&
      isOnline &&
      !hasOfflineSchedule &&
      !errorShownRef.current.schedule
    ) {
      toast.error("Greška pri učitavanju rasporeda");
      errorShownRef.current.schedule = true;
    }
  }, [
    profileError,
    homeworkError,
    scheduleError,
    isOnline,
    hasOfflineHomework,
    hasOfflineSchedule,
  ]);

  return {
    loading,
    homework,
    todayClasses,
    studentName,
    xp,
    level,
    nextLevelXP,
    xpProgress,
    xpToNextLevel,
    currentStreak,
    completedHomeworkCount,
    isOnline,
    now,
    currentUser,
  };
}
