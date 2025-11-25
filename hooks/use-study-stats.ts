/**
 * useStudyStats - Hook za praćenje statistika učenja
 * 
 * Prati:
 * - Dnevno vrijeme učenja
 * - Sedmične i mjesečne statistike
 * - Produktivnost po predmetima
 * - Optimalno vrijeme za učenje
 */

import { useState, useCallback, useMemo } from "react";

interface StudySession {
  id: string;
  subjectId?: string;
  subjectName?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes: number;
  completed: boolean;
  xpEarned: number;
}

interface DayStats {
  date: string; // ISO date string
  totalMinutes: number;
  sessionsCount: number;
  xpEarned: number;
  subjectBreakdown: Record<string, number>;
}

interface StudyStatsHook {
  // Current session
  currentSession: StudySession | null;
  isStudying: boolean;
  
  // Start/stop session
  startSession: (subjectId?: string, subjectName?: string) => void;
  endSession: (completed?: boolean) => number; // Returns XP earned
  
  // Stats
  todayStats: DayStats;
  weekStats: DayStats[];
  monthStats: DayStats[];
  
  // Insights
  totalStudyTimeToday: number;
  averageSessionLength: number;
  mostProductiveHour: number;
  mostStudiedSubject: { name: string; minutes: number } | null;
  studyStreak: number;
  
  // Goals
  dailyGoalMinutes: number;
  setDailyGoal: (minutes: number) => void;
  goalProgress: number;
  
  // Utilities
  formatDuration: (minutes: number) => string;
}

// XP rewards za studiranje
const XP_PER_15_MIN = 10;
const XP_COMPLETION_BONUS = 5;
const XP_STREAK_BONUS = 2; // Per day of streak - used in streak calculations

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}

export function useStudyStats(): StudyStatsHook {
  const [sessions, setSessions] = useLocalStorage<StudySession[]>("study_sessions", []);
  const [dailyStats, setDailyStats] = useLocalStorage<Record<string, DayStats>>("study_daily_stats", {});
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useLocalStorage<number>("study_daily_goal", 60);
  const [hourlyActivity, setHourlyActivity] = useLocalStorage<Record<number, number>>("study_hourly", {});

  const isStudying = currentSession !== null;
  const today = getDateKey(new Date());

  // Start a new study session
  const startSession = useCallback((subjectId?: string, subjectName?: string) => {
    const newSession: StudySession = {
      id: generateSessionId(),
      subjectId: subjectId ?? "",
      subjectName: subjectName ?? "",
      startTime: new Date(),
      durationMinutes: 0,
      completed: false,
      xpEarned: 0,
    };
    setCurrentSession(newSession);
  }, []);

  // End current session
  const endSession = useCallback((completed: boolean = true): number => {
    if (!currentSession) return 0;

    const endTime = new Date();
    const durationMinutes = Math.floor(
      (endTime.getTime() - new Date(currentSession.startTime).getTime()) / (1000 * 60)
    );

    // Calculate XP
    let xpEarned = Math.floor(durationMinutes / 15) * XP_PER_15_MIN;
    if (completed && durationMinutes >= 15) {
      xpEarned += XP_COMPLETION_BONUS;
    }
    
    // Add streak bonus
    const currentStreak = Object.keys(dailyStats).length;
    if (currentStreak > 1) {
      xpEarned += Math.min(currentStreak, 7) * XP_STREAK_BONUS;
    }

    const completedSession: StudySession = {
      ...currentSession,
      endTime,
      durationMinutes,
      completed,
      xpEarned,
    };

    // Save session
    setSessions(prev => [...prev.slice(-100), completedSession]); // Keep last 100 sessions

    // Update daily stats
    const dateKey = getDateKey(new Date(currentSession.startTime));
    setDailyStats(prev => {
      const existing = prev[dateKey] || {
        date: dateKey,
        totalMinutes: 0,
        sessionsCount: 0,
        xpEarned: 0,
        subjectBreakdown: {},
      };

      const subjectBreakdown = { ...existing.subjectBreakdown };
      if (currentSession.subjectName) {
        subjectBreakdown[currentSession.subjectName] = 
          (subjectBreakdown[currentSession.subjectName] || 0) + durationMinutes;
      }

      return {
        ...prev,
        [dateKey]: {
          ...existing,
          totalMinutes: existing.totalMinutes + durationMinutes,
          sessionsCount: existing.sessionsCount + 1,
          xpEarned: existing.xpEarned + xpEarned,
          subjectBreakdown,
        },
      };
    });

    // Track hourly activity
    const startHour = new Date(currentSession.startTime).getHours();
    setHourlyActivity(prev => ({
      ...prev,
      [startHour]: (prev[startHour] || 0) + durationMinutes,
    }));

    setCurrentSession(null);
    return xpEarned;
  }, [currentSession, setSessions, setDailyStats, setHourlyActivity]);

  // Get today's stats
  const todayStats = useMemo((): DayStats => {
    return dailyStats[today] || {
      date: today,
      totalMinutes: 0,
      sessionsCount: 0,
      xpEarned: 0,
      subjectBreakdown: {},
    };
  }, [dailyStats, today]);

  // Get week stats
  const weekStats = useMemo((): DayStats[] => {
    const stats: DayStats[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = getDateKey(date);
      
      stats.push(dailyStats[dateKey] || {
        date: dateKey,
        totalMinutes: 0,
        sessionsCount: 0,
        xpEarned: 0,
        subjectBreakdown: {},
      });
    }
    
    return stats;
  }, [dailyStats]);

  // Get month stats
  const monthStats = useMemo((): DayStats[] => {
    const stats: DayStats[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = getDateKey(date);
      
      stats.push(dailyStats[dateKey] || {
        date: dateKey,
        totalMinutes: 0,
        sessionsCount: 0,
        xpEarned: 0,
        subjectBreakdown: {},
      });
    }
    
    return stats;
  }, [dailyStats]);

  // Calculate total study time today
  const totalStudyTimeToday = useMemo(() => {
    let total = todayStats.totalMinutes;
    
    // Add current session if active
    if (currentSession) {
      total += Math.floor(
        (Date.now() - new Date(currentSession.startTime).getTime()) / (1000 * 60)
      );
    }
    
    return total;
  }, [todayStats, currentSession]);

  // Calculate average session length
  const averageSessionLength = useMemo(() => {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    return Math.round(total / sessions.length);
  }, [sessions]);

  // Find most productive hour
  const mostProductiveHour = useMemo(() => {
    const entries = Object.entries(hourlyActivity);
    if (entries.length === 0) return 15; // Default: 3 PM
    
    return parseInt(
      entries.reduce((max, curr) => 
        curr[1] > max[1] ? curr : max
      )[0]
    );
  }, [hourlyActivity]);

  // Find most studied subject
  const mostStudiedSubject = useMemo(() => {
    const subjectTotals: Record<string, number> = {};
    
    Object.values(dailyStats).forEach(day => {
      Object.entries(day.subjectBreakdown).forEach(([subject, minutes]) => {
        subjectTotals[subject] = (subjectTotals[subject] || 0) + minutes;
      });
    });
    
    const entries = Object.entries(subjectTotals);
    if (entries.length === 0) return null;
    
    const [name, minutes] = entries.reduce((max, curr) => 
      curr[1] > max[1] ? curr : max
    );
    
    return { name, minutes };
  }, [dailyStats]);

  // Calculate study streak
  const studyStreak = useMemo(() => {
    let streak = 0;
    const now = new Date();
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = getDateKey(date);
      const dayStats = dailyStats[dateKey];
      
      if (dayStats && dayStats.totalMinutes >= 15) {
        streak++;
      } else if (i > 0) {
        // Allow today to not have activity yet
        break;
      }
    }
    
    return streak;
  }, [dailyStats]);

  // Goal progress
  const goalProgress = useMemo(() => {
    return Math.min((totalStudyTimeToday / dailyGoalMinutes) * 100, 100);
  }, [totalStudyTimeToday, dailyGoalMinutes]);

  // Format duration
  const formatDuration = useCallback((minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }, []);

  // Set daily goal
  const setDailyGoal = useCallback((minutes: number) => {
    setDailyGoalMinutes(Math.max(15, Math.min(480, minutes))); // 15 min - 8 hours
  }, [setDailyGoalMinutes]);

  return {
    currentSession,
    isStudying,
    startSession,
    endSession,
    todayStats,
    weekStats,
    monthStats,
    totalStudyTimeToday,
    averageSessionLength,
    mostProductiveHour,
    mostStudiedSubject,
    studyStreak,
    dailyGoalMinutes,
    setDailyGoal,
    goalProgress,
    formatDuration,
  };
}
