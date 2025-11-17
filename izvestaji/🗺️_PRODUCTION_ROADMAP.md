# 🗺️ OSNOVCI - PRODUCTION ROADMAP

**Datum analize:** 21. Oktobar 2025  
**Trenutni status:** MVP - Development Ready  
**Target:** Production Ready  

---

## 🚨 FAZA 1: KRITIČNI SECURITY FIX (1-2 dana)

### **P0 - BLOCKER BUGS** ⚠️

#### 1. Hardcoded PIN (`lib/auth/parental-lock.ts`)
```typescript
// ❌ TRENUTNO - SVi imaju PIN "1234"
const defaultPIN = "1234";

// ✅ FIX
model Guardian {
  pinHash String?
}

export async function verifyParentPIN(pin: string, guardianId: string) {
  const guardian = await prisma.guardian.findUnique({
    where: { id: guardianId },
    select: { pinHash: true }
  });
  return await bcrypt.compare(pin, guardian.pinHash);
}
```
**Vreme:** 2h  
**Risk:** 🚨 KRITIČNO - Anyone can delete homework

---

#### 2. Middleware Auth Check (`middleware.ts`)
```typescript
// ❌ TRENUTNO - Demo mode, no protection
// ✅ FIX - Add proper auth check

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  if (!session && !isPublicPage) {
    return NextResponse.redirect(new URL('/prijava', request.url));
  }
  
  // Email verification
  if (session && !session.user.emailVerified) {
    return NextResponse.redirect(new URL('/verify-pending', request.url));
  }
}
```
**Vreme:** 3h  
**Risk:** 🚨 KRITIČNO - Unprotected routes

---

#### 3. JWT Session Tracking (`lib/auth/config.ts`)
```typescript
// ❌ Ne može se invalidirati sesija
// ✅ FIX - Track sessions in DB

callbacks: {
  async signIn({ user }) {
    await prisma.session.create({
      data: {
        userId: user.id,
        token: generateToken(),
        expiresAt: new Date(Date.now() + 7*24*60*60*1000)
      }
    });
  }
}
```
**Vreme:** 4h  
**Risk:** 🚨 KRITIČNO - Can't logout users

---

## 🔥 FAZA 2: DATABASE MIGRATION (3-5 dana)

### **SQLite → PostgreSQL**

#### Setup
```bash
# 1. Kreiraj PostgreSQL database (Supabase ili Neon)
DATABASE_URL="postgresql://user:pass@host/db?pgbouncer=true"

# 2. Update schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# 3. Add indexes
@@index([title(ops: raw("gin_trgm_ops"))], type: Gist)

# 4. Migrate
npx prisma migrate dev --name postgres_migration
npx prisma db push
```

#### Missing Indexes
```prisma
model Homework {
  @@index([studentId, status, dueDate])
  @@index([priority, status, dueDate])
}

model ActivityLog {
  @@index([studentId, type, createdAt])
  @@index([expiresAt])
}

model Session {
  @@index([userId, lastActivityAt])
  @@index([expiresAt])
}
```

**Vreme:** 3-5 dana  
**Risk:** 🔴 VISOK - Performance bottleneck

---

## 🔧 FAZA 3: MISSING FEATURES (5-7 dana)

### **1. Biometric API Endpoints**

Kreiraj:
- `app/api/auth/biometric/challenge/route.ts`
- `app/api/auth/biometric/register/route.ts`
- `app/api/auth/biometric/verify/route.ts`

**Library:** `@simplewebauthn/server`

**Vreme:** 1 dan

---

### **2. Stranger Danger → Database**

```prisma
model LinkVerification {
  id String @id
  linkCode String @unique
  studentId String
  guardianId String
  step String
  emailCode String?
  expiresAt DateTime
}
```

**Vreme:** 4h

---

### **3. Soft Delete Support**

```prisma
model Homework {
  deletedAt DateTime?
  deletedBy String?
}
```

Update queries:
```typescript
where: { deletedAt: null }
```

**Vreme:** 1 dan

---

## 📊 FAZA 4: SCHEMA IMPROVEMENTS (2-3 dana)

### **Missing Fields**

```prisma
// Grade - School year tracking
model Grade {
  term String?
  schoolYear Int
  isFinal Boolean @default(false)
  teacherName String?
}

// Session - Device tracking
model Session {
  deviceType String?
  deviceName String?
  browser String?
  os String?
  ipAddress String?
  lastActivityAt DateTime
}

// Attachment - Security
model Attachment {
  fileHash String?
  virusScanned Boolean @default(false)
  virusScanResult String?
}

// ActivityLog - Retention
model ActivityLog {
  expiresAt DateTime?
}
```

**Vreme:** 2-3 dana

---

## 🛡️ FAZA 5: SECURITY HARDENING (3-4 dana)

### **1. Exponential Backoff**
```typescript
function getLockoutDuration(attempts: number): number {
  return Math.min(5 * Math.pow(2, attempts - 5), 24 * 60);
}
```

### **2. CSRF Token Rotation**
```typescript
generateCsrfToken(): { token, secret, expiresAt }
```

### **3. Virus Scanning**
```bash
npm install clamscan
```

**Vreme:** 3-4 dana

---

## 📈 FAZA 6: PRODUCTION PREP (5-7 dana)

### **Infrastructure**
- ✅ Setup Redis (Upstash)
- ✅ Setup ClamAV
- ✅ Setup PostgreSQL replicas
- ✅ Setup CDN (Cloudflare)
- ✅ Automated backups

### **Monitoring**
- ✅ Sentry alerts
- ✅ Uptime monitoring
- ✅ Performance monitoring
- ✅ Database query monitoring

### **Documentation**
- ✅ API docs (OpenAPI)
- ✅ Deployment guide
- ✅ Security policy

**Vreme:** 5-7 dana

---

## 📅 TIMELINE SUMMARY

| Faza | Trajanje | Priority | Status |
|------|----------|----------|--------|
| **FAZA 1:** Security Fix | 1-2 dana | 🚨 KRITIČNO | ⏳ Pending |
| **FAZA 2:** PostgreSQL | 3-5 dana | 🔴 VISOK | ⏳ Pending |
| **FAZA 3:** Missing Features | 5-7 dana | 🟠 MEDIUM | ⏳ Pending |
| **FAZA 4:** Schema Improvements | 2-3 dana | 🟠 MEDIUM | ⏳ Pending |
| **FAZA 5:** Security Hardening | 3-4 dana | 🟡 LOW | ⏳ Pending |
| **FAZA 6:** Production Prep | 5-7 dana | 🟡 LOW | ⏳ Pending |

**UKUPNO:** 19-28 dana (3-4 nedelje)

---

## ✅ CHECKLIST BEFORE PRODUCTION

### **Security**
- [ ] Fixed hardcoded PIN
- [ ] Middleware auth check
- [ ] JWT session tracking
- [ ] Exponential backoff
- [ ] CSRF rotation
- [ ] Virus scanning

### **Database**
- [ ] Migrated to PostgreSQL
- [ ] All indexes added
- [ ] Soft delete implemented
- [ ] Schema fields added
- [ ] Backup strategy

### **Features**
- [ ] Biometric API endpoints
- [ ] Stranger danger in DB
- [ ] Device tracking
- [ ] Activity log retention

### **Infrastructure**
- [ ] Redis configured
- [ ] ClamAV running
- [ ] PostgreSQL replicas
- [ ] CDN setup
- [ ] Monitoring active

### **Testing**
- [ ] Security audit passed
- [ ] Load testing passed
- [ ] E2E tests passing
- [ ] Manual QA done

---

## 🎯 PRIORITETI

**Ovaj Tjedan:**
1. ✅ Fix hardcoded PIN
2. ✅ Add middleware auth
3. ✅ JWT session tracking
4. ✅ Start PostgreSQL migration

**Sledeći Tjedan:**
5. ✅ Finish PostgreSQL migration
6. ✅ Add missing indexes
7. ✅ Biometric endpoints
8. ✅ Stranger danger to DB

**Za 2 Nedelje:**
9. ✅ Schema improvements
10. ✅ Soft delete
11. ✅ Security hardening
12. ✅ Start production prep

---

## 📞 HELP NEEDED

Ako treba pomoć sa bilo kojom fazom:
1. **PostgreSQL migration** - Kompleksno, treba pažnje
2. **Biometric WebAuthn** - Nova tehnologija
3. **ClamAV setup** - Infrastructure knowledge
4. **Load testing** - Performance tuning

---

## 🚀 NAKON PRODUCTION LAUNCH

### **Post-Launch Monitoring (Prvi mesec)**
- Monitor error rates (target: <0.1%)
- Track response times (target: <500ms p95)
- Watch database queries (target: <100ms)
- User feedback collection

### **Future Features (V2)**
- Push notifications
- Offline-first sync
- AI homework helper
- Parent analytics dashboard
- Multi-language support
- Dark mode

---

**Kreirao:** GitHub Copilot  
**Datum:** 21. Oktobar 2025  
**Next Review:** Nakon Faze 1 completion

**STATUS:** 🟡 READY TO START! 💪
