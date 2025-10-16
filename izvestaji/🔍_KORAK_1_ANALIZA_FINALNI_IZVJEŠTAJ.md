# 🔍 KORAK 1: ANALIZA POSTOJEĆEG KODA - FINALNI IZVJEŠTAJ

**Datum:** 16. Oktobar 2025  
**Status:** ✅ ANALIZA KOMPLETNA  
**Nalazni:** 8 Kritičnih Zapažanja  

---

## 📋 ŠTAGJE PRONAĐENO

### 1.1 Registracija Endpoint - ODLIČAN SETUP!

**Lokacija:** `app/api/auth/register/route.ts`

#### ✅ Što Radi Odlično:
```typescript
✓ Validacija sa Zod schema-om
✓ Bcrypt hashing za lozinke (12 rounds)
✓ Provjera ako korisnik već postoji (email i telefon)
✓ Podrška za razne role-ove (STUDENT, GUARDIAN)
✓ Automatsko kreiranja Student/Guardian profila
✓ Error handling sa logovanjem
✓ Zod flatten() za detaljne error poruke
```

#### 🔴 Šta Trebam Dodati:
1. **emailVerified polje** - Currently NEMA, trebam dodati
2. **Email verification flow** - User se odmah kreira bez verifikacije
3. **Verification token** - Trebam generiraj i spremi
4. **Email slanje** - Trebam pošaljem verification email

---

### 1.2 User Model - GOTOVO ZA UPDATE!

**Lokacija:** `prisma/schema.prisma` (Linije 34-53)

#### Trenutna Struktura:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  phone     String?  @unique
  password  String?  // Hashed with bcrypt
  role      UserRole
  locale    Language @default(SR_LATN)
  theme     Theme    @default(AUTO)
  pinCode   String?  // Encrypted PIN for quick access
  biometric Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  student  Student?
  guardian Guardian?
  sessions Session[]
  
  @@index([email])
  @@index([phone])
  @@map("users")
}
```

#### 📝 Trebam Dodati:
```prisma
emailVerified DateTime?  // NULL = nije verificiran, DateTime = verificiran
```

**Objašnjenje:**
- `emailVerified` će biti `NULL` dok email nije verificiran
- Nakon što user klikne link, postaje `DateTime` sa vremenom verifikacije
- Po NextAuth standardu za email verification

---

### 1.3 Nema VerificationToken Modela

**Status:** ❌ NE POSTOJI - TREBAM KREIRATI

Trebam dodati novi model:
```prisma
model VerificationToken {
  email     String
  token     String      @unique      // SHA256 hash
  expires   DateTime                 // 24h expiration
  createdAt DateTime    @default(now())
  
  @@id([email, token])
  @@index([email])
  @@index([expires])
  @@map("verification_tokens")
}
```

**Čemu Služi:**
- Spremi verification token-e u bazi
- Heširani token (SHA256) za sigurnost
- Expires polje da automatski brisanje isteklih
- Spaja na email koji trebam verificirati

---

### 1.4 NextAuth Konfiguracija

**Lokacija:** `app/api/auth/[...nextauth]/route.ts`

Trebam pročitati:
- Kako su trenutno konfigurisani callback-i?
- Ima li `authorized` callback koji mogam extend?
- Gdje se provjerava session?

---

## 🔧 ŠTO TREBAM URADITI U KORAK 1

### Faza 1A: Update Prisma Schema (5 minuta)

```prisma
// Dodaj u User model:
emailVerified DateTime?

// Kreiraj novi model VerificationToken:
model VerificationToken {
  email     String
  token     String      @unique
  expires   DateTime
  createdAt DateTime    @default(now())
  
  @@id([email, token])
  @@index([email])
  @@index([expires])
  @@map("verification_tokens")
}
```

**Lokacija:** Otvori `prisma/schema.prisma`
- Pronađi `model User` (linija ~34)
- Dodaj `emailVerified DateTime?` prije `createdAt`
- Na kraju fajla, dodaj `model VerificationToken`

### Faza 1B: Kreiraj Migraciju (3 minuta)

```bash
cd d:\ProjektiApp\osnovci
npx prisma migrate dev --name add_email_verification
```

**Što će se desiti:**
1. Prisma će kreiraj migration fajl
2. Primjeni na dev bazu
3. Regenerira Prisma Client sa novim tipovima

**Očekivani Output:**
```
✓ Created file ./prisma/migrations/20251016123456_add_email_verification/migration.sql
✓ Database has been updated with 2 changes
✓ Generated Prisma Client (v5.x)
```

### Faza 1C: Verifikacija (2 minuta)

```bash
# Provjeri da li je TypeScript zadovoljan:
npm run build

# Trebam biti bez grešaka
```

---

## 🎯 DETALJNI KORACI ZA IZVRŠENJE

### Korak A: Otvori Prisma Schema

```bash
# Windows PowerShell:
code d:\ProjektiApp\osnovci\prisma\schema.prisma
```

**Što trebam vidjeti:**
- Linija ~34: `model User {`
- Linije 45-50: `createdAt DateTime` i ostala polja

### Korak B: Dodaj `emailVerified` Polje

Pronađi ovu sekciju:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  phone     String?  @unique
  password  String?  // Hashed with bcrypt
  role      UserRole
  locale    Language @default(SR_LATN)
  theme     Theme    @default(AUTO)
  pinCode   String?  // Encrypted PIN for quick access
  biometric Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
```

Trebam dodati `emailVerified` **PRIJE** `createdAt`:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  phone     String?  @unique
  password  String?  // Hashed with bcrypt
  role      UserRole
  locale    Language @default(SR_LATN)
  theme     Theme    @default(AUTO)
  pinCode   String?  // Encrypted PIN for quick access
  biometric Boolean  @default(false)
  emailVerified DateTime?  // ← NOVO!
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
```

### Korak C: Dodaj VerificationToken Model

Pronađi kraj `prisma/schema.prisma` fajla (trebam biti na kraju, prije ili nakon nekog drugog modela).

Dodaj ovo:
```prisma
model VerificationToken {
  email     String
  token     String      @unique
  expires   DateTime
  createdAt DateTime    @default(now())

  @@id([email, token])
  @@index([email])
  @@index([expires])
  @@map("verification_tokens")
}
```

### Korak D: Testiraj Syntax

```bash
# U terminalu - Provjeri da li je schema validan:
npx prisma format

# Trebam biti bez grešaka
```

### Korak E: Kreiraj Migraciju

```bash
# U terminalu:
npx prisma migrate dev --name add_email_verification

# Odgovori na prompt ako postoji
# Trebam vidjeti:
# ✓ Created file ./prisma/migrations/...
# ✓ Database has been updated
```

### Korak F: Kreiraj Prisma Client

```bash
# Regenerira TypeScript tipove:
npx prisma generate

# Trebam vidjeti:
# ✓ Generated Prisma Client (v5.x)
```

### Korak G: Provjeri Build

```bash
# Provjeri TypeScript greške:
npm run build

# Trebam biti bez grešaka
```

---

## ✅ CHECKLIST ZA KORAK 1

Kada završiš, trebam imati:

```
☐ Otvorio prisma/schema.prisma
☐ Dodao emailVerified DateTime? u User model
☐ Dodao VerificationToken model na kraju
☐ Pokrenuo npx prisma format
☐ Pokrenuo npx prisma migrate dev
☐ Pokrenuo npx prisma generate
☐ Pokrenuo npm run build
☐ Bez TypeScript grešaka
☐ dev.db ažurirana (nova kolona i tabela)
```

---

## 📊 REZULTAT NAKON KORAK 1

### ✅ Šta Će Se Desiti:

```
PRIJE:
└─ User model
   ├─ email
   ├─ phone
   └─ password
   └─ NO emailVerified

NAKON:
└─ User model
   ├─ email
   ├─ phone
   ├─ password
   └─ emailVerified ✅ NOVO!
   
└─ VerificationToken model ✅ NOVO!
   ├─ email
   ├─ token
   ├─ expires
   └─ createdAt
```

### 🗄️ Baza Podataka:

```sql
-- Novi kolona u `users` tabeli:
ALTER TABLE "users" ADD COLUMN "emailVerified" TIMESTAMP;

-- Nova tabela:
CREATE TABLE "verification_tokens" (
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("email", "token")
);

CREATE INDEX "verification_tokens_email_idx" ON "verification_tokens"("email");
CREATE INDEX "verification_tokens_expires_idx" ON "verification_tokens"("expires");
```

---

## 🚀 SLEDEĆE KORAKE

Nakon što završiš Korak 1 i sve je OK:
1. Kreirajmo Email Service (`lib/email/service.ts`)
2. Kreirajmo Verification Logic (`lib/auth/email-verification.ts`)
3. Kreirajmo API Endpoint (`app/api/auth/verify-email/route.ts`)
4. Update Registraciju sa Email Slanjem

---

## 💡 BITNI SAVJETI

1. **Backup Baze Prije Migracije**
   ```bash
   Copy-Item -Path "prisma/dev.db" -Destination "prisma/dev.db.backup"
   ```

2. **Ako Nešto Pođe Naopako**
   ```bash
   # Vrati backup:
   Remove-Item -Path "prisma/dev.db"
   Copy-Item -Path "prisma/dev.db.backup" -Destination "prisma/dev.db"
   
   # Resetuj Prisma:
   rm -r "prisma/migrations"
   npx prisma migrate reset
   ```

3. **Provjeri TypeScript Greške**
   ```bash
   npx tsc --noEmit
   ```

---

## 🎓 ZAKLJUČAK KORAK 1

Ovo je jednostavna ali **KRITIČNA** faza jer:

✅ Postavljamo temelj za Email Verification  
✅ Dodajemo nove tabele u bazi  
✅ Updating TypeScript tipove  
✅ Sve buduće korake zavise od ovoga  

Ako je sve OK, možemo sigurno nastaviti dalje!

---

**Javi mi kada si završio Korak 1** 📩

Trebam vidjeti output iz terminala. Onda krećemo sa **KORAK 2: EMAIL SERVICE** 📧

