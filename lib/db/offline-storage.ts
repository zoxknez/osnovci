// Modern IndexedDB wrapper sa TypeScript
import { openDB, DBSchema, IDBPDatabase } from "idb";

// Database schema
interface OsnovciDB extends DBSchema {
  homework: {
    key: string;
    value: {
      id: string;
      studentId: string;
      subjectId: string;
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
    return openDB<OsnovciDB>("osnovci-db", 1, {
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

        // Pending sync queue
        if (!db.objectStoreNames.contains("pending-sync")) {
          const syncStore = db.createObjectStore("pending-sync", {
            keyPath: "id",
          });
          syncStore.createIndex("by-timestamp", "timestamp");
        }
      },
    });
  }

  // ========================================
  // HOMEWORK OPERATIONS
  // ========================================

  async saveHomework(homework: OsnovciDB["homework"]["value"]) {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("homework", homework);
  }

  async getHomework(id: string) {
    if (!this.dbPromise) return undefined;
    const db = await this.dbPromise;
    return db.get("homework", id);
  }

  async getAllHomework() {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll("homework");
  }

  async getHomeworkByStatus(status: string) {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("homework", "by-status", status);
  }

  async deleteHomework(id: string) {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete("homework", id);
  }

  // ========================================
  // ATTACHMENT OPERATIONS
  // ========================================

  async saveAttachment(attachment: OsnovciDB["attachments"]["value"]) {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("attachments", attachment);
  }

  async getAttachment(id: string) {
    if (!this.dbPromise) return undefined;
    const db = await this.dbPromise;
    return db.get("attachments", id);
  }

  async getAttachmentsByHomework(homeworkId: string) {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAllFromIndex("attachments", "by-homework", homeworkId);
  }

  async deleteAttachment(id: string) {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete("attachments", id);
  }

  // ========================================
  // SYNC OPERATIONS
  // ========================================

  async addToSyncQueue(item: OsnovciDB["pending-sync"]["value"]) {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put("pending-sync", item);
  }

  async getSyncQueue() {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll("pending-sync");
  }

  async removeSyncItem(id: string) {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete("pending-sync", id);
  }

  async clearSyncQueue() {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.clear("pending-sync");
  }

  // ========================================
  // UTILITY OPERATIONS
  // ========================================

  async getUnsyncedItems() {
    if (!this.dbPromise) return { homework: [], attachments: [] };
    const db = await this.dbPromise;
    const homework = await db.getAllFromIndex("homework", "by-synced", 0);
    const attachments = await db.getAllFromIndex("attachments", "by-synced", 0);
    return { homework, attachments };
  }

  async clearAll() {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.clear("homework");
    await db.clear("attachments");
    await db.clear("pending-sync");
  }

  async getStorageSize() {
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
