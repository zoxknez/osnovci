# 🎓 Osnovci - Modern School Companion AppThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



**Ultra-modern PWA aplikacija za učenike osnovne škole i njihove roditelje**## Getting Started



![Status](https://img.shields.io/badge/status-MVP%20v1-success)First, run the development server:

![Next.js](https://img.shields.io/badge/Next.js-15.5-black)

![React](https://img.shields.io/badge/React-19.1-blue)```bash

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)npm run dev

![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8)# or

yarn dev

---# or

pnpm dev

## ✨ Implementirane Features# or

bun dev

### 🏠 **Dashboard (Danas)**```

- **Live statistika** - Aktivni domaći, nedeljni časovi, nove ocene

- **Današnji raspored** - Timeline prikaz časovaOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **Skoriji domaći** - 3 najskorija zadatka

- **Status indicators** - Prosli rokovi, hitno, etc.You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.



### 📚 **Domaći zadaci**This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- ✅ CRUD interface sa pregledom, dodavanjem, izmenom

- 🔍 Advanced filtering (pretraga, status, predmet)## Learn More

- 📸 **Camera Integration** - AI document enhancement

- 🎯 Status tracking (Dodeljeno, U toku, Gotovo)To learn more about Next.js, take a look at the following resources:

- 🏷️ Priority badges (Normal, Important, Urgent)

- 🎨 Subject colors (svaki predmet ima boju)- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- 📎 Attachment counter- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.



### 📅 **Raspored časova**You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- 📆 Day/Week view toggle

- 🔴 **LIVE indicator** - Real-time trenutni čas## Deploy on Vercel

- 🗓️ Week navigation sa calendar buttonima

- ⭐ Today highlightThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

- 📋 Subject cards (predmet, učitelj, učionica)

- 🔢 Class number badgesCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


### 📊 **Ocene & Analitika**
- 📈 **Charts**: Trend line, Radar profil, Bar distribucija
- 📊 Stats cards (prosek, odličnih, petica, ukupno)
- 📚 Subject cards sa trendom (up/down/stable)
- 🏆 **Achievements** sistema
- 💾 Export funkcionalnost

### 👨‍👩‍👧 **Family Linking**
- 📱 **QR Code generation** (6-digit)
- 🔗 Manual linking opcija
- 👥 Family members lista
- 🔒 **Permissions management** (6 types)
- 🛡️ Security notice

### ⚙️ **Podešavanja**
- 👤 Profile section (avatar, info)
- 🎨 Theme selector (Light/Dark/Auto)
- 🌍 Language (Srpski/English)
- 🔔 Notifications (4 types sa toggle)
- 🔐 Security (password, biometric, 2FA)

---

## 🚀 Ultra-Modern PWA Stack

### ✅ **Service Worker** (Workbox)
```javascript
✓ Precaching (HTML, CSS, JS, Fonts)
✓ Image cache (CacheFirst, 30 days)
✓ API cache (NetworkFirst, 5 min)
✓ Background sync (offline queue)
✓ Push notifications (ready)
```

### 💾 **Offline Storage** (IndexedDB)
```javascript
✓ homework store
✓ attachments store  
✓ pending-sync queue
✓ Full CRUD API
✓ Auto-sync when online
```

### 📸 **Modern Camera**
```javascript
✓ AI Document Enhancement
✓ Auto-contrast + brightness
✓ Face/Environment switching
✓ Gallery import fallback
✓ Haptic feedback
```

---

## 🛠️ Tech Stack

```
Frontend:
├── Next.js 15.5      → React framework + App Router
├── React 19.1        → Latest React features
├── Tailwind CSS 4    → Utility-first CSS
├── Turbopack         → Ultra-fast bundler
├── Framer Motion 12  → Advanced animations
└── Recharts          → Beautiful charts

Backend:
├── NextAuth.js v5    → Authentication (beta)
├── Prisma 6.17       → Type-safe ORM
└── SQLite/PostgreSQL → Database

State & PWA:
├── Zustand           → State management
├── IndexedDB (idb)   → Offline storage
└── Workbox           → Service Worker toolkit

UI/UX:
├── Lucide React      → Icons
├── Sonner            → Toast notifications
├── React Hook Form   → Forms + Zod validation
└── react-qr-code     → QR generation

Dev Tools:
├── Biome             → Linter + Formatter
├── TypeScript        → Type safety
└── tsx               → TypeScript runner
```

---

## 📊 Database Schema

**15+ Models:**
- User, Student, Guardian, Link (family)
- Subject, StudentSubject, Homework, Attachment
- ScheduleEntry, Event, Notification, Session
- WeeklyReport (ready for future)

**Enums:**
- UserRole, Language, Theme, DayOfWeek
- HomeworkStatus, Priority, EventType

---

## 🎯 Demo Account

**Student:**
```
Email: ucenik@demo.rs
Password: demo123
```

**Guardian:**
```
Email: roditelj@demo.rs
Password: demo123
```

**Demo Data:**
- ✅ 3 subjects (Matematika, Srpski, Engleski)
- ✅ 3 homework assignments
- ✅ Schedule for Monday (3 classes)
- ✅ Link code: DEMO123

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run db:push

# 3. Seed demo data
npm run db:seed

# 4. Start dev server
npm run dev
```

Open **http://localhost:3000** (or 3001)

---

## 📱 PWA Installation

1. ✅ Open app in Chrome/Edge
2. ✅ Service Worker auto-registers
3. ✅ Install prompt appears
4. ✅ Click "Install"
5. ✅ Works offline! ✨

---

## 🎨 Design System

**Colors:**
```css
Primary:  #3b82f6 (Blue)
Success:  #10b981 (Green)
Warning:  #f59e0b (Orange)
Error:    #ef4444 (Red)
Purple:   #8b5cf6 (Special)
```

**Animations:**
```javascript
fadeInUp, slideIn, scaleIn, bounceIn
stagger, pulse, confetti, hoverScale
```

**Typography:**
```
Font: Inter (Variable)
Weights: 400, 500, 600, 700, 800
Locale: SR (Serbian)
```

---

## 🎭 Key Features

| Feature | Status | Tech |
|---------|--------|------|
| Dashboard | ✅ MVP | Next.js 15 + Framer Motion |
| Homework | ✅ MVP | Camera API + IndexedDB |
| Schedule | ✅ MVP | date-fns + SR locale |
| Grades | ✅ MVP | Recharts (3 chart types) |
| Family Link | ✅ MVP | QR Code + Permissions |
| Settings | ✅ MVP | Theme + i18n ready |
| PWA | ✅ MVP | Workbox + Service Worker |
| Offline | ✅ MVP | IndexedDB + Sync Queue |

---

## 📂 Project Structure

```
osnovci/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (dashboard)/     # Main app pages
│   │   ├── domaci/      # Homework
│   │   ├── raspored/    # Schedule
│   │   ├── ocene/       # Grades
│   │   ├── porodica/    # Family
│   │   └── podesavanja/ # Settings
│   ├── api/
│   │   └── auth/        # NextAuth routes
│   └── layout.tsx       # Root layout + PWA
├── components/
│   ├── ui/              # Button, Card, Input
│   └── features/        # Camera, PWA, Sync
├── lib/
│   ├── auth/            # NextAuth config
│   ├── db/              # Prisma, IndexedDB
│   ├── animations/      # Framer Motion
│   └── utils/           # Helpers
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Demo data
├── public/
│   ├── sw.js            # Service Worker
│   ├── manifest.json    # PWA manifest
│   └── icons/           # App icons
└── types/               # TypeScript types
```

---

## 🔮 Future Roadmap

- [ ] Real-time sync sa backend
- [ ] Push notifications za ocene
- [ ] Chat (učenik ↔ roditelj)
- [ ] Nedeljni izveštaji
- [ ] Praćenje prisustva
- [ ] PDF export
- [ ] Kalendar događaja
- [ ] Social features
- [ ] Gamification

---

## 🎯 Best Practices

✅ **Modern Stack** - Latest versions (Next 15, React 19)  
✅ **Type Safety** - Full TypeScript coverage  
✅ **Performance** - Turbopack, code splitting, lazy loading  
✅ **Offline First** - PWA + IndexedDB + Service Worker  
✅ **Mobile First** - Responsive design  
✅ **Accessibility** - Semantic HTML, ARIA  
✅ **DX** - Biome (fast linting), Hot reload  
✅ **Security** - NextAuth v5, bcrypt, env variables  

---

## 📄 License

© 2025 Osnovci. All rights reserved.

---

## 🙏 Acknowledgments

Built with ❤️ using:
- Next.js Team
- Vercel
- Prisma
- Tailwind Labs
- Framer
- Recharts

Made with 🇷🇸 in Serbia

---

**Star ⭐ this repo if you like it!**
