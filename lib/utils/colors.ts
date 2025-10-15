// Color utilities za predmete i UI
export const subjectColors = {
  matematika: "#3b82f6", // blue
  srpski: "#ef4444", // red
  engleski: "#10b981", // green
  fizika: "#8b5cf6", // purple
  hemija: "#f59e0b", // amber
  biologija: "#14b8a6", // teal
  istorija: "#f97316", // orange
  geografija: "#06b6d4", // cyan
  fizicko: "#ec4899", // pink
  muzicko: "#a855f7", // purple
  likovno: "#fb923c", // orange
  informatika: "#6366f1", // indigo
  default: "#64748b", // slate
} as const;

export function getSubjectColor(subjectName: string): string {
  const normalized = subjectName.toLowerCase().trim();
  return (
    subjectColors[normalized as keyof typeof subjectColors] ??
    subjectColors.default
  );
}

export function getPriorityColor(
  priority: "NORMAL" | "IMPORTANT" | "URGENT",
): string {
  switch (priority) {
    case "URGENT":
      return "text-red-600 bg-red-50 border-red-200";
    case "IMPORTANT":
      return "text-orange-600 bg-orange-50 border-orange-200";
    default:
      return "text-blue-600 bg-blue-50 border-blue-200";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "ASSIGNED":
      return "text-gray-600 bg-gray-50";
    case "IN_PROGRESS":
      return "text-blue-600 bg-blue-50";
    case "DONE":
      return "text-green-600 bg-green-50";
    case "SUBMITTED":
      return "text-purple-600 bg-purple-50";
    case "REVIEWED":
      return "text-emerald-600 bg-emerald-50";
    case "REVISION":
      return "text-orange-600 bg-orange-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}
