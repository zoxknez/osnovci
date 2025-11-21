// Zustand store za globalni state (moderna alternativa Redux-u)
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Notification, Student, User } from "@/types";
import { useSettingsStore } from "./settings";

// ============================================
// AUTH STORE
// ============================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// ============================================
// STUDENT STORE (Aktivan učenik za roditelje sa više dece)
// ============================================

interface StudentState {
  activeStudent: Student | null;
  students: Student[];
  setActiveStudent: (student: Student | null) => void;
  setStudents: (students: Student[]) => void;
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set) => ({
      activeStudent: null,
      students: [],
      setActiveStudent: (student) => set({ activeStudent: student }),
      setStudents: (students) => set({ students }),
    }),
    {
      name: "student-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// ============================================
// UI STORE (Tema, jezik, notifikacije)
// ============================================

interface UIState {
  sidebarOpen: boolean;
  notificationsOpen: boolean;
  toggleSidebar: () => void;
  toggleNotifications: () => void;
  closeSidebar: () => void;
  closeNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  notificationsOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleNotifications: () =>
    set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  closeNotifications: () => set({ notificationsOpen: false }),
}));

// ============================================
// NOTIFICATION STORE
// ============================================

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),
  addNotification: (notification) => {
    const settings = useSettingsStore.getState().notifications;
    
    // Map notification types to settings keys
    let shouldShow = true;
    const type = notification.type.toUpperCase();
    
    if (type.includes("GRADE") || type.includes("OCEN")) {
        shouldShow = settings.grades;
    } else if (type.includes("HOMEWORK") || type.includes("DOMAC")) {
        shouldShow = settings.homework;
    } else if (type.includes("SCHEDULE") || type.includes("RASPORED")) {
        shouldShow = settings.schedule;
    } else if (type.includes("MESSAGE") || type.includes("PORUK")) {
        shouldShow = settings.messages;
    }
    
    if (!shouldShow) return;

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead
        ? state.unreadCount
        : state.unreadCount + 1,
    }));
  },
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));

// ============================================
// OFFLINE SYNC STORE
// ============================================

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncAt: Date | null;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSync: (date: Date) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      isSyncing: false,
      pendingSyncCount: 0,
      lastSyncAt: null,
      setOnline: (online) => set({ isOnline: online }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setPendingCount: (count) => set({ pendingSyncCount: count }),
      setLastSync: (date) => set({ lastSyncAt: date }),
    }),
    {
      name: "sync-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
