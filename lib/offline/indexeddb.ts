/**
 * IndexedDB Manager for Offline Storage
 * 
 * Handles:
 * - Homework data caching
 * - Schedule caching
 * - Attachment storage (images, PDFs)
 * - Pending actions queue (for sync when online)
 * - Grades and events caching
 * 
 * Schema Version: 1
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { log } from "@/lib/logger";

// Database schema
interface OfflineDB extends DBSchema {
  homework: {
    key: string;
    value: {
      id: string;
      studentId: string;
      subjectId: string;
      title: string;
      description: string | null;
      dueDate: string;
      priority: string;
      status: string;
      notes: string | null;
      cachedAt: number;
      synced: boolean;
    };
    indexes: { "by-student": string; "by-due-date": string; "by-status": string };
  };
  
  schedule: {
    key: string;
    value: {
      id: string;
      studentId: string;
      dayOfWeek: string;
      subjectId: string;
      startTime: string;
      endTime: string;
      classroom: string | null;
      cachedAt: number;
    };
    indexes: { "by-student": string; "by-day": string };
  };
  
  attachments: {
    key: string;
    value: {
      id: string;
      homeworkId: string;
      type: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      blob: Blob;
      thumbnail: string | null;
      cachedAt: number;
    };
    indexes: { "by-homework": string };
  };
  
  pendingActions: {
    key: number;
    value: {
      id?: number;
      action: "create" | "update" | "delete" | "upload";
      entity: "homework" | "attachment" | "note";
      data: any;
      createdAt: number;
      retries: number;
    };
    indexes: { "by-entity": string };
  };
  
  grades: {
    key: string;
    value: {
      id: string;
      studentId: string;
      subjectId: string;
      value: number;
      type: string;
      description: string | null;
      date: string;
      cachedAt: number;
    };
    indexes: { "by-student": string; "by-subject": string };
  };
  
  events: {
    key: string;
    value: {
      id: string;
      studentId: string;
      title: string;
      description: string | null;
      date: string;
      type: string;
      cachedAt: number;
    };
    indexes: { "by-student": string; "by-date": string };
  };
  
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
  };
}

const DB_NAME = "osnovci-offline";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

/**
 * Initialize database connection
 */
export async function initOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Homework store
        if (!db.objectStoreNames.contains("homework")) {
          const homeworkStore = db.createObjectStore("homework", { keyPath: "id" });
          homeworkStore.createIndex("by-student", "studentId");
          homeworkStore.createIndex("by-due-date", "dueDate");
          homeworkStore.createIndex("by-status", "status");
        }

        // Schedule store
        if (!db.objectStoreNames.contains("schedule")) {
          const scheduleStore = db.createObjectStore("schedule", { keyPath: "id" });
          scheduleStore.createIndex("by-student", "studentId");
          scheduleStore.createIndex("by-day", "dayOfWeek");
        }

        // Attachments store
        if (!db.objectStoreNames.contains("attachments")) {
          const attachmentStore = db.createObjectStore("attachments", { keyPath: "id" });
          attachmentStore.createIndex("by-homework", "homeworkId");
        }

        // Pending actions store (for sync)
        if (!db.objectStoreNames.contains("pendingActions")) {
          const actionsStore = db.createObjectStore("pendingActions", {
            keyPath: "id",
            autoIncrement: true,
          });
          actionsStore.createIndex("by-entity", "entity");
        }

        // Grades store
        if (!db.objectStoreNames.contains("grades")) {
          const gradesStore = db.createObjectStore("grades", { keyPath: "id" });
          gradesStore.createIndex("by-student", "studentId");
          gradesStore.createIndex("by-subject", "subjectId");
        }

        // Events store
        if (!db.objectStoreNames.contains("events")) {
          const eventsStore = db.createObjectStore("events", { keyPath: "id" });
          eventsStore.createIndex("by-student", "studentId");
          eventsStore.createIndex("by-date", "date");
        }

        // Metadata store (for sync timestamps, etc.)
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "key" });
        }

        log.info("[IndexedDB] Database initialized", { version: DB_VERSION });
      },
    });

    return dbInstance;
  } catch (error) {
    log.error("[IndexedDB] Failed to initialize database", error as Error);
    throw error;
  }
}

/**
 * Cache homework data
 */
export async function cacheHomework(homework: any[]): Promise<void> {
  const db = await initOfflineDB();
  const tx = db.transaction("homework", "readwrite");

  for (const hw of homework) {
    await tx.store.put({
      id: hw.id,
      studentId: hw.studentId,
      subjectId: hw.subjectId,
      title: hw.title,
      description: hw.description,
      dueDate: hw.dueDate,
      priority: hw.priority,
      status: hw.status,
      notes: hw.notes,
      cachedAt: Date.now(),
      synced: true,
    });
  }

  await tx.done;
  log.info("[IndexedDB] Cached homework", { count: homework.length });
}

/**
 * Get cached homework
 */
export async function getCachedHomework(studentId: string): Promise<any[]> {
  const db = await initOfflineDB();
  const index = db.transaction("homework").store.index("by-student");
  return await index.getAll(studentId);
}

/**
 * Cache schedule
 */
export async function cacheSchedule(schedule: any[]): Promise<void> {
  const db = await initOfflineDB();
  const tx = db.transaction("schedule", "readwrite");

  for (const entry of schedule) {
    await tx.store.put({
      id: entry.id,
      studentId: entry.studentId,
      dayOfWeek: entry.dayOfWeek,
      subjectId: entry.subjectId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      classroom: entry.classroom,
      cachedAt: Date.now(),
    });
  }

  await tx.done;
  log.info("[IndexedDB] Cached schedule", { count: schedule.length });
}

/**
 * Get cached schedule
 */
export async function getCachedSchedule(studentId: string): Promise<any[]> {
  const db = await initOfflineDB();
  const index = db.transaction("schedule").store.index("by-student");
  return await index.getAll(studentId);
}

/**
 * Cache attachment (image, PDF, etc.)
 */
export async function cacheAttachment(
  id: string,
  homeworkId: string,
  fileName: string,
  blob: Blob,
  metadata: {
    type: string;
    mimeType: string;
    fileSize: number;
    thumbnail?: string;
  }
): Promise<void> {
  const db = await initOfflineDB();

  await db.put("attachments", {
    id,
    homeworkId,
    type: metadata.type,
    fileName,
    fileSize: metadata.fileSize,
    mimeType: metadata.mimeType,
    blob,
    thumbnail: metadata.thumbnail || null,
    cachedAt: Date.now(),
  });

  log.info("[IndexedDB] Cached attachment", { id, fileName, size: metadata.fileSize });
}

/**
 * Get cached attachment
 */
export async function getCachedAttachment(id: string): Promise<Blob | null> {
  const db = await initOfflineDB();
  const attachment = await db.get("attachments", id);
  return attachment?.blob || null;
}

/**
 * Get all attachments for homework
 */
export async function getCachedHomeworkAttachments(homeworkId: string): Promise<any[]> {
  const db = await initOfflineDB();
  const index = db.transaction("attachments").store.index("by-homework");
  return await index.getAll(homeworkId);
}

/**
 * Add pending action for sync
 */
export async function addPendingAction(
  action: "create" | "update" | "delete" | "upload",
  entity: "homework" | "attachment" | "note",
  data: any
): Promise<number> {
  const db = await initOfflineDB();

  const id = await db.add("pendingActions", {
    action,
    entity,
    data,
    createdAt: Date.now(),
    retries: 0,
  });

  log.info("[IndexedDB] Added pending action", { action, entity, id });
  return id;
}

/**
 * Get all pending actions
 */
export async function getPendingActions(): Promise<any[]> {
  const db = await initOfflineDB();
  return await db.getAll("pendingActions");
}

/**
 * Remove pending action after successful sync
 */
export async function removePendingAction(id: number): Promise<void> {
  const db = await initOfflineDB();
  await db.delete("pendingActions", id);
  log.info("[IndexedDB] Removed pending action", { id });
}

/**
 * Increment retry count for failed action
 */
export async function incrementPendingActionRetries(id: number): Promise<void> {
  const db = await initOfflineDB();
  const action = await db.get("pendingActions", id);
  
  if (action) {
    action.retries += 1;
    await db.put("pendingActions", action);
  }
}

/**
 * Cache grades
 */
export async function cacheGrades(grades: any[]): Promise<void> {
  const db = await initOfflineDB();
  const tx = db.transaction("grades", "readwrite");

  for (const grade of grades) {
    await tx.store.put({
      id: grade.id,
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      value: grade.value,
      type: grade.type,
      description: grade.description,
      date: grade.date,
      cachedAt: Date.now(),
    });
  }

  await tx.done;
  log.info("[IndexedDB] Cached grades", { count: grades.length });
}

/**
 * Get cached grades
 */
export async function getCachedGrades(studentId: string): Promise<any[]> {
  const db = await initOfflineDB();
  const index = db.transaction("grades").store.index("by-student");
  return await index.getAll(studentId);
}

/**
 * Cache events
 */
export async function cacheEvents(events: any[]): Promise<void> {
  const db = await initOfflineDB();
  const tx = db.transaction("events", "readwrite");

  for (const event of events) {
    await tx.store.put({
      id: event.id,
      studentId: event.studentId,
      title: event.title,
      description: event.description,
      date: event.date,
      type: event.type,
      cachedAt: Date.now(),
    });
  }

  await tx.done;
  log.info("[IndexedDB] Cached events", { count: events.length });
}

/**
 * Get cached events
 */
export async function getCachedEvents(studentId: string): Promise<any[]> {
  const db = await initOfflineDB();
  const index = db.transaction("events").store.index("by-student");
  return await index.getAll(studentId);
}

/**
 * Set metadata value
 */
export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await initOfflineDB();
  await db.put("metadata", {
    key,
    value,
    updatedAt: Date.now(),
  });
}

/**
 * Get metadata value
 */
export async function getMetadata(key: string): Promise<any | null> {
  const db = await initOfflineDB();
  const record = await db.get("metadata", key);
  return record?.value || null;
}

/**
 * Clear all cached data (for logout, etc.)
 */
export async function clearOfflineData(): Promise<void> {
  const db = await initOfflineDB();
  
  const tx = db.transaction(
    ["homework", "schedule", "attachments", "grades", "events", "metadata"],
    "readwrite"
  );

  await Promise.all([
    tx.objectStore("homework").clear(),
    tx.objectStore("schedule").clear(),
    tx.objectStore("attachments").clear(),
    tx.objectStore("grades").clear(),
    tx.objectStore("events").clear(),
    tx.objectStore("metadata").clear(),
  ]);

  await tx.done;
  log.info("[IndexedDB] Cleared all offline data");
}

/**
 * Get database storage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentUsed };
  }

  return { usage: 0, quota: 0, percentUsed: 0 };
}

/**
 * Check if offline mode is available
 */
export function isOfflineModeAvailable(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}
