// Global TypeScript types za celu aplikaciju

// ============================================
// ENUM TYPES (from Prisma schema)
// ============================================

export enum UserRole {
  STUDENT = "STUDENT",
  GUARDIAN = "GUARDIAN",
}

export enum Language {
  SR_LATN = "SR_LATN",
  SR_CYRL = "SR_CYRL",
  EN = "EN",
}

export enum Theme {
  LIGHT = "LIGHT",
  DARK = "DARK",
  AUTO = "AUTO",
}

export enum Priority {
  NORMAL = "NORMAL",
  IMPORTANT = "IMPORTANT",
  URGENT = "URGENT",
}

export enum HomeworkStatus {
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  SUBMITTED = "SUBMITTED",
}

export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export enum EventType {
  EXAM = "EXAM",
  TEST = "TEST",
  PROJECT = "PROJECT",
  FIELD_TRIP = "FIELD_TRIP",
  PARENT_MEETING = "PARENT_MEETING",
  OTHER = "OTHER",
}

export enum AttachmentType {
  IMAGE = "IMAGE",
  PDF = "PDF",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
  OTHER = "OTHER",
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  locale: Language;
  theme: Theme;
  createdAt: Date;
  student?: Student;
  guardian?: Guardian;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  school: string;
  grade: number;
  class: string;
  avatar?: string;
}

export interface Guardian {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
}

// ============================================
// HOMEWORK TYPES
// ============================================

export interface Homework {
  id: string;
  studentId: string;
  subjectId: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: Priority;
  status: HomeworkStatus;
  notes?: string;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  subject?: Subject;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  homeworkId: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  localUri?: string;
  remoteUrl?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  uploadedAt: Date;
  syncedAt?: Date;
}

// ============================================
// SUBJECT & SCHEDULE TYPES
// ============================================

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface ScheduleEntry {
  id: string;
  studentId: string;
  subjectId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  isAWeek: boolean;
  isBWeek: boolean;
  subject?: Subject;
}

export interface Event {
  id: string;
  studentId: string;
  type: EventType;
  title: string;
  description?: string;
  dateTime: Date;
  location?: string;
  notes?: string;
  notifyAt?: Date;
}

// ============================================
// LINK (Family connection)
// ============================================

export interface Link {
  id: string;
  guardianId: string;
  studentId: string;
  linkCode: string;
  isActive: boolean;
  permissions?: Record<string, boolean>;
  createdAt: Date;
  guardian?: Guardian;
  student?: Student;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface WeeklyReport {
  id: string;
  studentId: string;
  weekStart: Date;
  weekEnd: Date;
  totalHomework: number;
  completedHomework: number;
  lateHomework: number;
  subjectBreakdown: Record<string, { total: number; completed: number }>;
  generatedAt: Date;
}

// ============================================
// UI/FORM TYPES
// ============================================

export interface HomeworkFormData {
  subjectId: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: Priority;
}

export interface LinkCodeData {
  code: string;
  expiresAt: Date;
}

export interface FilterOptions {
  subjects?: string[];
  statuses?: HomeworkStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// SYNC & OFFLINE TYPES
// ============================================

export interface SyncQueueItem {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  entity: "homework" | "attachment" | "schedule" | "event";
  data: Record<string, unknown>;
  timestamp: Date;
  retries: number;
}

export interface OfflineState {
  isOnline: boolean;
  pendingSync: SyncQueueItem[];
  lastSyncAt?: Date;
}
