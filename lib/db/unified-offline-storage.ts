/**
 * Unified Offline Storage - Konsolidovana IndexedDB implementacija
 * 
 * Kombinuje funkcionalnosti iz:
 * - lib/db/offline-storage.ts (singleton pattern, type safety)
 * - lib/offline/indexeddb.ts (compression, logging, metadata)
 * 
 * Features:
 * - Singleton pattern za konzistentnost
 * - LZString kompresija za veće tekstove
 * - Logging za debugging
 * - Gamification podrška
 * - Sync queue za offline-first operacije
 * - Storage monitoring
 */

import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import { log } from "@/lib/logger";

// Try to import LZString, but make it optional
let LZString: typeof import("lz-string") | null = null;
if (typeof window !== "undefined") {
  import("lz-string").then((module) => {
    LZString = module.default || module;
  }).catch(() => {
    // LZString not available, compression disabled
  });
}

// Compression helpers
function compress(str: string | null): string | null {
  if (!str || !LZString) return str;
  try {
    return LZString.compressToUTF16(str);
  } catch {
    return str;
  }
}

function decompress(str: string | null): string | null {
  if (!str || !LZString) return str;
  try {
    const decompressed = LZString.decompressFromUTF16(str);
    return decompressed || str;
  } catch {
    return str;
  }
}

// ============================================
// DATABASE SCHEMA TYPES
// ============================================

// Homework types
export type HomeworkPriority = "NORMAL" | "IMPORTANT" | "URGENT";
export type HomeworkStatus = "ASSIGNED" | "IN_PROGRESS" | "DONE" | "SUBMITTED" | "REVIEWED";

export interface StoredHomework {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  title: string;
  description?: string | null;
  dueDate: string;
  priority: HomeworkPriority;
  status: HomeworkStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  cachedAt?: number;
  synced: boolean;
}

export interface StoredAttachment {
  id: string;
  homeworkId: string;
  file?: Blob;
  blob?: Blob;
  fileName: string;
  mimeType: string;
  size?: number;
  fileSize?: number;
  localUri?: string;
  thumbnail?: string | null;
  uploadedAt?: string;
  cachedAt?: number;
  synced: boolean;
}

export interface StoredScheduleItem {
  id: string;
  studentId?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectId?: string;
  subject?: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  };
  classroom: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  cachedAt?: number;
}

export interface StoredGrade {
  id: string;
  studentId?: string;
  grade?: number;
  value?: number;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  category?: string;
  type?: string;
  description?: string | null;
  date: string;
  createdAt?: string;
  cachedAt?: number;
}

export interface StoredFamilyMember {
  id: string;
  name: string;
  role: string;
  relation?: string;
  avatar?: string | null;
  permissions?: string[];
  linkedAt?: string;
  cachedAt?: number;
}

export interface StoredEvent {
  id: string;
  studentId: string;
  title: string;
  description: string | null;
  date: string;
  type: string;
  cachedAt: number;
}

// Gamification types
export interface StoredAchievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  xpReward: number;
  unlockedAt: string;
}

export interface StoredAchievementProgress {
  type: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface StoredAchievementStats {
  total: number;
  totalXP: number;
  level: number;
  currentXP: number;
  totalXPEarned: number;
}

export interface StoredGamificationData {
  achievements: StoredAchievement[];
  progress: StoredAchievementProgress[];
  stats: StoredAchievementStats;
}

// Sync types
export type SyncActionType = "CREATE" | "UPDATE" | "DELETE" | "UPLOAD";
export type SyncEntityType = "homework" | "attachment" | "note" | "grade" | "event";

export interface StoredSyncItem {
  id: string;
  action?: SyncActionType;
  type?: SyncActionType;
  entity: SyncEntityType;
  data: unknown;
  timestamp?: string;
  createdAt?: number;
  retries: number;
}

// Database schema
interface UnifiedDB extends DBSchema {
  homework: {
    key: string;
    value: StoredHomework;
    indexes: {
      "by-student": string;
      "by-status": string;
      "by-due-date": string;
      "by-synced": number;
    };
  };
  
  attachments: {
    key: string;
    value: StoredAttachment;
    indexes: {
      "by-homework": string;
      "by-synced": number;
    };
  };
  
  schedule: {
    key: string;
    value: StoredScheduleItem;
    indexes: {
      "by-student": string;
      "by-day": string;
    };
  };
  
  grades: {
    key: string;
    value: StoredGrade;
    indexes: {
      "by-student": string;
      "by-subject": string;
      "by-date": string;
    };
  };
  
  events: {
    key: string;
    value: StoredEvent;
    indexes: {
      "by-student": string;
      "by-date": string;
    };
  };
  
  family: {
    key: string;
    value: StoredFamilyMember;
  };
  
  gamification: {
    key: string;
    value: {
      id: string;
      data: StoredGamificationData;
      updatedAt: string;
    };
  };
  
  profile: {
    key: string;
    value: {
      id: string;
      data: unknown;
      updatedAt: string;
    };
  };
  
  "pending-sync": {
    key: string;
    value: StoredSyncItem;
    indexes: {
      "by-timestamp": string;
      "by-entity": string;
    };
  };
  
  metadata: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updatedAt: number;
    };
  };
  
  "study-sessions": {
    key: string;
    value: {
      id: string;
      subjectId?: string;
      subjectName?: string;
      startTime: string;
      endTime?: string;
      durationMinutes: number;
      completed: boolean;
      xpEarned: number;
      focusScore?: number;
    };
    indexes: {
      "by-date": string;
    };
  };
}

const DB_NAME = "osnovci-unified";
const DB_VERSION = 3;

// ============================================
// UNIFIED OFFLINE STORAGE CLASS
// ============================================

class UnifiedOfflineStorage {
  private dbPromise: Promise<IDBPDatabase<UnifiedDB>> | null = null;
  private static instance: UnifiedOfflineStorage | null = null;

  private constructor() {
    if (typeof window !== "undefined" && "indexedDB" in window) {
      this.dbPromise = this.initDB();
    }
  }

  static getInstance(): UnifiedOfflineStorage {
    if (!UnifiedOfflineStorage.instance) {
      UnifiedOfflineStorage.instance = new UnifiedOfflineStorage();
    }
    return UnifiedOfflineStorage.instance;
  }

  private async initDB(): Promise<IDBPDatabase<UnifiedDB>> {
    try {
      const db = await openDB<UnifiedDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
          log.info("[OfflineStorage] Upgrading database", { oldVersion, newVersion: DB_VERSION });

          // Homework store
          if (!db.objectStoreNames.contains("homework")) {
            const store = db.createObjectStore("homework", { keyPath: "id" });
            store.createIndex("by-student", "studentId");
            store.createIndex("by-status", "status");
            store.createIndex("by-due-date", "dueDate");
            store.createIndex("by-synced", "synced");
          }

          // Attachments store
          if (!db.objectStoreNames.contains("attachments")) {
            const store = db.createObjectStore("attachments", { keyPath: "id" });
            store.createIndex("by-homework", "homeworkId");
            store.createIndex("by-synced", "synced");
          }

          // Schedule store
          if (!db.objectStoreNames.contains("schedule")) {
            const store = db.createObjectStore("schedule", { keyPath: "id" });
            store.createIndex("by-student", "studentId");
            store.createIndex("by-day", "dayOfWeek");
          }

          // Grades store
          if (!db.objectStoreNames.contains("grades")) {
            const store = db.createObjectStore("grades", { keyPath: "id" });
            store.createIndex("by-student", "studentId");
            store.createIndex("by-subject", "subjectId");
            store.createIndex("by-date", "date");
          }

          // Events store
          if (!db.objectStoreNames.contains("events")) {
            const store = db.createObjectStore("events", { keyPath: "id" });
            store.createIndex("by-student", "studentId");
            store.createIndex("by-date", "date");
          }

          // Family store
          if (!db.objectStoreNames.contains("family")) {
            db.createObjectStore("family", { keyPath: "id" });
          }

          // Gamification store
          if (!db.objectStoreNames.contains("gamification")) {
            db.createObjectStore("gamification", { keyPath: "id" });
          }

          // Profile store
          if (!db.objectStoreNames.contains("profile")) {
            db.createObjectStore("profile", { keyPath: "id" });
          }

          // Pending sync store
          if (!db.objectStoreNames.contains("pending-sync")) {
            const store = db.createObjectStore("pending-sync", { keyPath: "id" });
            store.createIndex("by-timestamp", "timestamp");
            store.createIndex("by-entity", "entity");
          }

          // Metadata store
          if (!db.objectStoreNames.contains("metadata")) {
            db.createObjectStore("metadata", { keyPath: "key" });
          }

          // Study sessions store
          if (!db.objectStoreNames.contains("study-sessions")) {
            const store = db.createObjectStore("study-sessions", { keyPath: "id" });
            store.createIndex("by-date", "startTime");
          }
        },
      });

      log.info("[OfflineStorage] Database initialized", { version: DB_VERSION });
      return db;
    } catch (error) {
      log.error("[OfflineStorage] Failed to initialize database", error as Error);
      throw error;
    }
  }

  // ========================================
  // HOMEWORK OPERATIONS
  // ========================================

  async saveHomework(homework: StoredHomework | StoredHomework[]): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    
    const items = Array.isArray(homework) ? homework : [homework];
    const tx = db.transaction("homework", "readwrite");
    
    for (const hw of items) {
      await tx.store.put({
        ...hw,
        description: compress(hw.description ?? null),
        notes: compress(hw.notes ?? null),
        cachedAt: Date.now(),
      });
    }
    
    await tx.done;
    log.info("[OfflineStorage] Saved homework", { count: items.length });
  }

  async getHomework(id: string): Promise<StoredHomework | undefined> {
    if (!this.dbPromise) return undefined;
    const db = await this.dbPromise;
    const hw = await db.get("homework", id);
    
    if (hw) {
      return {
        ...hw,
        description: decompress(hw.description ?? null),
        notes: decompress(hw.notes ?? null),
      };
    }
    return undefined;
  }

  async getAllHomework(): Promise<StoredHomework[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    const items = await db.getAll("homework");
    
    return items.map(hw => ({
      ...hw,
      description: decompress(hw.description ?? null),
      notes: decompress(hw.notes ?? null),
    }));
  }

  async getHomeworkByStudent(studentId: string): Promise<StoredHomework[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    const items = await db.getAllFromIndex("homework", "by-student", studentId);
    
    return items.map(hw => ({
      ...hw,
      description: decompress(hw.description ?? null),
      notes: decompress(hw.notes ?? null),
    }));
  }

  async getHomeworkByStatus(status: HomeworkStatus): Promise<StoredHomework[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    const items = await db.getAllFromIndex("homework", "by-status", status);
    
    return items.map(hw => ({
      ...hw,
      description: decompress(hw.description ?? null),
      notes: decompress(hw.notes ?? null),
    }));
  }

  async deleteHomework(id: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete("homework", id);
    log.info("[OfflineStorage] Deleted homework", { id });
  }

  // ========================================
  // ATTACHMENT OPERATIONS
  // ========================================

  async saveAttachment(attachment: StoredAttachment): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("attachments", {
      ...attachment,
      cachedAt: Date.now(),
    });
    log.info("[OfflineStorage] Saved attachment", { id: attachment.id });
  }

  async getAttachment(id: string): Promise<StoredAttachment | undefined> {
    if (!this.dbPromise) return undefined;
    const db = await this.dbPromise;
    return db.get("attachments", id);
  }

  async getAttachmentBlob(id: string): Promise<Blob | null> {
    const attachment = await this.getAttachment(id);
    return attachment?.file || attachment?.blob || null;
  }

  async getAttachmentsByHomework(homeworkId: string): Promise<StoredAttachment[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("attachments", "by-homework", homeworkId);
  }

  async deleteAttachment(id: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete("attachments", id);
    log.info("[OfflineStorage] Deleted attachment", { id });
  }

  // ========================================
  // SCHEDULE OPERATIONS
  // ========================================

  async saveSchedule(schedule: StoredScheduleItem[]): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const tx = db.transaction("schedule", "readwrite");
    
    await tx.store.clear();
    
    for (const item of schedule) {
      await tx.store.put({
        ...item,
        cachedAt: Date.now(),
      });
    }
    
    await tx.done;
    log.info("[OfflineStorage] Saved schedule", { count: schedule.length });
  }

  async getSchedule(): Promise<StoredScheduleItem[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll("schedule");
  }

  async getScheduleByDay(day: string): Promise<StoredScheduleItem[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("schedule", "by-day", day);
  }

  async getScheduleByStudent(studentId: string): Promise<StoredScheduleItem[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("schedule", "by-student", studentId);
  }

  // ========================================
  // GRADES OPERATIONS
  // ========================================

  async saveGrades(grades: StoredGrade[]): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const tx = db.transaction("grades", "readwrite");
    
    await tx.store.clear();
    
    for (const grade of grades) {
      await tx.store.put({
        ...grade,
        cachedAt: Date.now(),
      });
    }
    
    await tx.done;
    log.info("[OfflineStorage] Saved grades", { count: grades.length });
  }

  async getGrades(): Promise<StoredGrade[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll("grades");
  }

  async getGradesByStudent(studentId: string): Promise<StoredGrade[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("grades", "by-student", studentId);
  }

  async getGradesBySubject(subjectId: string): Promise<StoredGrade[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("grades", "by-subject", subjectId);
  }

  // ========================================
  // EVENTS OPERATIONS
  // ========================================

  async saveEvents(events: StoredEvent[]): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const tx = db.transaction("events", "readwrite");
    
    for (const event of events) {
      await tx.store.put({
        ...event,
        description: compress(event.description),
        cachedAt: Date.now(),
      });
    }
    
    await tx.done;
    log.info("[OfflineStorage] Saved events", { count: events.length });
  }

  async getEvents(studentId: string): Promise<StoredEvent[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    const items = await db.getAllFromIndex("events", "by-student", studentId);
    
    return items.map(event => ({
      ...event,
      description: decompress(event.description),
    }));
  }

  // ========================================
  // FAMILY OPERATIONS
  // ========================================

  async saveFamilyMembers(members: StoredFamilyMember[]): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const tx = db.transaction("family", "readwrite");
    
    await tx.store.clear();
    
    for (const member of members) {
      await tx.store.put({
        ...member,
        cachedAt: Date.now(),
      });
    }
    
    await tx.done;
    log.info("[OfflineStorage] Saved family members", { count: members.length });
  }

  async getFamilyMembers(): Promise<StoredFamilyMember[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll("family");
  }

  // ========================================
  // GAMIFICATION OPERATIONS
  // ========================================

  async saveGamificationData(data: StoredGamificationData): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("gamification", {
      id: "current",
      data,
      updatedAt: new Date().toISOString(),
    });
    log.info("[OfflineStorage] Saved gamification data");
  }

  async getGamificationData(): Promise<StoredGamificationData | null> {
    if (!this.dbPromise) return null;
    const db = await this.dbPromise;
    const result = await db.get("gamification", "current");
    return result?.data || null;
  }

  // ========================================
  // PROFILE OPERATIONS
  // ========================================

  async saveProfile(data: unknown): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("profile", {
      id: "current",
      data,
      updatedAt: new Date().toISOString(),
    });
    log.info("[OfflineStorage] Saved profile");
  }

  async getProfile(): Promise<unknown | null> {
    if (!this.dbPromise) return null;
    const db = await this.dbPromise;
    const result = await db.get("profile", "current");
    return result?.data || null;
  }

  // ========================================
  // SYNC QUEUE OPERATIONS
  // ========================================

  async addToSyncQueue(item: Omit<StoredSyncItem, "id">): Promise<string> {
    if (!this.dbPromise) return "";
    const db = await this.dbPromise;
    
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.put("pending-sync", {
      ...item,
      id,
      timestamp: new Date().toISOString(),
      retries: item.retries || 0,
    });
    
    log.info("[OfflineStorage] Added to sync queue", { id, entity: item.entity });
    return id;
  }

  async getSyncQueue(): Promise<StoredSyncItem[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll("pending-sync");
  }

  async removeSyncItem(id: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete("pending-sync", id);
    log.info("[OfflineStorage] Removed sync item", { id });
  }

  async incrementSyncRetries(id: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const item = await db.get("pending-sync", id);
    
    if (item) {
      item.retries += 1;
      await db.put("pending-sync", item);
    }
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.clear("pending-sync");
    log.info("[OfflineStorage] Cleared sync queue");
  }

  // ========================================
  // METADATA OPERATIONS
  // ========================================

  async setMetadata(key: string, value: unknown): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("metadata", {
      key,
      value,
      updatedAt: Date.now(),
    });
  }

  async getMetadata<T = unknown>(key: string): Promise<T | null> {
    if (!this.dbPromise) return null;
    const db = await this.dbPromise;
    const record = await db.get("metadata", key);
    return (record?.value as T) || null;
  }

  // ========================================
  // STUDY SESSIONS
  // ========================================

  async saveStudySession(session: UnifiedDB["study-sessions"]["value"]): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("study-sessions", session);
    log.info("[OfflineStorage] Saved study session", { id: session.id });
  }

  async getStudySessions(limit = 100): Promise<UnifiedDB["study-sessions"]["value"][]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    const sessions = await db.getAll("study-sessions");
    return sessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  // ========================================
  // UTILITY OPERATIONS
  // ========================================

  async getUnsyncedItems(): Promise<{
    homework: StoredHomework[];
    attachments: StoredAttachment[];
  }> {
    if (!this.dbPromise) return { homework: [], attachments: [] };
    const db = await this.dbPromise;
    
    const homework = await db.getAllFromIndex("homework", "by-synced", 0);
    const attachments = await db.getAllFromIndex("attachments", "by-synced", 0);
    
    return { homework, attachments };
  }

  async clearAllData(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    
    const stores = [
      "homework", "attachments", "schedule", "grades", 
      "events", "family", "gamification", "profile",
      "pending-sync", "metadata", "study-sessions"
    ] as const;
    
    const tx = db.transaction([...stores], "readwrite");
    
    await Promise.all(
      stores.map(store => tx.objectStore(store).clear())
    );
    
    await tx.done;
    log.info("[OfflineStorage] Cleared all data");
  }

  async getStorageStats(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
    available: boolean;
  }> {
    if (!("storage" in navigator && "estimate" in navigator.storage)) {
      return { usage: 0, quota: 0, percentage: 0, available: false };
    }
    
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota 
        ? ((estimate.usage || 0) / estimate.quota) * 100 
        : 0,
      available: true,
    };
  }

  async getRecordCounts(): Promise<Record<string, number>> {
    if (!this.dbPromise) return {};
    const db = await this.dbPromise;
    
    const counts: Record<string, number> = {};
    const stores = [
      "homework", "attachments", "schedule", "grades",
      "events", "family", "pending-sync", "study-sessions"
    ] as const;
    
    for (const store of stores) {
      counts[store] = await db.count(store);
    }
    
    return counts;
  }

  isAvailable(): boolean {
    return typeof window !== "undefined" && "indexedDB" in window;
  }
}

// Export singleton instance
export const offlineStorage = UnifiedOfflineStorage.getInstance();

// Also export class for testing
export { UnifiedOfflineStorage };

// Re-export convenience functions for backwards compatibility
export async function initOfflineDB() {
  return offlineStorage;
}

export async function clearOfflineData() {
  return offlineStorage.clearAllData();
}

export async function getStorageEstimate() {
  return offlineStorage.getStorageStats();
}

export function isOfflineModeAvailable() {
  return offlineStorage.isAvailable();
}
