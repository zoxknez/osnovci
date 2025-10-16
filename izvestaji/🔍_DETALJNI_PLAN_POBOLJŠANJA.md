# 🔍 DETALJNI PLAN POBOLJŠANJA - KORAK PO KORAK

**Dokument:** Систематска Analiza i Roadmap  
**Datum:** 16. Oktobar 2025  
**Pristup:** Lagano, bez Žurenja, Savršen Kod  
**Prioritet:** Kvaliteta > Brzina

---

## 📋 FAZA 1: ANALIZA POSTOJEĆEG STANJA

### Šta Već Postoji (STATUS ✅)

```
INFRASTRUKTURA:
├─ ✅ Next.js 15 (Turbopack)
├─ ✅ React 19.1
├─ ✅ TypeScript Strict Mode
├─ ✅ Prisma ORM sa PostgreSQL
├─ ✅ NextAuth v5
├─ ✅ Tailwind CSS 4.1
└─ ✅ Vercel Deployment Ready

SIGURNOST:
├─ ✅ Auth Middleware
├─ ✅ Rate Limiting
├─ ✅ Input Sanitization (DOMPurify)
├─ ✅ CSRF Protection
├─ ✅ Content Filtering
├─ ✅ Parental Consent System
└─ ✅ COPPA Compliance

FUNKCIONALNOSTI:
├─ ✅ Homework Management (CRUD)
├─ ✅ Schedule Management
├─ ✅ Events/Exams
├─ ✅ Gamification (XP, Levels)
├─ ✅ Parent Linking (QR Code)
├─ ✅ Profile Management
├─ ✅ Notifications
├─ ✅ Analytics Dashboard
└─ ✅ Offline Sync Ready

API ENDPOINTS (13/13):
├─ ✅ GET/POST /api/homework
├─ ✅ GET/PATCH/DELETE /api/homework/[id]
├─ ✅ GET/POST /api/schedule
├─ ✅ GET/POST /api/events
├─ ✅ GET /api/subjects
├─ ✅ GET/PATCH /api/profile
├─ ✅ GET /api/notifications
├─ ✅ GET /api/gamification
├─ ✅ GET /api/health
├─ ✅ Auth endpoints
├─ ✅ Parental Consent
├─ ✅ Activity Log
└─ ✅ Upload ready

TESTIRANJE:
├─ ✅ Vitest Setup
├─ ✅ Test Files Started
├─ ✅ Unit Tests (few)
└─ ⏳ E2E Tests (TODO)

MONITORING:
├─ ✅ Health Check Endpoint
├─ ✅ Structured Logging (Pino)
├─ ✅ Error Boundaries
└─ ⏳ Sentry Integration (TODO)
```

---

## ⚠️ FAZA 2: ŠIMAMNI PROBLEMI I NEDOSTACI

### KRITIČNI (Mora se Prvo)

#### 1. 📧 **Email Verification Nedostaje** 🔴
**Lokacija:** `lib/auth/email-verification.ts`
**Status:** Nije Implementirano
**Razlog:** Sigurnost - Verifikacija Email-a

**Plan Akcije:**
```
Korak 1: Dodaj VerificationToken model u Prisma
Korak 2: Kreiraj Email Service (SendGrid/Resend)
Korak 3: Kreiraj Verification API endpoint
Korak 4: Update Registration flow
Korak 5: Testiraj kompletan proces
```

**Vrijeme:** 1-2 sedmice

---

#### 2. 🔐 **Two-Factor Authentication (2FA)** 🔴
**Lokacija:** Nigdje još
**Status:** Nije Implementirano
**Razlog:** Enhanced Security

**Plan Akcije:**
```
Korak 1: Dodaj TwoFactor model (secret, backup codes)
Korak 2: Instaliraj speakeasy paketi
Korak 3: Kreiraj Setup API
Korak 4: Kreiraj Verify API
Korak 5: Update Login sa 2FA
Korak 6: Testiraj sa Mobile Authenticator
```

**Vrijeme:** 1-2 sedmice

---

#### 3. 📤 **File Upload API Kompletna** 🔴
**Lokacija:** `app/api/upload/route.ts`
**Status:** Parser Nije Povezan sa DB
**Razlog:** Attachment Management

**Plan Akcije:**
```
Korak 1: Integriraj Vercel Blob ili AWS S3
Korak 2: Dodaj Size Limits (10MB za sliku)
Korak 3: Dodaj File Type Validation
Korak 4: Dodaj Compression (sharp)
Korak 5: Update Homework sa Attachments
Korak 6: Testiraj Upload Performance
```

**Vrijeme:** 3-4 dana

---

### VAŽNO (Sljedeće Dvije Sedmice)

#### 4. 📊 **Advanced Analytics Dashboard** 🟠
**Lokacija:** `app/(dashboard)/dashboard/analytics/page.tsx`
**Status:** Basic Dashboard Postoji
**Razlog:** User Insights

**Plan Akcije:**
```
Korak 1: Dodaj Recharts sa Real Data
Korak 2: Kreiraj Analytics API
Korak 3: Dodaj Trend Analysis
Korak 4: Dodaj Performance Comparison
Korak 5: Testiraj sa Većim Datasetima
```

**Vrijeme:** 1 sedmica

---

#### 5. 🎯 **Daily Quests System** 🟠
**Lokacija:** `app/api/gamification/daily-quest/route.ts`
**Status:** Skeleton Postoji
**Razlog:** Engagement + Retention

**Plan Akcije:**
```
Korak 1: Dodaj DailyQuest model u Prisma
Korak 2: Kreiraj Quest Generation Logic
Korak 3: Kreiraj Quest Completion API
Korak 4: Dodaj XP Rewards
Korak 5: Kreiraj UI komponente
Korak 6: Testiraj Timing & Resets
```

**Vrijeme:** 1 sedmica

---

#### 6. 🏆 **Achievement Badges System** 🟠
**Lokacija:** `components/gamification/achievement-badge.tsx`
**Status:** Komponenta Postoji, Logika Nedostaje
**Razlog:** Motivation & Gamification

**Plan Akcije:**
```
Korak 1: Definiši Badge Requirements
Korak 2: Kreiraj Achievement Model
Korak 3: Kreiraj Badge Check API
Korak 4: Dodaj Unlock Notifications
Korak 5: Kreiraj Showcase Page
Korak 6: Testiraj Badge Unlocking
```

**Vrijeme:** 1 sedmica

---

### PREPORUČENO (Q1 2026)

#### 7. 🤖 **AI Tutor Integration** 🟡
**Lokacija:** `lib/ai/tutor.ts`
**Status:** Nije Implementirano
**Razlog:** Educational Value + Revenue

**Plan Akcije:**
```
Korak 1: Dodaj Claude API Key
Korak 2: Kreiraj Tutor Service
Korak 3: Integriraj sa Homework
Korak 4: Testiraj sa Različitim Predmetima
Korak 5: Dodaj Usage Limits (Free)
```

**Vrijeme:** 2-3 sedmice

---

#### 8. 👨‍🏫 **Teacher Dashboard** 🟡
**Lokacija:** `app/(dashboard)/dashboard/ucitelj/`
**Status:** Nije Kreirano
**Razlog:** New Market Segment

**Plan Akcije:**
```
Korak 1: Kreiraj Teacher Role
Korak 2: Kreiraj Class Management UI
Korak 3: Kreiraj Assignment Creation
Korak 4: Kreiraj Grading Interface
Korak 5: Kreiraj Class Analytics
Korak 6: Testiraj sa Real Teachers
```

**Vrijeme:** 4-6 sedmika

---

#### 9. 🗣️ **Text-to-Speech & Speech-to-Text** 🟡
**Lokacija:** `hooks/use-speech-synthesis.ts`
**Status:** Nije Implementirano
**Razlog:** Accessibility

**Plan Akcije:**
```
Korak 1: Dodaj Web Speech API
Korak 2: Integriraj sa Homework Description
Korak 3: Dodaj Speed Controls
Korak 4: Testiraj Compatibility
Korak 5: Dodaj Audio Language Selection
```

**Vrijeme:** 1-2 sedmice

---

## 🛠️ FAZA 3: DETALJNI IMPLEMENTACIJSKI PLAN

### SEDMICA 1-2: EMAIL VERIFICATION

#### Korak 1: Update Prisma Schema
```prisma
// prisma/schema.prisma - Dodaj ovi modeli:

model VerificationToken {
  email     String
  token     String      @unique
  expires   DateTime
  createdAt DateTime    @default(now())
  
  @@id([email, token])
}

model User {
  // ... existing fields
  emailVerified DateTime?
}
```

#### Korak 2: Kreiraj Email Service
```typescript
// lib/email/service.ts
// Korak po korak sa svim error handling-om
```

#### Korak 3: Kreiraj API Endpoint
```typescript
// app/api/auth/verify-email/route.ts
// Korak po korak sa validacijom
```

#### Korak 4: Update Registration
```typescript
// app/api/auth/register/route.ts
// Dodaj email verification logiku
```

#### Korak 5: Testiraj
```bash
npm run test:run -- auth
# Testiraj manuelno sa test email
```

---

### SEDMICA 2-3: TWO-FACTOR AUTHENTICATION

#### Korak 1: Dodaj Modele
```prisma
model TwoFactor {
  userId        String   @unique
  secret        String
  backupCodes   BackupCode[]
  enabled       Boolean  @default(false)
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
}

model BackupCode {
  code          String
  used          Boolean  @default(false)
  twoFactorId   String
}
```

#### Korak 2: Kreiraj 2FA Service
```typescript
// lib/auth/2fa.ts
// Korak po korak sa speakeasy
```

---

## 📅 TIMELINE - KORAK PO KORAK

### SEDMICA 1 (16-22 Oktobar)

```
PONEDELJAN (16.10):
├─ 1h: Detaljno čitaj postojeći kod
├─ 1h: Napravi Backup Baze
├─ 2h: Kreiraj Email Service
├─ 1h: Testiraj Email Slanje
└─ 30min: Update README

UTORAK (17.10):
├─ 2h: Kreiraj Verification API
├─ 1h: Update Registration Flow
├─ 1h: Testiraj Verification
├─ 30min: Add Error Messages
└─ 30min: Commit Changes

SRIJEDA (18.10):
├─ 1h: Code Review (tvoj kod)
├─ 1h: Update Unit Tests
├─ 1h: Update Documentation
├─ 1h: Test Edge Cases
└─ 1h: Optimizacija

ČETVRTAK (19.10):
├─ 2h: Kreiraj 2FA Models
├─ 1h: Instaliraj Speakeasy
├─ 2h: Kreiraj Setup API
└─ 1h: QA

PETAK (20.10):
├─ 2h: Kreiraj Verify API
├─ 1h: Testiraj sa Authenticator
├─ 1h: Add Backup Codes
├─ 1h: Error Handling
└─ 30min: Documentation

SUBOTA (21.10):
├─ 1h: Complete Testing
├─ 1h: Performance Check
├─ 1h: Security Review
└─ 1h: Update Docs

NEDJELJA (22.10):
├─ 2h: Review Kompletan Rad
├─ 1h: Update Roadmap
├─ 1h: Plan Sedmica 2
└─ 1h: Relaksacija 😊
```

---

### SEDMICA 2 (23-29 Oktobar)

```
FOKUS: File Upload + Daily Quests

PONEDELJAN-SRIJEDA:
├─ Complete File Upload
├─ Testiraj Upload API
├─ Dodaj Compression

ČETVRTAK-PETAK:
├─ Kreiraj Daily Quest Models
├─ Kreiraj Quest API
├─ Testiraj Quest System

SUBOTA-NEDJELJA:
├─ Review & Optimize
├─ Dokumentacija
├─ Plan Sedmice 3
```

---

## 🎯 PRINCIPI RADA

### 1. **Lagano i Sistematski** 🐢
```
Ne žuri se!
Bolje spora i dobra nego brza i loša.
```

### 2. **Kvaliteta Prvo** ⭐
```
Kodiranje:
├─ TypeScript Strict Mode
├─ Proper Error Handling
├─ Unit Tests
├─ Code Comments
└─ Documentation

Testiranje:
├─ Manual Testing
├─ Automated Tests
├─ Edge Cases
├─ Performance
└─ Security
```

### 3. **Backup & Safety** 🛡️
```
Prije svakog većeg promjene:
├─ Git Commit
├─ Database Backup
├─ Test Suite Run
└─ Code Review (tvoj)
```

### 4. **Dokumentacija** 📚
```
Svaki kod:
├─ JSDoc Comments
├─ README Updates
├─ Type Definitions
└─ Example Usage
```

---

## ✅ KOMPLETNA CHECKLIST

### Pre početka Implementacije

```
SETUP:
☐ Git Branch za svako poboljšanje
☐ Database Backup
☐ Test Suite Running
☐ Type Checking OK

SVAKI KORAK:
☐ Kod Napisanje
☐ TypeScript Check
☐ Linting OK
☐ Tests Green
☐ Manual Testing
☐ Documentation Updated
☐ Git Commit

POST IMPLEMENTACIJA:
☐ All Tests Passing
☐ No Type Errors
☐ No Lint Issues
☐ Performance OK
☐ Security Review
☐ Documentation Complete
☐ Merge to Main
```

---

## 📞 ŠIMAMNI KORACI

### Sada (Tačka):

1. **Čitaj** Ovaj Dokument Pažljivo
2. **Postavi** Git Branch: `feature/email-verification`
3. **Kreiraj** Backup Database-a
4. **Počni** Sa Email Service

### Sledeća Akcija:

Javite mi kada ste **Ready**:
- Razumijete Plan?
- Jeste li Pročitali Kod?
- Trebate li Pojašnjenja?

Onda ćemo početi sa **Email Verification** korak po korak.

---

## 🎓 KAKO RADIMO

### Za Svaki Korak:

1. **Razumij Problem**
   - Čitaj Существујући Kod
   - Razumi Why-je
   - Plan Implementation

2. **Napiši Kod**
   - TypeScript First
   - Error Handling
   - Comments & Docs

3. **Testiraj**
   - Unit Tests
   - Manual Tests
   - Edge Cases

4. **Review**
   - Code Quality
   - Type Safety
   - Performance

5. **Dokumentuj**
   - Update README
   - Add Examples
   - Commit Message

---

**Ready? Javi mi!** 🚀

Čekam tvoj Odgovor prije nego počnemo.

