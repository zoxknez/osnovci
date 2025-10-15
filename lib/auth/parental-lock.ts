// Parental Lock - PIN protection for sensitive actions
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
  studentId: string,
  action: string,
): Promise<boolean> {
  // For now, use default list
  // TODO: Store in database per student
  return DEFAULT_ACTIONS_REQUIRING_APPROVAL.includes(action);
}

/**
 * Verify parent PIN code
 * For now, simple 4-digit PIN
 * TODO: Store hashed PIN in database
 */
export function verifyParentPIN(pin: string, studentId: string): boolean {
  // Default PIN for demo: 1234
  // TODO: Get from database and compare hashed
  const defaultPIN = "1234";

  if (pin === defaultPIN) {
    log.info("Parent PIN verified", { studentId });
    return true;
  }

  log.warn("Parent PIN verification failed", { studentId });
  return false;
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

