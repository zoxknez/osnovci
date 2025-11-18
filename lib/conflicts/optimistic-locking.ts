/**
 * Optimistic Locking for Offline Conflict Resolution
 *
 * Detects and resolves conflicts when multiple clients edit the same entity.
 * Uses version field on entities to track concurrent modifications.
 *
 * Features:
 * - Version conflict detection
 * - Deep field-level diff generation
 * - Multiple merge strategies (client wins, server wins, manual, smart merge)
 * - Conflict reporting with human-readable descriptions
 * - Retry logic with version update
 *
 * @module lib/conflicts/optimistic-locking
 */

import { log } from "@/lib/logger";
import { prisma } from "@/lib/db/prisma";

// ============================================
// Types & Interfaces
// ============================================

export type ConflictStrategy =
  | "CLIENT_WINS" // Use client data, increment version
  | "SERVER_WINS" // Discard client changes, use server data
  | "MANUAL" // Let user manually resolve
  | "SMART_MERGE"; // Automatically merge non-conflicting changes

export type ModelType = "homework" | "grade" | "scheduleEntry";

export interface VersionConflictError {
  type: "VERSION_CONFLICT";
  message: string;
  clientVersion: number;
  serverVersion: number;
  modelType: ModelType;
  modelId: string;
  diff: FieldDiff[];
  timestamp: Date;
}

export interface FieldDiff {
  field: string;
  clientValue: unknown;
  serverValue: unknown;
  isConflict: boolean; // True if both changed the same field differently
  description: string; // Human-readable description
}

export interface ConflictResolution {
  strategy: ConflictStrategy;
  resolvedData: Record<string, unknown>;
  newVersion: number;
  mergedFields: string[]; // Fields that were merged automatically
  conflictedFields: string[]; // Fields that need manual resolution
}

// ============================================
// Version Checking
// ============================================

/**
 * Check if entity version matches expected version
 * @throws VersionConflictError if versions don't match
 */
export async function checkVersion(
  modelType: ModelType,
  id: string,
  expectedVersion: number
): Promise<{ version: number; data: Record<string, unknown> }> {
  let currentEntity: { version: number; [key: string]: unknown } | null = null;

  try {
    switch (modelType) {
      case "homework":
        currentEntity = await prisma.homework.findUnique({
          where: { id },
          include: {
            attachments: true,
            student: {
              select: {
                name: true,
              },
            },
            subject: {
              select: {
                name: true,
              },
            },
          },
        });
        break;

      case "grade":
        currentEntity = await prisma.grade.findUnique({
          where: { id },
          include: {
            student: {
              select: {
                name: true,
              },
            },
            subject: {
              select: {
                name: true,
              },
            },
          },
        });
        break;

      case "scheduleEntry":
        currentEntity = await prisma.scheduleEntry.findUnique({
          where: { id },
          include: {
            student: {
              select: {
                name: true,
              },
            },
            subject: {
              select: {
                name: true,
              },
            },
          },
        });
        break;
    }

    if (!currentEntity) {
      throw new Error(`${modelType} with id ${id} not found`);
    }

    if (currentEntity.version !== expectedVersion) {
      log.warn("Version conflict detected", {
        modelType,
        id,
        expectedVersion,
        currentVersion: currentEntity.version,
      });

      throw {
        type: "VERSION_CONFLICT",
        message: `Version conflict: expected ${expectedVersion}, got ${currentEntity.version}`,
        clientVersion: expectedVersion,
        serverVersion: currentEntity.version,
        modelType,
        modelId: id,
        timestamp: new Date(),
      } as VersionConflictError;
    }

    return {
      version: currentEntity.version,
      data: currentEntity as Record<string, unknown>,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "VERSION_CONFLICT"
    ) {
      throw error; // Re-throw version conflicts
    }

    log.error("Error checking version", error as Error, {
      modelType,
      id,
      expectedVersion,
    });
    throw error;
  }
}

// ============================================
// Conflict Detection
// ============================================

/**
 * Deep comparison of client and server data
 * Generates field-level diff with conflict detection
 */
export function detectConflict(
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  baseData?: Record<string, unknown> // Original data before edits (if available)
): FieldDiff[] {
  const diffs: FieldDiff[] = [];

  // Fields to exclude from conflict detection
  const excludeFields = [
    "id",
    "createdAt",
    "updatedAt",
    "version",
    "student",
    "subject",
    "guardian",
    "attachments",
  ];

  // Get all unique field names from both objects
  const allFields = new Set([
    ...Object.keys(clientData),
    ...Object.keys(serverData),
  ]);

  for (const field of allFields) {
    if (excludeFields.includes(field)) continue;

    const clientValue = clientData[field];
    const serverValue = serverData[field];
    const baseValue = baseData?.[field];

    // Check if field was changed
    const clientChanged = baseData
      ? !deepEqual(clientValue, baseValue)
      : !deepEqual(clientValue, serverValue);
    const serverChanged = baseData
      ? !deepEqual(serverValue, baseValue)
      : !deepEqual(serverValue, clientValue);

    // Conflict occurs when both changed the same field differently
    const isConflict =
      clientChanged &&
      serverChanged &&
      !deepEqual(clientValue, serverValue);

    if (clientChanged || serverChanged) {
      diffs.push({
        field,
        clientValue,
        serverValue,
        isConflict,
        description: generateDiffDescription(
          field,
          clientValue,
          serverValue,
          isConflict
        ),
      });
    }
  }

  return diffs;
}

/**
 * Generate human-readable description of field change
 */
function generateDiffDescription(
  field: string,
  clientValue: unknown,
  serverValue: unknown,
  isConflict: boolean
): string {
  const fieldLabels: Record<string, string> = {
    title: "Naslov",
    description: "Opis",
    dueDate: "Rok",
    priority: "Prioritet",
    status: "Status",
    notes: "Beleške",
    reviewNote: "Napomena roditelja",
    grade: "Ocena",
    category: "Kategorija",
    date: "Datum",
    weight: "Ponder",
    dayOfWeek: "Dan u nedelji",
    startTime: "Početak",
    endTime: "Kraj",
    room: "Učionica",
    isAWeek: "A smena",
    isBWeek: "B smena",
  };

  const label = fieldLabels[field] || field;

  if (isConflict) {
    return `⚠️ KONFLIKT - ${label}: Vi (${formatValue(clientValue)}) | Server (${formatValue(serverValue)})`;
  }

  if (!deepEqual(clientValue, serverValue)) {
    return `${label}: ${formatValue(clientValue)} → ${formatValue(serverValue)}`;
  }

  return `${label}: ${formatValue(clientValue)}`;
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "prazno";
  }

  if (value instanceof Date) {
    return new Date(value).toLocaleDateString("sr-Latn-RS");
  }

  if (typeof value === "boolean") {
    return value ? "Da" : "Ne";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  // Object comparison
  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

// ============================================
// Conflict Resolution
// ============================================

/**
 * Resolve conflict using specified strategy
 */
export async function resolveConflict(
  strategy: ConflictStrategy,
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  diff: FieldDiff[]
): Promise<ConflictResolution> {
  const conflictedFields = diff
    .filter((d) => d.isConflict)
    .map((d) => d.field);
  const mergedFields: string[] = [];

  let resolvedData: Record<string, unknown> = {};

  switch (strategy) {
    case "CLIENT_WINS":
      // Use all client data
      resolvedData = { ...clientData };
      mergedFields.push(...diff.map((d) => d.field));
      log.info("Conflict resolved: CLIENT_WINS", {
        fields: diff.map((d) => d.field),
      });
      break;

    case "SERVER_WINS":
      // Use all server data
      resolvedData = { ...serverData };
      mergedFields.push(...diff.map((d) => d.field));
      log.info("Conflict resolved: SERVER_WINS", {
        fields: diff.map((d) => d.field),
      });
      break;

    case "SMART_MERGE":
      // Merge non-conflicting changes, prefer server for conflicts
      resolvedData = { ...serverData }; // Start with server data

      for (const fieldDiff of diff) {
        if (!fieldDiff.isConflict) {
          // No conflict, use client value if changed
          if (!deepEqual(fieldDiff.clientValue, fieldDiff.serverValue)) {
            resolvedData[fieldDiff.field] = fieldDiff.clientValue;
            mergedFields.push(fieldDiff.field);
          }
        }
        // For conflicts, keep server value (already in resolvedData)
      }

      log.info("Conflict resolved: SMART_MERGE", {
        mergedFields,
        conflictedFields,
      });
      break;

    case "MANUAL":
      // Return empty resolution, UI will handle manual selection
      resolvedData = {};
      log.info("Conflict resolution: MANUAL", {
        conflictedFields,
      });
      break;
  }

  return {
    strategy,
    resolvedData,
    newVersion: (serverData['version'] as number) + 1,
    mergedFields,
    conflictedFields,
  };
}

// ============================================
// Update with Version Check
// ============================================

/**
 * Update entity with optimistic locking
 * Automatically retries with conflict resolution on version mismatch
 */
export async function updateWithVersionCheck(
  modelType: ModelType,
  id: string,
  data: Record<string, unknown>,
  expectedVersion: number,
  retryStrategy: ConflictStrategy = "SMART_MERGE",
  maxRetries = 3
): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  conflict?: VersionConflictError;
  resolution?: ConflictResolution;
}> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Check version
      const { version } = await checkVersion(
        modelType,
        id,
        expectedVersion
      );

      // Version matches, perform update
      const updateData = {
        ...data,
        version: version + 1, // Increment version
        updatedAt: new Date(),
      };

      let updatedEntity: Record<string, unknown> | null = null;

      switch (modelType) {
        case "homework":
          updatedEntity = await prisma.homework.update({
            where: { id },
            data: updateData,
          });
          break;

        case "grade":
          updatedEntity = await prisma.grade.update({
            where: { id },
            data: updateData,
          });
          break;

        case "scheduleEntry":
          updatedEntity = await prisma.scheduleEntry.update({
            where: { id },
            data: updateData,
          });
          break;
      }

      log.info("Update successful with version check", {
        modelType,
        id,
        version: version + 1,
      });

      return {
        success: true,
        data: updatedEntity as Record<string, unknown>,
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        error.type === "VERSION_CONFLICT"
      ) {
        const conflictError = error as VersionConflictError;

        log.warn("Version conflict, attempting resolution", {
          modelType,
          id,
          attempt: retries + 1,
          strategy: retryStrategy,
        });

        // Get fresh server data
        const { data: serverData } = await checkVersion(
          modelType,
          id,
          conflictError.serverVersion
        );

        // Detect conflicts
        const diff = detectConflict(data, serverData);
        conflictError.diff = diff;

        // If manual resolution required, return conflict
        if (retryStrategy === "MANUAL") {
          return {
            success: false,
            conflict: conflictError,
          };
        }

        // Attempt automatic resolution
        const resolution = await resolveConflict(
          retryStrategy,
          data,
          serverData,
          diff
        );

        // Retry with resolved data
        expectedVersion = conflictError.serverVersion;
        data = resolution.resolvedData;
        retries++;

        if (retries >= maxRetries) {
          // Max retries reached, return conflict for manual resolution
          log.error("Max retries reached, manual resolution required", {
            modelType,
            id,
            retries,
          });

          return {
            success: false,
            conflict: conflictError,
            resolution,
          };
        }

        continue; // Retry with new data
      }

      // Other error, throw
      log.error("Update failed", error as Error, {
        modelType,
        id,
      });
      throw error;
    }
  }

  return {
    success: false,
  };
}

// ============================================
// Conflict Reporting
// ============================================

/**
 * Generate human-readable conflict report
 */
export function generateConflictReport(
  conflict: VersionConflictError
): string {
  const lines: string[] = [];

  lines.push(`⚠️ KONFLIKT PROMENA`);
  lines.push(``);
  lines.push(`Tip: ${conflict.modelType}`);
  lines.push(`ID: ${conflict.modelId}`);
  lines.push(`Vaša verzija: ${conflict.clientVersion}`);
  lines.push(`Verzija na serveru: ${conflict.serverVersion}`);
  lines.push(`Vreme: ${conflict.timestamp.toLocaleString("sr-Latn-RS")}`);
  lines.push(``);

  const conflicts = conflict.diff.filter((d) => d.isConflict);
  const changes = conflict.diff.filter((d) => !d.isConflict);

  if (conflicts.length > 0) {
    lines.push(`POLJA SA KONFLIKTOM (${conflicts.length}):`);
    for (const diff of conflicts) {
      lines.push(`  ${diff.description}`);
    }
    lines.push(``);
  }

  if (changes.length > 0) {
    lines.push(`DRUGE PROMENE (${changes.length}):`);
    for (const diff of changes) {
      lines.push(`  ${diff.description}`);
    }
  }

  return lines.join("\n");
}

/**
 * Create conflict summary for UI display
 */
export function getConflictSummary(conflict: VersionConflictError): {
  totalFields: number;
  conflictedFields: number;
  changedFields: number;
  severity: "low" | "medium" | "high";
} {
  const conflictedFields = conflict.diff.filter((d) => d.isConflict).length;
  const changedFields = conflict.diff.filter((d) => !d.isConflict).length;
  const totalFields = conflict.diff.length;

  let severity: "low" | "medium" | "high" = "low";

  if (conflictedFields === 0) {
    severity = "low"; // No conflicts, just concurrent changes
  } else if (conflictedFields <= 2) {
    severity = "medium"; // Few conflicts
  } else {
    severity = "high"; // Many conflicts
  }

  return {
    totalFields,
    conflictedFields,
    changedFields,
    severity,
  };
}
