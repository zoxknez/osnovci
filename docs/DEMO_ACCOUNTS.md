# 🎮 Demo Nalozi - Osnovci

## 📋 Kompletna Lista (20 Naloga)

Svi demo nalozi imaju **istu lozinku**: `demo123`

### Brza Prijava
Posetite **https://osnovci.vercel.app/prijava** i kliknite na bilo koji demo nalog za trenutni pristup!

---

## 👨‍🎓 Demo Učenici (1-20)

| # | Ime | Email | Lozinka | Razred |
|---|-----|-------|---------|--------|
| 1 | Demo Učenik 1 | demo1@osnovci.rs | demo123 | 5-A |
| 2 | Demo Učenik 2 | demo2@osnovci.rs | demo123 | 5-B |
| 3 | Demo Učenik 3 | demo3@osnovci.rs | demo123 | 6-A |
| 4 | Demo Učenik 4 | demo4@osnovci.rs | demo123 | 6-B |
| 5 | Demo Učenik 5 | demo5@osnovci.rs | demo123 | 7-A |
| 6 | Demo Učenik 6 | demo6@osnovci.rs | demo123 | 7-B |
| 7 | Demo Učenik 7 | demo7@osnovci.rs | demo123 | 8-A |
| 8 | Demo Učenik 8 | demo8@osnovci.rs | demo123 | 8-B |
| 9 | Demo Učenik 9 | demo9@osnovci.rs | demo123 | 5-A |
| 10 | Demo Učenik 10 | demo10@osnovci.rs | demo123 | 5-B |
| 11 | Demo Učenik 11 | demo11@osnovci.rs | demo123 | 6-A |
| 12 | Demo Učenik 12 | demo12@osnovci.rs | demo123 | 6-B |
| 13 | Demo Učenik 13 | demo13@osnovci.rs | demo123 | 7-A |
| 14 | Demo Učenik 14 | demo14@osnovci.rs | demo123 | 7-B |
| 15 | Demo Učenik 15 | demo15@osnovci.rs | demo123 | 8-A |
| 16 | Demo Učenik 16 | demo16@osnovci.rs | demo123 | 8-B |
| 17 | Demo Učenik 17 | demo17@osnovci.rs | demo123 | 5-A |
| 18 | Demo Učenik 18 | demo18@osnovci.rs | demo123 | 5-B |
| 19 | Demo Učenik 19 | demo19@osnovci.rs | demo123 | 6-A |
| 20 | Demo Učenik 20 | demo20@osnovci.rs | demo123 | 6-B |

---

## 🎯 Kako Koristiti Demo Naloge

### Metod 1: Brza Prijava (Preporučeno) 🚀
1. Idite na https://osnovci.vercel.app/prijava
2. **Kliknite na bilo koji demo nalog** iz liste
3. Automatski ste ulogovani - bez unošenja lozinke!

### Metod 2: Manuelni Unos
1. Idite na https://osnovci.vercel.app/prijava
2. Scroll-ujte do "ili koristi postojeći nalog"
3. Unesite email (npr. `demo1@osnovci.rs`)
4. Unesite lozinku: `demo123`
5. Kliknite "Prijavi se"

---

## ✨ Šta Možete Testirati

### 📚 Domaći Zadaci
- ✅ Pregledajte postojeće zadatke
- ✅ Dodajte nove zadatke
- ✅ Označite zadatke kao završene
- ✅ Dodajte foto dokaze (Camera API)
- ✅ Testiranje offline moda

### 📊 Ocene
- ✅ Pregledajte ocene po predmetima
- ✅ Analitika performansi
- ✅ Grafički prikazi
- ✅ Prosek ocena

### 📅 Raspored
- ✅ Nedeljni raspored časova
- ✅ Pregled po danima
- ✅ Podsetnici za časove

### 👨‍👩‍👧 Porodica
- ✅ Generisanje QR koda za povezivanje
- ✅ Link kod za roditelje
- ✅ Pregled povezanih članova

### 🎮 Gamifikacija
- ✅ XP sistem
- ✅ Leveli i napredovanje
- ✅ Achievements (bedževi)
- ✅ Streaks (niz dana)

### 🎨 Personalizacija
- ✅ Dark/Light mode
- ✅ Dyslexia mode
- ✅ Text-to-speech
- ✅ Font veličina

---

## 🔧 Tehnički Detalji

### Demo Mode Configuration
Demo nalozi rade **bez database connection** na Vercel deploymentu.

**Environment varijable** (Vercel Dashboard):
```env
DEMO_MODE="true"
NEXT_PUBLIC_DEMO_MODE="true"
```

### Kako Funkcioniše
1. **Login detektuje demo email** pattern (`demo\d+@osnovci.rs`)
2. **Verifikuje password** (`demo123`)
3. **Bypass-uje database** i vraća mock user object
4. **Session kreiran** sa mock podacima
5. **Pun pristup aplikaciji** bez database-a

### Mock User Struktura
```typescript
{
  id: "demo-user-1",
  email: "demo1@osnovci.rs",
  role: "STUDENT",
  locale: "sr_RS",
  theme: "light",
  student: {
    id: "demo-student-1",
    className: "5-B",
    grade: 5,
    points: 1200,
    level: 12,
    streak: 7,
    achievements: []
  }
}
```

---

## 📱 Mobile Optimizacije

### Touch-Friendly Design
- ✅ **44px minimum touch targets** (Apple HIG)
- ✅ **Swipe gestures** za navigaciju
- ✅ **Pull-to-refresh** na listama
- ✅ **Haptic feedback** (gde je dostupno)

### Responsive Grid
- **Mobile**: Vertikalna lista sa scroll-om (max 320px visine)
- **Desktop**: 2-column grid layout (max 360px visine)

### Smooth Scrolling
- Custom scrollbar (`scrollbar-thin`)
- Scroll hint tekst ("⬇️ Scroll za više demo naloga")
- Auto-hide scrollbar na mobile

---

## 🚀 Demo Mode za Prezentacije

### Idealno za:
- ✅ **Product demos** - Pokažite sve feature-e bez setup-a
- ✅ **Client presentations** - Instant pristup
- ✅ **Testing** - 20 različitih user scenario
- ✅ **Development** - Brzo testiranje promena
- ✅ **Onboarding** - Novi team članovi mogu istražiti app

### Quick Access URLs
- **Login**: https://osnovci.vercel.app/prijava
- **Dashboard**: https://osnovci.vercel.app/dashboard (posle login-a)
- **Homework**: https://osnovci.vercel.app/zadaci
- **Grades**: https://osnovci.vercel.app/ocene
- **Schedule**: https://osnovci.vercel.app/raspored
- **Family**: https://osnovci.vercel.app/porodica

---

## ⚠️ Napomene

### Ograničenja Demo Modea
- ❌ **Nema persistentnih podataka** - svaka sesija počinje od početka
- ❌ **Ne možete registrovati nove naloge** - samo demo nalozi dostupni
- ❌ **Email notifikacije ne rade** - nema SMTP konfiguracije
- ❌ **File uploads** - slike se ne čuvaju permanentno
- ❌ **Push notifications** - ne funkcioniše bez backend-a

### Production Setup
Za **punu funkcionalnost** potrebno je:
1. PostgreSQL database (Supabase/Neon/Vercel Postgres)
2. SMTP server za emails (Gmail/SendGrid)
3. Redis za rate limiting (Upstash)
4. Vercel Blob za file uploads
5. Sentry za error tracking

Detaljna uputstva: `docs/DEPLOY.md`

---

## 📞 Podrška

- **GitHub Issues**: https://github.com/zoxknez/osnovci/issues
- **Documentation**: `docs/` folder
- **Project Structure**: `docs/PROJECT_STRUCTURE.md`
- **Deployment Guide**: `docs/DEPLOY.md`

---

**Last Updated**: 2025-10-21  
**Demo Mode Version**: 1.0.0
