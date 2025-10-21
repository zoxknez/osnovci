# 🎯 Vercel Environment Variables Setup

## Obavezni koraci za demo mode login

Vercel deployment neće raditi dok ne dodaš ove environment varijable.

### 📍 Gde dodati varijable?

1. Idi na **Vercel Dashboard**: https://vercel.com/dashboard
2. Otvori projekat **"osnovci"**
3. Idi na **Settings** → **Environment Variables**

### 🔑 Varijable koje treba dodati:

Kopiraj i nalepi ove vrednosti (jedna po jedna):

#### **DEMO_MODE**
```
Name: DEMO_MODE
Value: true
Environment: Production, Preview, Development (check all)
```

#### **NEXT_PUBLIC_DEMO_MODE**
```
Name: NEXT_PUBLIC_DEMO_MODE
Value: true
Environment: Production, Preview, Development (check all)
```

### ✅ Provera

Nakon što dodaš varijable:

1. **Redeploy projekat**:
   - U Vercel Dashboard → Deployments
   - Klikni na latest deployment
   - Klikni "Redeploy"

2. **Sačekaj 1-2 minute** da se deployment završi

3. **Testiraj login**:
   - Idi na https://osnovci.vercel.app/prijava
   - Email: `demo1@osnovci.rs`
   - Password: `demo123`
   - Klikni "Prijavi se"

### 🎮 Demo nalozi koji rade:

```
demo1@osnovci.rs  / demo123
demo2@osnovci.rs  / demo123
demo3@osnovci.rs  / demo123
demo4@osnovci.rs  / demo123
demo5@osnovci.rs  / demo123
... (do demo20)
```

### ❓ Šta ako i dalje ne radi?

1. Proveri da li si **odabrao sve environment** (Production, Preview, Development)
2. Obavezno **redeploy** nakon dodavanja varijabli
3. Otvori browser konzolu (F12) i vidi da li ima grešaka
4. Proveri da li Vercel build log pokazuje neke greške

### 🔧 Dodatno (opciono za kasnije)

Ako želiš da aktiviraš database i full funkcionalnost:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

Ali za **demo mode**, samo **DEMO_MODE** i **NEXT_PUBLIC_DEMO_MODE** su potrebni!
