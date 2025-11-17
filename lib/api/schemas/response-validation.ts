/**
 * API Response Validation Schemas
 * Validates OUTPUT from API routes to ensure type safety
 * 
 * Prevents runtime errors from:
 * - Unexpected null values
 * - Missing fields
 * - Wrong data types
 * - Malformed database responses
 */

import { z } from 'zod';

// ============================================
// HOMEWORK RESPONSE SCHEMAS
// ============================================

export const HomeworkSubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

export const HomeworkResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  subject: HomeworkSubjectSchema,
  dueDate: z.coerce.date(),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']),
  status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'DONE', 'SUBMITTED', 'REVIEWED', 'REVISION']),
  attachmentsCount: z.number().int().nonnegative(),
  notes: z.string().nullable().optional(),
  reviewNote: z.string().nullable().optional(),
  reviewedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const HomeworkDetailResponseSchema = HomeworkResponseSchema.extend({
  attachments: z.array(z.object({
    id: z.string(),
    type: z.enum(['IMAGE', 'VIDEO', 'PDF', 'AUDIO']),
    fileName: z.string(),
    fileSize: z.number().int().positive(),
    mimeType: z.string(),
    remoteUrl: z.string().url().nullable(),
    thumbnail: z.string().url().nullable(),
    uploadedAt: z.coerce.date(),
  })).optional(),
});

export const HomeworkListResponseSchema = z.array(HomeworkResponseSchema);

// ============================================
// SUBJECT RESPONSE SCHEMAS
// ============================================

export const SubjectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  icon: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const SubjectListResponseSchema = z.array(SubjectResponseSchema);

// ============================================
// GRADE RESPONSE SCHEMAS
// ============================================

export const GradeResponseSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  subject: HomeworkSubjectSchema,
  grade: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  date: z.coerce.date(),
  weight: z.number().int().min(1).max(3),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const GradeListResponseSchema = z.array(GradeResponseSchema);

// ============================================
// SCHEDULE RESPONSE SCHEMAS
// ============================================

export const ScheduleEntryResponseSchema = z.object({
  id: z.string(),
  subject: HomeworkSubjectSchema,
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  room: z.string().nullable(),
  notes: z.string().nullable(),
  isAWeek: z.boolean(),
  isBWeek: z.boolean(),
});

export const ScheduleListResponseSchema = z.array(ScheduleEntryResponseSchema);

// ============================================
// EVENT RESPONSE SCHEMAS
// ============================================

export const EventResponseSchema = z.object({
  id: z.string(),
  type: z.enum(['EXAM', 'MEETING', 'TRIP', 'COMPETITION', 'OTHER']),
  title: z.string(),
  description: z.string().nullable(),
  dateTime: z.coerce.date(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  notifyAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const EventListResponseSchema = z.array(EventResponseSchema);

// ============================================
// GAMIFICATION RESPONSE SCHEMAS
// ============================================

export const AchievementResponseSchema = z.object({
  id: z.string(),
  type: z.enum([
    'HOMEWORK_MILESTONE',
    'STREAK_MILESTONE',
    'LEVEL_MILESTONE',
    'PERFECT_WEEK',
    'EARLY_BIRD',
    'SUBJECT_MASTER',
    'SPEED_DEMON',
    'NIGHT_OWL',
    'WEEKEND_WARRIOR',
    'COMEBACK_KID',
    'PERFECTIONIST',
    'HELPER',
    'CONSISTENT',
    'EXPLORER',
    'OVERACHIEVER',
    'SOCIAL_BUTTERFLY',
    'COLLECTOR',
  ]),
  title: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  xpReward: z.number().int().nonnegative(),
  rarity: z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']),
  progress: z.number().int().nonnegative().nullable().optional(),
  target: z.number().int().positive().nullable().optional(),
  isHidden: z.boolean(),
  unlockedAt: z.coerce.date(),
});

export const GamificationResponseSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  level: z.number().int().positive(),
  xp: z.number().int().nonnegative(),
  totalXPEarned: z.number().int().nonnegative(),
  totalHomeworkDone: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  weeklyXP: z.number().int().nonnegative(),
  monthlyXP: z.number().int().nonnegative(),
  streakFreezes: z.number().int().nonnegative(),
  achievements: z.array(AchievementResponseSchema).optional(),
});

// ============================================
// USER & PROFILE RESPONSE SCHEMAS
// ============================================

export const StudentProfileResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  school: z.string(),
  grade: z.number().int().min(1).max(8),
  class: z.string(),
  avatar: z.string().url().nullable(),
  birthDate: z.coerce.date().nullable(),
  parentalConsentGiven: z.boolean(),
  accountActive: z.boolean(),
});

export const GuardianProfileResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  avatar: z.string().url().nullable(),
  linkedStudents: z.array(StudentProfileResponseSchema).optional(),
});

// ============================================
// ANALYTICS RESPONSE SCHEMAS
// ============================================

export const WeeklyReportResponseSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  weekStart: z.coerce.date(),
  weekEnd: z.coerce.date(),
  totalHomework: z.number().int().nonnegative(),
  completedHomework: z.number().int().nonnegative(),
  lateHomework: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(100),
  subjectBreakdown: z.record(z.string(), z.object({
    total: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
  })),
  generatedAt: z.coerce.date(),
});

// ============================================
// PAGINATION WRAPPER
// ============================================

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
    message: z.string().optional(),
  });

// ============================================
// ERROR RESPONSE SCHEMA
// ============================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.any().optional(),
});

// ============================================
// SUCCESS RESPONSE SCHEMA
// ============================================

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type HomeworkResponse = z.infer<typeof HomeworkResponseSchema>;
export type HomeworkDetailResponse = z.infer<typeof HomeworkDetailResponseSchema>;
export type SubjectResponse = z.infer<typeof SubjectResponseSchema>;
export type GradeResponse = z.infer<typeof GradeResponseSchema>;
export type ScheduleEntryResponse = z.infer<typeof ScheduleEntryResponseSchema>;
export type EventResponse = z.infer<typeof EventResponseSchema>;
export type GamificationResponse = z.infer<typeof GamificationResponseSchema>;
export type AchievementResponse = z.infer<typeof AchievementResponseSchema>;
export type StudentProfileResponse = z.infer<typeof StudentProfileResponseSchema>;
export type GuardianProfileResponse = z.infer<typeof GuardianProfileResponseSchema>;
export type WeeklyReportResponse = z.infer<typeof WeeklyReportResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
