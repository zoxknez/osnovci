# 🎮 Demo Mode Guide

## Šta je Demo Mode?

Demo Mode omogućava instant pristup aplikaciji **bez** registracije, login-a ili roditeljske saglasnosti. Savršeno za:

- 🎯 **Brzo testiranje** novih funkcionalnosti
- 👀 **Preview** aplikacije za potencijalne korisnike
- 🚀 **Development** bez potrebe za auth flow
- 📊 **Demo prezentacije** sa mock podacima

---

## ✅ Kako aktivirati Demo Mode

### Opcija 1: Environment Variable (Preporučeno)

Dodaj u `.env.local`:

```bash
NEXT_PUBLIC_DEMO_MODE="true"
```

### Opcija 2: Development Mode (Automatski)

Demo mode je **automatski aktivan** u `NODE_ENV=development`.

---

## 🎯 Kako radi?

### 1. **Middleware Auto-Redirect**

Sve auth stranice automatski redirectuju na dashboard:

- ✅ `/prijava` → `/dashboard`
- ✅ `/registracija` → `/dashboard`
- ✅ `/consent-required` → `/dashboard`
- ✅ `/verify-pending` → `/dashboard`
- ✅ `/` (landing) → `/dashboard`

**Implementacija**: `middleware.ts`

```typescript
// 🎮 DEMO MODE: Auto-redirect to dashboard
const authPages = ["/prijava", "/registracija", "/consent-required"];
if (authPages.some(page => pathname.startsWith(page))) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

---

### 2. **Mock Authentication**

API routes koriste mock session umesto pravih auth provera:

**Helper funkcija**: `lib/auth/demo-mode.ts`

```typescript
import { getAuthSession } from "@/lib/auth/demo-mode";

// Umesto:
const session = await auth();

// Koristi:
const session = await getAuthSession(auth);
```

**Mock Session**:
```json
{
  "user": {
    "id": "demo-student-id",
    "email": "demo@osnovci.app",
    "name": "Marko Marković",
    "role": "STUDENT",
    "locale": "SR_LATN",
    "theme": "LIGHT"
  }
}
```

---

### 3. **Demo Banner**

Dashboard prikazuje vizuelni banner da korisnici znaju da su u demo mode-u.

**Lokacija**: `app/(dashboard)/dashboard/page.tsx`

```tsx
{/* 🎮 Demo Mode Banner */}
<motion.div className="bg-gradient-to-r from-green-500 to-blue-500">
  <h2>🎮 Demo Mode Aktivan</h2>
  <p>Istraži sve funkcionalnosti bez registracije!</p>
</motion.div>
```

---

## 📊 Funkcionalnosti u Demo Mode

| Feature | Status | Opis |
|---------|--------|------|
| **Dashboard** | ✅ Radi | Mock XP, level, homework count |
| **Domaći Zadaci** | ✅ Radi | Mock homework lista sa seed podacima |
| **Ocene** | ✅ Radi | Mock grades iz baze |
| **Raspored** | ✅ Radi | Mock schedule sa demo predmetima |
| **Profil** | ✅ Radi | Mock student profile |
| **Porodica** | ✅ Radi | Mock guardian links |
| **Upload Fotografija** | ✅ Radi | Čuva u `/public/uploads/` |
| **Celebration Animacije** | ✅ Radi | Puni confetti experience |
| **Accessibility** | ✅ Radi | useFocusTrap u modalima |

---

## 🚀 Quick Start

### 1. Aktiviraj Demo Mode

```bash
# .env.local
NEXT_PUBLIC_DEMO_MODE="true"
```

### 2. Pokreni aplikaciju

```bash
npm run dev
```

### 3. Otvori browser

```
http://localhost:3000
```

**Automatski redirect** na dashboard! 🎉

---

## 🔧 Kako isključiti Demo Mode?

### Za production deploy:

```bash
# .env.production
NEXT_PUBLIC_DEMO_MODE="false"
```

### Za development sa real auth:

```bash
# .env.local
NEXT_PUBLIC_DEMO_MODE="false"
# ili obriši liniju
```

Restartuj server:
```bash
npm run dev
```

---

## 📝 API Routes - Demo Mode Integration

### Primer: Homework API

**Pre (sa real auth)**:
```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of logic
}
```

**Posle (sa demo mode)**:
```typescript
import { getAuthSession } from "@/lib/auth/demo-mode";

export async function GET(request: NextRequest) {
  const session = await getAuthSession(auth);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of logic (radi identično!)
}
```

**Rezultat**: 
- Demo mode → Mock session uvek vraća `demo-student-id`
- Production → Real auth provera

---

## 🎯 Best Practices

### ✅ DO:
- Uvek koristi `getAuthSession(auth)` u API routes
- Dodaj vizuelne indikatore za demo mode (banner, badge)
- Mock podaci realistični (seed data iz `prisma/seed.ts`)
- Demo mode samo u development/staging

### ❌ DON'T:
- Demo mode u production bez clear warning
- Hardkodovani mock podaci u biznis logici
- Ignoriši security provere jer je "samo demo"
- Zaboravi da isključiš demo mode pre deploya

---

## 🐛 Troubleshooting

### Problem: "Demo mode ne radi"

**Check**:
1. `.env.local` ima `NEXT_PUBLIC_DEMO_MODE="true"`
2. Server restartovan nakon env promene
3. Browser cache cleared (Ctrl+Shift+R)

### Problem: "Redirectuje me na login"

**Check**:
1. Middleware active: `middleware.ts` ima demo mode logic
2. Environment variable vidljiva: `console.log(process.env.NEXT_PUBLIC_DEMO_MODE)`
3. Auth pages u `authPages` array-u

### Problem: "API returns 401 Unauthorized"

**Check**:
1. API route koristi `getAuthSession(auth)` umesto `auth()`
2. `isDemoMode()` vraća `true` (log u funkciji)
3. Session u API route logs: `console.log(session)`

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Auto-redirect logic |
| `lib/auth/demo-mode.ts` | Helper functions |
| `app/(dashboard)/dashboard/page.tsx` | Demo banner |
| `.env.local` | Environment config |
| `prisma/seed.ts` | Mock data |

---

## 🎉 Benefits

- ⚡ **Instant access** - 0 clicks, 0 forms
- 🚀 **Fast iteration** - Skip auth flow during development
- 🎯 **Better demos** - Show features immediately
- 🧪 **Easy testing** - No need for test accounts
- 📊 **Real experience** - Full app functionality, no mocks in UI

---

**Napomena**: Demo mode je development feature. Za production, uvek koristi real authentication! 🔒
