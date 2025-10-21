import { z } from "zod";

// Guardian role
export const GuardianRole = z.enum(["PARENT", "GUARDIAN", "TEACHER"]);
export type GuardianRole = z.infer<typeof GuardianRole>;

// Relation type
export const RelationType = z.enum([
  "MOTHER",
  "FATHER",
  "GRANDMOTHER",
  "GRANDFATHER",
  "OTHER",
]);
export type RelationType = z.infer<typeof RelationType>;

// Permissions
export const Permission = z.enum([
  "VIEW_GRADES",
  "VIEW_HOMEWORK",
  "VIEW_SCHEDULE",
  "VIEW_ATTENDANCE",
  "SEND_MESSAGES",
  "VIEW_ACTIVITIES",
  "EDIT_PROFILE",
  "APPROVE_ACTIVITIES",
]);
export type Permission = z.infer<typeof Permission>;

// Link status
export const LinkStatus = z.enum([
  "PENDING",
  "VERIFIED",
  "ACTIVE",
  "REJECTED",
  "REVOKED",
]);
export type LinkStatus = z.infer<typeof LinkStatus>;

// Initiate family link schema
export const InitiateFamilyLinkSchema = z.object({
  email: z
    .string()
    .email("Unesite validan email")
    .max(255, "Email može biti najviše 255 karaktera"),
  relation: RelationType,
  permissions: z
    .array(Permission)
    .default(["VIEW_GRADES", "VIEW_HOMEWORK", "VIEW_SCHEDULE"]),
});

export type InitiateFamilyLinkInput = z.infer<typeof InitiateFamilyLinkSchema>;

// Approve family link schema
export const ApproveFamilyLinkSchema = z.object({
  linkId: z.string().uuid("Link ID je obavezan"),
  approved: z.boolean(),
});

export type ApproveFamilyLinkInput = z.infer<typeof ApproveFamilyLinkSchema>;

// Update permissions schema
export const UpdatePermissionsSchema = z.object({
  guardianId: z.string().uuid("Guardian ID je obavezan"),
  permissions: z.array(Permission).min(1, "Najmanje jedna dozvola je obavezna"),
});

export type UpdatePermissionsInput = z.infer<typeof UpdatePermissionsSchema>;

// Query family schema
export const QueryFamilySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: LinkStatus.optional(),
  role: GuardianRole.optional(),
  sortBy: z.enum(["linkCode", "createdAt", "isActive"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type QueryFamilyInput = z.infer<typeof QueryFamilySchema>;

// Family member response schema
export const FamilyMemberResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  relation: RelationType,
  role: GuardianRole,
  status: LinkStatus,
  permissions: z.array(Permission),
  linkedAt: z.date(),
  lastAccess: z.date().optional(),
});

export type FamilyMemberResponse = z.infer<typeof FamilyMemberResponseSchema>;

// Paginated response
export const PaginatedFamilySchema = z.object({
  data: z.array(FamilyMemberResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
  }),
});

export type PaginatedFamily = z.infer<typeof PaginatedFamilySchema>;
