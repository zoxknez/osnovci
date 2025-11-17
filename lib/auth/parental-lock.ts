// Parental Lock - PIN protection for sensitive actions

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

const DEFAULT_ACTIONS_REQUIRING_APPROVAL = [
  "delete_homework",
  "change_password",
  "remove_parent",
  "delete_account",
  "change_email",
];

/**
 * Check if action requires parental approval
 */
export async function requiresParentalApproval(
  _studentId: string,
  action: string,
): Promise<boolean> {
  // Use default list of actions requiring parental approval
  // Can be extended to store custom actions per student in database
  return DEFAULT_ACTIONS_REQUIRING_APPROVAL.includes(action);
}

/**
 * Verify parent PIN code - NOW WITH SECURE DATABASE HASH!
 */
export async function verifyParentPIN(
  pin: string,
  guardianId: string,
): Promise<boolean> {
  try {
    // Get guardian with PIN hash from database
    const guardian = await prisma.guardian.findUnique({
      where: { id: guardianId },
      select: { pinHash: true },
    });

    if (!guardian?.pinHash) {
      log.warn("Guardian has no PIN set", { guardianId });
      return false;
    }

    // Compare with bcrypt
    const isValid = await bcrypt.compare(pin, guardian.pinHash);

    if (isValid) {
      log.info("Parent PIN verified successfully", { guardianId });
    } else {
      log.warn("Parent PIN verification failed - incorrect PIN", {
        guardianId,
      });
    }

    return isValid;
  } catch (error) {
    log.error("Parent PIN verification error", { error, guardianId });
    return false;
  }
}

/**
 * Set or update parent PIN
 */
export async function setParentPIN(
  guardianId: string,
  newPin: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(newPin)) {
      return {
        success: false,
        error: "PIN mora biti 4-6 cifara",
      };
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(newPin, 12);

    // Update guardian
    await prisma.guardian.update({
      where: { id: guardianId },
      data: { pinHash },
    });

    log.info("Parent PIN set successfully", { guardianId });

    return { success: true };
  } catch (error) {
    log.error("Failed to set parent PIN", { error, guardianId });
    return {
      success: false,
      error: "Greška pri postavljanju PIN-a",
    };
  }
}

/**
 * Check if guardian has PIN set
 */
export async function hasParentPIN(guardianId: string): Promise<boolean> {
  try {
    const guardian = await prisma.guardian.findUnique({
      where: { id: guardianId },
      select: { pinHash: true },
    });

    return guardian?.pinHash !== null && guardian?.pinHash !== undefined;
  } catch (error) {
    log.error("Failed to check parent PIN", { error, guardianId });
    return false;
  }
}

/**
 * Request parental approval (shows PIN dialog)
 */
export interface ParentalApprovalRequest {
  action: string;
  description: string;
  studentId: string;
}

export function createApprovalRequest(
  request: ParentalApprovalRequest,
): ParentalApprovalRequest {
  log.info("Parental approval requested", request);
  return request;
}
