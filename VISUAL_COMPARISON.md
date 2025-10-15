# 🎨 VIZUELNI PRIKAZ PROMENA

## 📅 DAN SELECTOR - BEFORE vs AFTER

### BEFORE (Staro):
```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Pon  │ │ Uto  │ │ Sre  │ │ Čet  │ │ Pet  │
│  15  │ │  16  │ │  17  │ │  18  │ │  19  │
│4 časa│ │3 časa│ │5 časa│ │4 časa│ │2 časa│
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘
  64px     64px     64px     64px     64px
  
Problemi:
❌ Premalo (64px)
❌ Jednostavan dizajn
❌ Loša hijerarhija
❌ Nedostaje today indicator
```

### AFTER (Novo):
```
┌────────┐ ┌────────┐ ╔════════╗ ┌────────┐ ┌────────┐
│  PON • │ │  UTO   │ ║  SRE   ║ │  ČET   │ │  PET   │
│   15   │ │   16   │ ║   17   ║ │   18   │ │   19   │
│▓4 časa▓│ │▓3 časa▓│ ║▓5 časa▓║ │▓4 časa▓│ │▓2 časa▓│
└────────┘ └────────┘ ╚════════╝ └────────┘ └────────┘
   72px      72px       72px       72px       72px
  (today)  (regular) (SELECTED)  (regular)  (regular)

Features:
✅ Veći (72x88px)
✅ Gradient na selected
✅ Ring na today
✅ Pill badge
✅ Dot indicator
✅ White border
✅ Shadow effects
```

---

## 🍔 HAMBURGER MENI - BEFORE vs AFTER

### BEFORE:
```
┌──────┐
│  ≡   │  ← Mala Menu ikona (siva)
└──────┘
  24px
```

### AFTER:
```
┌──────┐
│ ▬▬▬  │  ← 3 tamne linije
│ ▬▬▬  │     Svaka 0.5px debljine
│ ▬▬▬  │     gray-800 boja
└──────┘
  28px + padding

✅ Vidljivije
✅ Veći touch target
✅ Bolji kontrast
```

---

## 📱 MOBILE HEADER - BEFORE vs AFTER

### BEFORE:
```
┌─────────────────────────────────────┐
│ ≡  Osnovci                          │
└─────────────────────────────────────┘

Samo hamburger + logo
```

### AFTER:
```
┌─────────────────────────────────────┐
│ ▬▬▬ Osnovci     📚  📅  📊        │
│ ▬▬▬                                 │
│ ▬▬▬            Quick shortcuts →    │
└─────────────────────────────────────┘

Hamburger + Logo + 3 Quick Actions
✅ Domaći (📚)
✅ Raspored (📅)
✅ Ocene (📊)
```

---

## 🎯 QUICK ACTIONS CARD - NOVA

```
┌─────────────────────────────────────┐
│  Brze prečice                       │
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │  🏠  │  │  📚  │  │  📊  │     │
│  │Danas │  │Domaći│  │Ocene │     │
│  └──────┘  └──────┘  └──────┘     │
└─────────────────────────────────────┘

Mobile only (md:hidden)
✅ Grid 3 kolone
✅ Touch-friendly
✅ Hover effects
```

---

## 🔘 NAVIGATION ARROWS - BEFORE vs AFTER

### BEFORE:
```
┌───┐       ┌───┐
│ ◄ │  ...  │ ► │
└───┘       └───┘
 36px        36px
```

### AFTER (Mobile):
```
┌─────┐       ┌─────┐
│  ◄  │  ...  │  ►  │
└─────┘       └─────┘
  40px          40px

✅ Veći touch target
✅ Square format
✅ Veće ikone (20px)
```

---

## 🎨 COLOR PALETTE

### Selected Day:
```
Gradient: from-blue-500 to-blue-600
Shadow:   shadow-lg shadow-blue-500/30
Text:     text-white
Badge:    bg-white/20 text-white
```

### Today (not selected):
```
Background: bg-white
Border:     border-2 border-gray-200
Ring:       ring-2 ring-offset-2 ring-blue-400
Dot:        bg-blue-500
```

### Regular Day:
```
Background: bg-white
Border:     border-2 border-gray-200
Hover:      border-blue-300 shadow-md
```

---

## 📐 RESPONSIVE BREAKPOINTS

### Mobile (< 640px):
- Dan selector: 72px width
- Header: Hamburger + Quick actions
- Quick Actions Card: Visible
- Navigation arrows: 40px square

### Tablet (640px - 1024px):
- Dan selector: 80px width
- Header: Same as mobile
- Quick Actions Card: Hidden
- Navigation arrows: Auto width

### Desktop (> 1024px):
- Dan selector: Auto width (fills space)
- Header: Hidden (sidebar visible)
- Quick Actions Card: Hidden
- Navigation arrows: Auto width

---

## 🎭 ANIMATION STATES

### Dan Selector:
```
Normal:     scale(1)
Hover:      scale(1.03)
Tap:        scale(0.95)
Transition: 200ms ease-out
```

### Hamburger:
```
Normal:     opacity(1)
Hover:      bg-gray-100
Active:     scale(0.95)
Transition: all 150ms
```

### Quick Actions:
```
Normal:     bg-gray-50
Hover:      bg-gray-100
Active:     bg-gray-200 + scale(0.98)
Transition: all 200ms
```

---

## 📊 METRICS SUMMARY

| Element | Width | Height | Touch | Visual |
|---------|-------|--------|-------|--------|
| **Dan selector** | 72px | 88px | ✅ | ⭐⭐⭐⭐⭐ |
| **Hamburger** | 28px | 28px | ✅ | ⭐⭐⭐⭐⭐ |
| **Nav arrows** | 40px | 40px | ✅ | ⭐⭐⭐⭐ |
| **Quick actions** | 48px | 52px | ✅ | ⭐⭐⭐⭐⭐ |
| **View toggle** | Full | 36px | ✅ | ⭐⭐⭐⭐ |

---

## 🎯 USER FLOW

### Scenario 1: Promena dana
```
1. User vidi raspored za danas
2. Swipe/scroll horizontalno kroz dane
3. Tap na željeni dan
   → Scale animation (0.95)
   → Gradient appear
   → Sadržaj se menja
4. Selected dan centriran u viewport
```

### Scenario 2: Brzi pristup
```
1. User na raspored stranici
2. Želi ići na Domaći
3. Options:
   a) Tap hamburger → Meni → Domaći (3 steps)
   b) Tap 📚 u header → Domaći (1 step) ✅
   c) Scroll dolje → Quick Actions → Domaći (2 steps)
```

### Scenario 3: Navigacija kroz nedelju
```
1. User vidi trenutnu nedelju
2. Tap ◄ arrow → Prethodna nedelja
3. Animacija: Fade out → Fade in
4. Novi dani učitani
5. Selected dan updated
```

---

## 💻 CODE SNIPPETS

### Dan Selector Component:
```tsx
<motion.button
  className={`
    w-[72px] sm:w-20 lg:w-auto 
    min-h-[88px] p-3 rounded-xl
    ${selected 
      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
      : "bg-white border-2 border-gray-200"
    }
    ${today && !selected 
      ? "ring-2 ring-offset-2 ring-blue-400" 
      : ""
    }
  `}
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.95 }}
>
  {/* Content */}
</motion.button>
```

### Hamburger Menu:
```tsx
<div className="flex flex-col gap-1.5 w-6 h-6 justify-center">
  <span className="block h-0.5 w-full bg-gray-800 rounded-full" />
  <span className="block h-0.5 w-full bg-gray-800 rounded-full" />
  <span className="block h-0.5 w-full bg-gray-800 rounded-full" />
</div>
```

### Quick Actions:
```tsx
<Link 
  href="/dashboard/domaci"
  className="flex flex-col items-center gap-2 p-3 
    rounded-xl bg-gray-50 hover:bg-gray-100 
    active:bg-gray-200 transition-all 
    touch-manipulation"
>
  <span className="text-2xl">📚</span>
  <span className="text-xs font-medium">Domaći</span>
</Link>
```

---

## 🎉 FINAL RESULT

```
┌─────────────────────────────────────────────────┐
│ ▬▬▬ Osnovci              📚  📅  📊          │  ← Header
│ ▬▬▬                                             │
│ ▬▬▬                                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  📅 Raspored časova                            │  ← Title
│  Sreda, 17. Oktobar 2025.                      │
│                                                 │
│  ┌────┐ ┌────┐            ┌─────────┐         │
│  │ ◄  │ │PON │ ╔════╗ │PET│ │    ►    │         │  ← Week Nav
│  └────┘ │ 15 │ ║SRE ║ │19 │ └─────────┘         │
│         └────┘ ║ 17 ║ └────┘                    │
│                ╚════╝                            │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ 08:00      📐 Matematika                │  │  ← Schedule
│  │ 08:45      Prof. Jovanović              │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ 🔔 Podsetnici        [Podesi]           │  │  ← Quick Actions
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ Brze prečice                            │  │
│  │  ┌────┐  ┌────┐  ┌────┐                │  │
│  │  │ 🏠 │  │ 📚 │  │ 📊 │                │  │
│  │  └────┘  └────┘  └────┘                │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

Perfect mobile experience! 📱✨
```

---

**Sada je sve optimizovano i lepo!** 🎉
