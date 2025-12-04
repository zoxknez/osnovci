/**
 * Homework Utility Functions
 * Shared helper functions for homework components
 */

export function getDaysUntil(date: Date): string {
  const diff = Math.ceil(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return "Rok prošao";
  if (diff === 0) return "Danas";
  if (diff === 1) return "Sutra";
  return `Za ${diff} dana`;
}

export function isOverdue(dueDate: Date, status: string): boolean {
  return (
    dueDate < new Date() &&
    status !== "done" &&
    status !== "submitted" &&
    status !== "DONE" &&
    status !== "SUBMITTED"
  );
}

export function isUrgent(priority?: string): boolean {
  return priority === "urgent";
}

export function getStatusBadgeVariant(status: string): {
  className: string;
  label: string;
} {
  switch (status.toLowerCase()) {
    case "done":
    case "submitted":
      return {
        className: "bg-green-100 text-green-700",
        label: "Urađeno",
      };
    case "in_progress":
      return {
        className: "bg-blue-100 text-blue-700",
        label: "Radim",
      };
    default:
      return {
        className: "bg-gray-100 text-gray-700",
        label: "Novo",
      };
  }
}

