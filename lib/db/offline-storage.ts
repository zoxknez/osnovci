// Modern IndexedDB wrapper sa TypeScript
import { type DBSchema, type IDBPDatabase, openDB } from "idb";

// Database schema
interface OsnovciDB extends DBSchema {
  homework: {
    key: string;
    value: {
      id: string;
      studentId: string;
      subjectId: string;
      subjectName?: string;
      subjectColor?: string;
      title: string;
      description?: string;
      dueDate: string;
      priority: "NORMAL" | "IMPORTANT" | "URGENT";
      status: "ASSIGNED" | "IN_PROGRESS" | "DONE" | "SUBMITTED";
      createdAt: string;
      updatedAt: string;
      synced: boolean;
    };
    indexes: {
      "by-status": string;
      "by-due-date": string;
      "by-synced": number;
    };
  };
  attachments: {
    key: string;
    value: {
      id: string;
      homeworkId: string;
      file: Blob;
      fileName: string;
      mimeType: string;
      size: number;
      localUri: string;
      uploadedAt: string;
      synced: boolean;
    };
    indexes: { "by-homework": string; "by-synced": number };
  };
  schedule: {
    key: string;
    value: {
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      subject: { id: string; name: string; color: string; icon: string | null };
      classroom: string | null;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    };
    indexes: { "by-day": string };
  };
  grades: {
    key: string;
    value: {
      id: string;
      grade: number;
      subjectId: string;
      subjectName: string;
      subjectColor: string;
      category: string;
      description?: string;
      date: string;
      createdAt: string;
    };
    indexes: { "by-subject": string; "by-date": string };
  };
  family: {
    key: string;
    value: {
      id: string;
      name: string;
      role: string;
      relation: string;
      permissions: string[];
      linkedAt: string;
    };
  };
  gamification: {
    key: string;
    value: {
      id: string;
      data: StoredGamificationData;
      updatedAt: string;
    };
  };
  "pending-sync": {
    key: string;
    value: {
      id: string;
      type: "CREATE" | "UPDATE" | "DELETE";
      entity: "homework" | "attachment";
      data: any;
      timestamp: string;
      retries: number;
    };
    indexes: { "by-timestamp": string };
  };
  profile: {
    key: string;
    value: {
      id: string;
      data: any;
      updatedAt: string;
    };
  };
}

export type StoredHomework = OsnovciDB["homework"]["value"];
export type StoredAttachment = OsnovciDB["attachments"]["value"];
export type StoredSchedule = OsnovciDB["schedule"]["value"];
export type StoredGrade = OsnovciDB["grades"]["value"];
export type StoredFamilyMember = OsnovciDB["family"]["value"];
export type StoredSyncItem = OsnovciDB["pending-sync"]["value"];

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

class OfflineStorage {
  private dbPromise: Promise<IDBPDatabase<OsnovciDB>> | null = null;

  constructor() {
    // Only initialize IndexedDB on client-side
    if (typeof window !== "undefined") {
      this.dbPromise = this.initDB();
    }
  }

  private async initDB(): Promise<IDBPDatabase<OsnovciDB>> {
    return openDB<OsnovciDB>("osnovci-db", 2, {
      upgrade(db) {
        // Homework store
        if (!db.objectStoreNames.contains("homework")) {
          const homeworkStore = db.createObjectStore("homework", {
            keyPath: "id",
          });
          homeworkStore.createIndex("by-status", "status");
          homeworkStore.createIndex("by-due-date", "dueDate");
          homeworkStore.createIndex("by-synced", "synced");
        }

        // Attachments store
        if (!db.objectStoreNames.contains("attachments")) {
          const attachmentStore = db.createObjectStore("attachments", {
            keyPath: "id",
          });
          attachmentStore.createIndex("by-homework", "homeworkId");
          attachmentStore.createIndex("by-synced", "synced");
        }

        // Schedule store
        if (!db.objectStoreNames.contains("schedule")) {
          const scheduleStore = db.createObjectStore("schedule", {
            keyPath: "id",
          });
          scheduleStore.createIndex("by-day", "dayOfWeek");
        }

        // Grades store
        if (!db.objectStoreNames.contains("grades")) {
          const gradesStore = db.createObjectStore("grades", {
            keyPath: "id",
          });
          gradesStore.createIndex("by-subject", "subjectId");
          gradesStore.createIndex("by-date", "date");
        }

        // Family store
        if (!db.objectStoreNames.contains("family")) {
          db.createObjectStore("family", {
            keyPath: "id",
          });
        }

        // Gamification store
        if (!db.objectStoreNames.contains("gamification")) {
          db.createObjectStore("gamification", {
            keyPath: "id",
          });
        }

        // Pending sync queue
        if (!db.objectStoreNames.contains("pending-sync")) {
          const syncStore = db.createObjectStore("pending-sync", {
            keyPath: "id",
          });
          syncStore.createIndex("by-timestamp", "timestamp");
        }

        // Profile store
        if (!db.objectStoreNames.contains("profile")) {
          db.createObjectStore("profile", {
            keyPath: "id",
          });
        }
      },
    });
  }

  // ========================================
  // HOMEWORK OPERATIONS
  // ========================================

  async saveHomework(homework: StoredHomework): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("homework", homework);
  }

  async getHomework(id: string): Promise<StoredHomework | undefined> {
    if (!this.dbPromise) return undefined;
    const db = await this.dbPromise;
    return db.get("homework", id);
  }

  async getAllHomework(): Promise<StoredHomework[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll("homework");
  }

  async getHomeworkByStatus(status: string): Promise<StoredHomework[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("homework", "by-status", status);
  }

  async deleteHomework(id: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete("homework", id);
  }

  // ========================================
  // ATTACHMENT OPERATIONS
  // ========================================

  async saveAttachment(attachment: StoredAttachment): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("attachments", attachment);
  }

  async getAttachment(id: string): Promise<StoredAttachment | undefined> {
    if (!this.dbPromise) return undefined;
    const db = await this.dbPromise;
    return db.get("attachments", id);
  }

  async getAttachmentsByHomework(
    homeworkId: string,
  ): Promise<StoredAttachment[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("attachments", "by-homework", homeworkId);
  }

  async deleteAttachment(id: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete("attachments", id);
  }

  // ========================================
  // SCHEDULE OPERATIONS
  // ========================================

  async saveSchedule(schedule: StoredSchedule[]): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const tx = db.transaction("schedule", "readwrite");
    const store = tx.objectStore("schedule");

    // Clear existing schedule first as we usually fetch the whole week
    await store.clear();

    for (const item of schedule) {
      await store.put(item);
    }

    await tx.done;
  }

  async getSchedule(): Promise<StoredSchedule[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll("schedule");
  }

  async getScheduleByDay(day: string): Promise<StoredSchedule[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("schedule", "by-day", day);
  }

  // ========================================
  // GRADES OPERATIONS
  // ========================================

  async saveGrades(grades: StoredGrade[]): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const tx = db.transaction("grades", "readwrite");
    const store = tx.objectStore("grades");

    // Clear existing grades first
    await store.clear();

    for (const item of grades) {
      await store.put(item);
    }

    await tx.done;
  }

  async getGrades(): Promise<StoredGrade[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll("grades");
  }

  // ========================================
  // FAMILY OPERATIONS
  // ========================================

  async saveFamilyMembers(members: StoredFamilyMember[]): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const tx = db.transaction("family", "readwrite");
    const store = tx.objectStore("family");

    await store.clear();
    for (const member of members) {
      await store.put(member);
    }
    await tx.done;
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
  }

  async getGamificationData(): Promise<StoredGamificationData | null> {
    if (!this.dbPromise) return null;
    const db = await this.dbPromise;
    const result = await db.get("gamification", "current");
    return result ? result.data : null;
  }

  // ========================================
  // PROFILE OPERATIONS
  // ========================================

  async saveProfile(data: any): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("profile", {
      id: "current",
      data,
      updatedAt: new Date().toISOString(),
    });
  }

  async getProfile(): Promise<any | null> {
    if (!this.dbPromise) return null;
    const db = await this.dbPromise;
    const result = await db.get("profile", "current");
    return result ? result.data : null;
  }

  // ========================================
  // SYNC OPERATIONS
  // ========================================

  async addToSyncQueue(item: StoredSyncItem): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("pending-sync", item);
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
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.clear("pending-sync");
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

  async clearAll(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.clear("homework");
    await db.clear("attachments");
    await db.clear("pending-sync");
  }

  async getStorageSize(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
  }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota
          ? ((estimate.usage || 0) / estimate.quota) * 100
          : 0,
      };
    }
    return { usage: 0, quota: 0, percentage: 0 };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();
