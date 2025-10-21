# 📱 Mobile Testing Guide - Osnovci

## 🔧 Local Network Access Setup

### Prerequisites
- Desktop i mobilni uređaj na **istoj WiFi mreži**
- Development server pokrenut (`npm run dev`)

---

## 📍 Network Address

**Development server je dostupan na:**

```
Local:    http://localhost:3000
Network:  http://192.168.1.101:3000
```

### Kako pristupiti sa mobilnog:

1. **Pronađi IP adresu desktop računara**
   ```powershell
   # Windows
   ipconfig
   
   # Traži "IPv4 Address" pod WiFi adapterom
   # Primer: 192.168.1.101
   ```

2. **Otvori browser na mobilnom**
   - Unesi: `http://192.168.1.101:3000`
   - Ili scan QR kod (ako koristiš Next.js CLI)

3. **Accept security warning** (ako postoji)
   - Klikni "Proceed" ili "Advanced"
   - Normalno je za development server

---

## 🛡️ Security Headers & CSP

### Development Mode (Relaxed)
CSP policy je **relaksiraniji** u development modu za lakše testiranje:

```
default-src 'self' 'unsafe-inline' 'unsafe-eval';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https: http:;
font-src 'self' data: https: http:;
connect-src 'self' https: http: ws: wss:;
```

**Razlog:** Omogućava:
- ✅ Hot Module Replacement (HMR) preko WebSocket
- ✅ HTTP resurse (ne samo HTTPS)
- ✅ Inline styles i scripts (za Turbopack/Webpack)
- ✅ Local network access

### Production Mode (Strict)
Na Vercel deploymentu CSP je **stroži**:

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com;
img-src 'self' blob: data: https:;
connect-src 'self' https: wss: https://vitals.vercel-insights.com;
upgrade-insecure-requests;
```

---

## 🚨 Common Mobile Issues & Solutions

### 1. **"Cannot access http://192.168.1.101:3000"**

**Uzrok:** Firewall blokira pristup

**Rešenje:**
```powershell
# Windows Firewall - Dodaj inbound rule za port 3000
New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

Ili manualno:
1. Windows Defender Firewall
2. Advanced settings
3. Inbound Rules → New Rule
4. Port 3000, TCP, Allow

---

### 2. **"ERR_CONNECTION_REFUSED"**

**Uzrok:** Server nije pokrenut ili ne sluša na network interface-u

**Rešenje:**
```bash
# Proveri da li server radi
npm run dev

# Trebalo bi da vidiš:
# - Network: http://192.168.1.101:3000
```

Ako ne vidiš Network adresu:
```json
// package.json - dodaj --host
"dev": "next dev --turbopack --host 0.0.0.0"
```

---

### 3. **White screen / Blank page**

**Uzrok:** CSP blokira resurse ili JavaScript

**Rešenje:**
1. Otvori DevTools na mobilnom (Chrome Remote Debugging)
2. Proveri Console za CSP greške
3. Verifikuj da je `next.config.ts` ima relaxed CSP za development

```typescript
// next.config.ts
async headers() {
  const ContentSecurityPolicy = (process.env.NODE_ENV === "production"
    ? /* strict CSP */
    : /* relaxed CSP */ // ← Ovo treba biti aktivno u dev modu
  )
  .replace(/\s{2,}/g, " ")
  .trim();
  // ...
}
```

---

### 4. **"Mixed Content" warning**

**Uzrok:** HTTPS stranica pokušava učitati HTTP resurse

**Rešenje:**
- U **development**: Normalno, može se ignorisati
- U **production**: Sve mora biti HTTPS (auto-fixed sa `upgrade-insecure-requests`)

---

### 5. **Camera/Microphone ne radi**

**Uzrok:** Browser permissions ili HTTPS requirement

**Rešenje:**
- Modern Camera API zahteva **HTTPS** ili **localhost**
- Za testiranje na mobilnom preko lokalne mreže (HTTP):
  ```typescript
  // Dodaj exception za development
  if (process.env.NODE_ENV === "development") {
    // Allow camera access over HTTP in dev
  }
  ```
- **Bolje rešenje**: Koristi [ngrok](https://ngrok.com) za HTTPS tunel:
  ```bash
  ngrok http 3000
  # Daje HTTPS URL: https://abc123.ngrok.io
  ```

---

### 6. **Push Notifications ne rade**

**Uzrok:** Service Worker ne može se registrovati preko HTTP

**Rešenje:**
- Service Workers zahtevaju **HTTPS** ili **localhost**
- Koristi ngrok za testiranje push notifikacija
- Ili testiraj direktno na Vercel deploymentu

---

## 🔍 Chrome Remote Debugging

### Setup (Android):
1. **Enable USB Debugging** na Android uređaju
   - Settings → About Phone → Tap "Build Number" 7x
   - Developer Options → USB Debugging ON

2. **Connect phone to PC** preko USB kabla

3. **Otvori Chrome DevTools**
   ```
   chrome://inspect/#devices
   ```

4. **Klikni "Inspect"** na mobilnom browser tab-u

5. **Vidi Console, Network, Elements** u real-time!

### Setup (iOS - Safari):
1. **Enable Web Inspector** na iPhone-u
   - Settings → Safari → Advanced → Web Inspector ON

2. **Connect iPhone to Mac** preko USB

3. **Otvori Safari DevTools** na Mac-u
   - Develop → [Your iPhone Name] → [Website]

4. **Debug mobilni Safari** kao desktop browser!

---

## 📊 Performance Testing on Mobile

### Lighthouse Audit (Mobile)
```bash
npm run lighthouse

# Ili direktno:
npx lighthouse http://192.168.1.101:3000 --view --preset=perf --emulated-form-factor=mobile
```

### Network Throttling
U Chrome DevTools:
1. Network tab
2. Dropdown: "Fast 3G" ili "Slow 3G"
3. Test performance na sporom internetu

---

## 🎯 Test Checklist

### Basic Functionality
- [ ] Login page loads
- [ ] Demo Login button works
- [ ] Manual login works
- [ ] Dashboard accessible
- [ ] Navigation working

### Mobile-Specific
- [ ] Touch targets ≥ 44px
- [ ] Scroll smooth
- [ ] No horizontal scroll
- [ ] Keyboard opens correctly for inputs
- [ ] Buttons responsive to tap

### PWA Features
- [ ] "Add to Home Screen" prompt shows
- [ ] App installs correctly
- [ ] Offline mode works
- [ ] App icon displays

### Camera & Media
- [ ] Camera access works (preko HTTPS/ngrok)
- [ ] Image upload/compression works
- [ ] Images display correctly

---

## 🌐 ngrok Setup (for HTTPS testing)

### Installation
```bash
# Download ngrok
# https://ngrok.com/download

# Unzip i dodaj u PATH
# Windows: C:\ngrok\ngrok.exe
```

### Usage
```bash
# Start Next.js server
npm run dev

# U drugom terminalu:
ngrok http 3000

# Ngrok daje HTTPS URL:
# Forwarding: https://abc123.ngrok-free.app -> http://localhost:3000
```

### Korist:
✅ HTTPS pristup za Camera API  
✅ Push Notifications testiranje  
✅ Service Worker registracija  
✅ Share sa drugima preko interneta  

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
Default:     0-639px   (mobile)
sm:         640px+     (tablet)
md:         768px+     (desktop)
lg:        1024px+     (large desktop)
xl:        1280px+     (extra large)
2xl:       1536px+     (ultra wide)
```

### Test na različitim veličinama:
```
iPhone SE:       375 x 667
iPhone 12/13:    390 x 844
iPhone 14 Pro:   430 x 932
Samsung Galaxy:  412 x 915
iPad:            768 x 1024
```

---

## 🐛 Debugging Tips

### Enable Verbose Logging
```typescript
// lib/logger.ts
export const log = {
  info: (msg: string, meta?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${msg}`, meta);
    }
  }
};
```

### Check Environment Variables
```bash
# Console log u komponenti
console.log("ENV:", process.env.NODE_ENV);
console.log("DEMO_MODE:", process.env.NEXT_PUBLIC_DEMO_MODE);
```

### Monitor Network Requests
- Chrome DevTools → Network tab
- Filter by XHR/Fetch
- Proveri API response status codes

---

## 📞 Support

**Issue sa mobilnim?** Proveri:
1. CSP policy u `next.config.ts`
2. Middleware permissions u `middleware.ts`
3. Browser console errors (Chrome Remote Debugging)
4. Network tab za failed requests

**Još uvek ne radi?**
- Otvori issue: https://github.com/zoxknez/osnovci/issues
- Include: Browser, OS, error message, screenshot

---

**Last Updated**: 2025-10-21  
**Tested On**: Android Chrome, iOS Safari, Desktop browsers
