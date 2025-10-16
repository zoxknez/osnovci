# 📝 KORAK 4: UPDATE REGISTRACIJA - DETALJNI VODIČE

**Status:** 🔄 SPREMAN ZA POKRETANJE  
**Vrijeme Procjene:** 15-20 minuta  
**Kompleksnost:** Srednja  

---

## 🎯 ŠTA TREBAMO POSTIĆI

```
CILJ: Update registracija da šalje verification email

TREBAM:
1. Ažurirati app/api/auth/register/route.ts
   └─ Nakon kreiranja user-a
   └─ Pozovi createAndSendVerificationEmail()
   └─ Vrati success ali NE login odmah
   └─ Preusmjeri na verify-pending stranicu

2. Kreiraj verify-pending stranica
   └─ Informira user-a da provjeri email
   └─ Prikaži email
   └─ Resend email opcija
```

---

## 📝 KORAK 4A: UPDATE REGISTRACIJA ENDPOINT

### Trenutna Registracija

Prvo pročitaj gdje se kreira user:

```bash
# Otvori registraciju
cat app/api/auth/register/route.ts | head -100
```

### Šta Trebam Promijeniti

Nakon što se user kreiraj:

```
PRIJE (trenutno):
└─ Kreiraj user
└─ Odmah vrati success
└─ User se odmah može login-ati
└─ ❌ NE šalje verification email

NAKON (trebam):
└─ Kreiraj user
└─ Pozovi createAndSendVerificationEmail()
└─ Vrati success ALI bez session/token-a
└─ Preusmjeri na verify-pending stranicu
└─ ✅ Šalje verification email
```

### Kod Koji Trebam Dodati

U `app/api/auth/register/route.ts`, nakon kreiranja user-a:

```typescript
// Primjer kako trebam dodati (pseudokod):

const user = await prisma.user.create({
  // ... existing code ...
});

// ✅ NOVO - Slanje verification email
try {
  const userName = user.student?.name || user.guardian?.name || 'User';
  await createAndSendVerificationEmail(user.email!, userName);
} catch (error) {
  log.error('Failed to send verification email', { error });
  // Ne zaustavlja registraciju, ali loguira gresku
}

// ✅ NOVO - Vrati bez session-a
return NextResponse.json(
  {
    success: true,
    message: 'Registracija uspješna! Provjeri email za verifikaciju.',
    email: user.email,
    // NE šalji user.id ili session token
  },
  { status: 201 },
);
```

---

## 🖥️ KORAK 4B: VERIFY-PENDING STRANICA

### Lokacija:
```
d:\ProjektiApp\osnovci\app\(auth)\verify-pending\page.tsx
```

### Šta Trebam:

Stranica koja prikazuje:
1. Informaciju da provjeri email
2. Prikazuje koji email je korišćen
3. Resend email opcija
4. Logout dugme

---

## ✅ CHECKLIST KORAK 4

```
REGISTRATION ENDPOINT UPDATE:
☐ Odaberi app/api/auth/register/route.ts
☐ Dodaj import za createAndSendVerificationEmail
☐ Nakon user.create(), pozovi createAndSendVerificationEmail()
☐ Try-catch oko email slanja
☐ Vrati success bez session-a
☐ Preusmjeri na verify-pending
☐ TypeScript bez greške

VERIFY-PENDING STRANICA:
☐ Kreirao app/(auth)/verify-pending/page.tsx
☐ Prikazuje email
☐ Resend email funkcionalnost
☐ Logout dugme
☐ Child-friendly dizajn
☐ TypeScript bez greške

TESTIRANJE:
☐ npm run build - bez greške
☐ Testiraj kompletan registracija tok
☐ Provjeri email slanje
☐ Klikni link i verificiraj
```

---

## 🧪 KAKO TESTIRAJ

### Test 1: Kompletan Tok

```bash
1. Idi na http://localhost:3000/auth/registracija
2. Registriraj se
   ├─ Email: test@example.com
   ├─ Password: Password123
   └─ Ime: Test User

3. Trebam biti preusmeran na /auth/verify-pending
   ├─ Prikazuje test@example.com
   ├─ Poruka da provjeri email

4. Provjeri Ethereal email
   ├─ Idi na https://ethereal.email/messages
   ├─ Logiraj se sa test korisnici...
   ├─ Trebam vidjeti verification email

5. Klikni na verification link
   ├─ Trebam biti preusmeran na /auth/verify-success
   ├─ Prikazuje email koji je verificiran

6. Sada možeš login-ati
   ├─ Idi na /auth/prijava
   ├─ Koristi email i password
   ├─ Trebam biti preusmeran na dashboard
```

### Test 2: Resend Email

```bash
1. Registriraj se
2. Idi na verify-pending stranicu
3. Klikni "Zatraži Novi Email"
4. Trebam vidjeti novi verification email
5. Stari token se obriše (samo 1 aktivan odjednom)
```

### Test 3: Expired Token

```bash
1. Registriraj se
2. Čekaj 24+ sata (ili edit dev.db)
3. Klikni link iz email-a
4. Trebam biti preusmeran na verify-error
5. Trebam vidjeti "Token has expired"
6. Mogu zatraži novi email
```

---

## 🚀 SLEDEĆE NAKON KORAK 4

Kada završim Korak 4:

1. **Login Zahtjev**
   ```typescript
   └─ Provjeri da li je email verificiran
   └─ Ako nije: Vrati gresku ili redirect na verify-pending
   ```

2. **Forgot Password**
   ```typescript
   └─ Slanje password reset email
   └─ Isti sistem kao email verification
   ```

3. **API Protection**
   ```typescript
   └─ Ako email nije verificiran
   └─ Odredi pristup dashboard i drugim API-jima
   ```

---

## 📚 RESURSI

- Prisma docs: https://www.prisma.io/docs
- NextAuth docs: https://next-auth.js.org
- Ethereal email: https://ethereal.email
- SendGrid docs: https://docs.sendgrid.com

