-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'SR_LATN',
    "theme" TEXT NOT NULL DEFAULT 'AUTO',
    "pinCode" TEXT,
    "biometric" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "class" TEXT NOT NULL,
    "avatar" TEXT,
    "birthDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "age" INTEGER,
    "parentalConsentGiven" BOOLEAN NOT NULL DEFAULT false,
    "parentalConsentDate" DATETIME,
    "parentalConsentEmail" TEXT,
    "accountActive" BOOLEAN NOT NULL DEFAULT true,
    "jmbg" TEXT,
    "address" TEXT,
    "height" REAL,
    "weight" REAL,
    "clothingSize" TEXT,
    "hasGlasses" BOOLEAN NOT NULL DEFAULT false,
    "bloodType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "allergies" TEXT,
    "chronicIllnesses" TEXT,
    "medications" TEXT,
    "vaccinations" TEXT,
    "healthNotes" TEXT,
    "specialNeeds" TEXT,
    "primaryDoctor" TEXT,
    "primaryDoctorPhone" TEXT,
    "dentist" TEXT,
    "dentistPhone" TEXT,
    "emergencyContact1" TEXT,
    "emergencyContact1Phone" TEXT,
    "emergencyContact2" TEXT,
    "emergencyContact2Phone" TEXT,
    "hobbies" TEXT,
    "sports" TEXT,
    "activities" TEXT,
    "notes" TEXT,
    CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parental_consents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "guardianEmail" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "guardians_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guardianId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "linkCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "links_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "links_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "student_subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_subjects_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "homework" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "homework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "homework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "homeworkId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "localUri" TEXT,
    "remoteUrl" TEXT,
    "thumbnail" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" DATETIME,
    CONSTRAINT "attachments_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "homework" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schedule_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "notes" TEXT,
    "isAWeek" BOOLEAN NOT NULL DEFAULT true,
    "isBWeek" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "schedule_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "schedule_entries_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dateTime" DATETIME NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "notifyAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "events_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "totalHomework" INTEGER NOT NULL DEFAULT 0,
    "completedHomework" INTEGER NOT NULL DEFAULT 0,
    "lateHomework" INTEGER NOT NULL DEFAULT 0,
    "subjectBreakdown" JSONB NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "gamification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "totalXPEarned" INTEGER NOT NULL DEFAULT 0,
    "totalHomeworkDone" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "gamification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gamificationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "achievements_gamificationId_fkey" FOREIGN KEY ("gamificationId") REFERENCES "gamification" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("email", "token")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_userId_idx" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_school_grade_class_idx" ON "students"("school", "grade", "class");

-- CreateIndex
CREATE INDEX "students_parentalConsentGiven_idx" ON "students"("parentalConsentGiven");

-- CreateIndex
CREATE UNIQUE INDEX "parental_consents_verificationCode_key" ON "parental_consents"("verificationCode");

-- CreateIndex
CREATE INDEX "parental_consents_studentId_idx" ON "parental_consents"("studentId");

-- CreateIndex
CREATE INDEX "parental_consents_verificationCode_idx" ON "parental_consents"("verificationCode");

-- CreateIndex
CREATE INDEX "parental_consents_guardianEmail_idx" ON "parental_consents"("guardianEmail");

-- CreateIndex
CREATE INDEX "activity_logs_studentId_idx" ON "activity_logs"("studentId");

-- CreateIndex
CREATE INDEX "activity_logs_studentId_createdAt_idx" ON "activity_logs"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_type_idx" ON "activity_logs"("type");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_userId_key" ON "guardians"("userId");

-- CreateIndex
CREATE INDEX "guardians_userId_idx" ON "guardians"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "links_linkCode_key" ON "links"("linkCode");

-- CreateIndex
CREATE INDEX "links_linkCode_idx" ON "links"("linkCode");

-- CreateIndex
CREATE INDEX "links_guardianId_idx" ON "links"("guardianId");

-- CreateIndex
CREATE INDEX "links_studentId_idx" ON "links"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "links_guardianId_studentId_key" ON "links"("guardianId", "studentId");

-- CreateIndex
CREATE INDEX "student_subjects_studentId_idx" ON "student_subjects"("studentId");

-- CreateIndex
CREATE INDEX "student_subjects_subjectId_idx" ON "student_subjects"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "student_subjects_studentId_subjectId_key" ON "student_subjects"("studentId", "subjectId");

-- CreateIndex
CREATE INDEX "homework_studentId_idx" ON "homework"("studentId");

-- CreateIndex
CREATE INDEX "homework_subjectId_idx" ON "homework"("subjectId");

-- CreateIndex
CREATE INDEX "homework_dueDate_idx" ON "homework"("dueDate");

-- CreateIndex
CREATE INDEX "homework_status_idx" ON "homework"("status");

-- CreateIndex
CREATE INDEX "homework_studentId_status_idx" ON "homework"("studentId", "status");

-- CreateIndex
CREATE INDEX "homework_studentId_dueDate_status_idx" ON "homework"("studentId", "dueDate", "status");

-- CreateIndex
CREATE INDEX "homework_status_dueDate_idx" ON "homework"("status", "dueDate");

-- CreateIndex
CREATE INDEX "attachments_homeworkId_idx" ON "attachments"("homeworkId");

-- CreateIndex
CREATE INDEX "schedule_entries_studentId_idx" ON "schedule_entries"("studentId");

-- CreateIndex
CREATE INDEX "schedule_entries_subjectId_idx" ON "schedule_entries"("subjectId");

-- CreateIndex
CREATE INDEX "schedule_entries_dayOfWeek_idx" ON "schedule_entries"("dayOfWeek");

-- CreateIndex
CREATE INDEX "schedule_entries_studentId_dayOfWeek_idx" ON "schedule_entries"("studentId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "schedule_entries_studentId_dayOfWeek_startTime_idx" ON "schedule_entries"("studentId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "events_studentId_idx" ON "events"("studentId");

-- CreateIndex
CREATE INDEX "events_dateTime_idx" ON "events"("dateTime");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "events_studentId_dateTime_idx" ON "events"("studentId", "dateTime");

-- CreateIndex
CREATE INDEX "events_studentId_type_dateTime_idx" ON "events"("studentId", "type", "dateTime");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "weekly_reports_studentId_idx" ON "weekly_reports"("studentId");

-- CreateIndex
CREATE INDEX "weekly_reports_weekStart_idx" ON "weekly_reports"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_studentId_key" ON "gamification"("studentId");

-- CreateIndex
CREATE INDEX "gamification_studentId_idx" ON "gamification"("studentId");

-- CreateIndex
CREATE INDEX "achievements_gamificationId_idx" ON "achievements"("gamificationId");

-- CreateIndex
CREATE INDEX "achievements_type_idx" ON "achievements"("type");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_gamificationId_title_key" ON "achievements"("gamificationId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_email_idx" ON "verification_tokens"("email");

-- CreateIndex
CREATE INDEX "verification_tokens_expires_idx" ON "verification_tokens"("expires");
