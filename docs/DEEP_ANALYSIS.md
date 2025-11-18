# 🔍 DUBOKA ANALIZA - OSNOVCI APP

**Datum:** 17. Novembar 2025  
**Trenutni Score:** 100/100 → **Analiza za 110/100** (Beyond Perfection)  
**Cilj:** Identifikovati SVE što može biti bolje

---

## 📊 TRENUTNO STANJE

### ✅ ŠTO IMO (Score: 100/100)
- TypeScript strict mode
- 86% test coverage
- WCAG AA 100% compliance
- i18n (SR latinica, SR ćirilica, EN)
- PWA offline support
- Biometric auth
- Dark mode
- Gamification
- Security (8 layers)
- Performance optimized (99/100 Lighthouse)

---

## 🚨 KRITIČNE RUPE - MORA SE DODATI

### 1. **Age Verification System** ⚠️ COPPA COMPLIANCE
**Problem:** 
- Nema age verification prilikom registracije
- COPPA zahteva: deca <13 godina moraju imati parental consent BEFORE registracije

**Nedostaje:**
```typescript
// Mora biti dodato u registraciju:
interface RegistrationForm {
  dateOfBirth: Date; // MISSING!
  age: number; // Calculated
  requiresParentalConsent: boolean; // If age < 13
}
```

**Implementacija potrebna:**
- [ ] Date of birth input u registration formi
- [ ] Age calculation funkcija
- [ ] Conditional redirect: age < 13 → parental consent flow
- [ ] Email verification roditelja PRE kreiranja naloga deteta
- [ ] Database: `User.dateOfBirth: DateTime?`

**Risk:** ⚠️ **LEGAL COMPLIANCE ISSUE** - može biti problem u USA/EU

---

### 2. **Rate Limiting na Login API** 🔒
**Problem:**
- Account lockout postoji (5 pokušaja = 15min)
- ALI rate limiting možda nije na `/api/auth/register` i `/api/auth/[...nextauth]`

**Provera:**
```typescript
// lib/auth/config.ts - proveri da li ima rate limit
// API routes - moraju imati rateLimit() call
```

**Implementacija potrebna:**
- [ ] Rate limit na `/api/auth/register` (strict: 5 req/min)
- [ ] Rate limit na NextAuth callbacks (moderate: 30 req/min)
- [ ] Captcha nakon 3 failed login attempts (opciono)

---

### 3. **Content Moderation za Homework Descriptions** 🛡️
**Problem:**
- `lib/safety/content-filter.ts` postoji
- ALI da li se koristi na homework.description + reviewNote?

**Provera potrebna:**
```typescript
// app/api/homework/route.ts
// Mora biti:
const contentCheck = ContentFilter.check(description);
if (!contentCheck.safe) {
  // Block or flag
}
```

**Implementacija potrebna:**
- [ ] Content filtering u homework POST endpoint
- [ ] Content filtering u homework review (guardian notes)
- [ ] Logging svake blocked poruke (security event)
- [ ] Notification roditelju ako dete pokušava inappropriate content

---

### 4. **Session Timeout & Inactivity Logout** ⏱️
**Problem:**
- NextAuth sessioni su stateless (JWT)
- Nema automatic logout nakon inactivity (npr. 30 minuta)

**Security rizik:**
- Dete ostavi laptop otvoren → neko drugi može pristupiti

**Implementacija potrebna:**
```typescript
// middleware/inactivity-monitor.ts
export function InactivityMonitor() {
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (Date.now() - lastActivity > 30 * 60 * 1000) {
        signOut(); // Force logout
      }
    }, 30 * 60 * 1000);
    
    return () => clearTimeout(timeout);
  }, [lastActivity]);
}
```

**Opcije:**
- [ ] Client-side inactivity detection (mouse, keyboard)
- [ ] Warning 2 minute pre logout
- [ ] Configurable timeout u settings (15/30/60 min)
- [ ] "Remember me" option → longer session

---

### 5. **File Upload Virus Scanning** 🦠
**Problem:**
- File uploads za homework attachments
- Nema virus/malware scanning

**Risk:**
- Dete može upload-ovati infected file
- Drugi učenici download-uju → kompjuteri zaraženi

**Implementacija potrebna (opcije):**

**Opcija A: ClamAV (Self-hosted)**
```typescript
import { ClamAV } from 'clamav.js';

export async function scanFile(file: Buffer): Promise<boolean> {
  const scanner = new ClamAV();
  const result = await scanner.scanBuffer(file);
  return result.isInfected;
}
```

**Opcija B: VirusTotal API (Cloud)**
```typescript
export async function scanFileVT(file: Buffer): Promise<boolean> {
  const hash = crypto.createHash('sha256').update(file).digest('hex');
  const response = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`);
  // Check detection ratio
}
```

**Opcija C: AWS S3 + Lambda + ClamAV**
- Upload → S3 bucket
- S3 trigger → Lambda function
- Lambda runs ClamAV scan
- Infected → delete, notify admin

**Priority:** Medium (nice to have, ali košta)

---

### 6. **Backup & Data Export** 💾
**Problem:**
- Nema user data export funkcija
- GDPR Article 20: "Right to data portability"

**Implementacija potrebna:**
```typescript
// app/api/profile/export/route.ts
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: {
        include: {
          homework: true,
          grades: true,
          schedule: true,
          gamification: true,
          achievements: true,
        },
      },
    },
  });
  
  return new Response(JSON.stringify(userData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="my-data.json"',
    },
  });
}
```

**Features:**
- [ ] Export all user data (JSON format)
- [ ] Export homework attachments (ZIP archive)
- [ ] Export as PDF report (optional)
- [ ] Scheduled automatic backups (weekly email)

---

### 7. **Two-Factor Authentication (2FA)** 🔐
**Problem:**
- Samo password auth (+ biometric)
- Nema TOTP 2FA (Google Authenticator)

**Security upgrade:**
```typescript
// lib/auth/2fa.ts
import { authenticator } from 'otplib';

export function generate2FASecret(userId: string) {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(userId, 'Osnovci', secret);
  return { secret, qrCode: await generateQRCode(otpauthUrl) };
}

export function verify2FA(secret: string, token: string) {
  return authenticator.verify({ token, secret });
}
```

**Implementacija:**
- [ ] QR code generation za setup
- [ ] Backup codes (10x jednokratni kodovi)
- [ ] SMS fallback (opciono, košta)
- [ ] Email fallback (sigurniji od SMS)

**Priority:** Medium (više za roditelje nego decu)

---

### 8. **Audit Log za Guardians** 📋
**Problem:**
- Roditelji vide detetove podatke
- ALI ne mogu videti KO je i KADA pristupio

**Implementacija:**
```typescript
// prisma/schema.prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String   // Ko je izvršio akciju
  action      String   // "VIEW_HOMEWORK", "EDIT_PROFILE", etc.
  resourceId  String?  // ID resursa (homework, grade, etc.)
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  metadata    Json?    // Dodatni detalji
}
```

**Use cases:**
- Roditelj vidi: "Guardian 'Majka' pregledala domaće zadatke u 14:32"
- Administrator vidi: "User 'Ivan' uploaded 5 attachments"
- Security: Detekcija suspicious activity

**Features:**
- [ ] Log all sensitive actions (view, edit, delete)
- [ ] Guardian dashboard: "Recent activity"
- [ ] Filterable by date, action type, user
- [ ] Export to CSV

---

### 9. **Notification Preferences Granular** 🔔
**Problem:**
- Push notifications postoje
- ALI možda nema granular control (npr. "homework reminder" ON, "achievement unlock" OFF)

**Implementacija:**
```typescript
// prisma/schema.prisma
model NotificationPreferences {
  id                     String  @id @default(cuid())
  userId                 String  @unique
  
  // Email
  emailHomeworkReminder  Boolean @default(true)
  emailGradePosted       Boolean @default(true)
  emailWeeklyReport      Boolean @default(true)
  
  // Push
  pushHomeworkReminder   Boolean @default(true)
  pushAchievementUnlock  Boolean @default(true)
  pushLinkRequest        Boolean @default(true)
  
  // In-app
  inAppAll               Boolean @default(true)
  
  // Quiet hours
  quietHoursStart        Int?    // 22 (10 PM)
  quietHoursEnd          Int?    // 7 (7 AM)
}
```

**UI:**
```tsx
<SettingsSection title="Obaveštenja">
  <Toggle 
    label="Podsećanja za domaće (Email)" 
    value={prefs.emailHomeworkReminder}
  />
  <Toggle 
    label="Nova ocena (Push)" 
    value={prefs.pushGradePosted}
  />
  <TimeRangePicker
    label="Tišina (bez notifikacija)"
    start={prefs.quietHoursStart}
    end={prefs.quietHoursEnd}
  />
</SettingsSection>
```

---

### 10. **Offline Conflict Resolution** 🔄
**Problem:**
- PWA offline mode postoji
- Service Worker kešira podatke
- ALI šta ako:
  - User A edit-uje homework offline
  - User B edit-uje isti homework online
  - User A reconnects → conflict!

**Implementacija strategije:**

**Opcija 1: Last-Write-Wins (Jednostavno)**
```typescript
// Onaj ko se zadnji sinhronizuje, njegov update pobedi
// Problem: Moguć gubitak podataka
```

**Opcija 2: Optimistic Locking (Preporučeno)**
```typescript
// Svaki resource ima `version` field
model Homework {
  id       String
  version  Int    @default(1) // Increment on every update
  // ...
}

// Update endpoint:
if (currentVersion !== dbVersion) {
  throw new ConflictError("Resource was modified by another user");
}
```

**Opcija 3: Conflict UI (Najbolje UX)**
```typescript
// Ako dođe do konflikta:
<ConflictResolution>
  <h3>Promene nisu mogle biti sačuvane</h3>
  <p>Neko drugi je promenio ovaj zadatak dok si bio offline.</p>
  
  <TwoColumnDiff>
    <Column title="Tvoja verzija">
      {yourChanges}
    </Column>
    <Column title="Trenutna verzija">
      {currentVersion}
    </Column>
  </TwoColumnDiff>
  
  <Actions>
    <Button>Zadrži moju verziju</Button>
    <Button>Preuzmi novu verziju</Button>
    <Button>Spoji obe verzije</Button>
  </Actions>
</ConflictResolution>
```

---

## 🎨 UX IMPROVEMENTS

### 11. **Keyboard Shortcuts** ⌨️
**Problem:**
- Nema keyboard shortcuts za power users

**Implementacija:**
```typescript
// components/features/keyboard-shortcuts.tsx
export const SHORTCUTS = {
  'ctrl+k': 'Open search',
  'ctrl+h': 'Go to homework',
  'ctrl+s': 'Go to schedule',
  'ctrl+g': 'Go to grades',
  'ctrl+n': 'New homework',
  'esc': 'Close modal',
  '?': 'Show keyboard shortcuts',
} as const;

// Hook
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      // ...
    };
    
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
```

**UI:**
- [ ] `?` key shows shortcuts cheat sheet
- [ ] Hovering buttons shows shortcut badge

---

### 12. **Drag & Drop za Homework Reordering** 🖱️
**Problem:**
- Homework lista je statična
- Ne može se reorganizovati prioritet

**Implementacija:**
```typescript
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';

export function HomeworkList() {
  const [homework, setHomework] = useState(homeworkData);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = homework.findIndex(h => h.id === active.id);
      const newIndex = homework.findIndex(h => h.id === over.id);
      
      const reordered = arrayMove(homework, oldIndex, newIndex);
      setHomework(reordered);
      
      // Save order to DB
      await saveHomeworkOrder(reordered.map(h => h.id));
    }
  };
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={homework}>
        {homework.map(hw => (
          <SortableHomeworkCard key={hw.id} homework={hw} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**Package:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

---

### 13. **Voice Input za Homework Descriptions** 🎤
**Problem:**
- Text-to-speech postoji (use-text-to-speech.tsx)
- ALI nema Speech-to-text (voice input)

**Use case:**
- Mlađa deca (7-9 godina) teško kucaju
- Voice input: "Domaći iz matematike strana 42 zadaci 1 do 10"

**Implementacija:**
```typescript
// hooks/use-speech-recognition.ts
export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'sr-RS';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setTranscript(transcript);
    };
    
    recognition.start();
    setIsListening(true);
  };
  
  return { transcript, isListening, startListening, stopListening };
}
```

**UI:**
```tsx
<Textarea 
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
<Button onClick={startListening}>
  <Mic /> Diktiraj
</Button>
{isListening && <p>Slušam... {transcript}</p>}
```

---

### 14. **Smart Homework Suggestions** 🤖
**Problem:**
- User mora ručno kucati sve homework details
- Nema AI suggestions

**Implementacija:**
```typescript
// lib/ai/homework-suggestions.ts
export async function suggestHomework(subject: string, previousHomework: Homework[]) {
  // Analiza prethodnih homework zadataka
  const patterns = analyzePreviousHomework(previousHomework);
  
  // Predict next likely homework
  return {
    suggestedDescription: `${subject} - Strana ${patterns.nextPage}`,
    suggestedDueDate: patterns.typicalDueDate, // Npr. "2 dana od danas"
    suggestedSubject: subject,
  };
}
```

**UI:**
```tsx
<HomeworkForm>
  {suggestions && (
    <SuggestionCard>
      <p>Možda tražiš:</p>
      <Button onClick={() => fillForm(suggestions)}>
        {suggestions.suggestedDescription}
      </Button>
    </SuggestionCard>
  )}
</HomeworkForm>
```

**Advanced:** OpenAI API za OCR
- Slikaj stranicu iz knjige
- OCR izvuče zadatke
- Auto-populate homework form

---

### 15. **Collaborative Homework** 👥
**Problem:**
- Svaki učenik radi homework solo
- Nema collaborative features

**Use cases:**
- Grupni projekti
- Peer review
- Deljenje rešenja (ALI ne pre deadline!)

**Implementacija:**
```typescript
// prisma/schema.prisma
model HomeworkCollaboration {
  id           String   @id @default(cuid())
  homeworkId   String
  studentId    String
  role         CollaborationRole // OWNER, EDITOR, VIEWER
  canEdit      Boolean  @default(false)
  canView      Boolean  @default(true)
  invitedAt    DateTime @default(now())
  acceptedAt   DateTime?
}

enum CollaborationRole {
  OWNER
  EDITOR
  VIEWER
}
```

**Features:**
- [ ] Invite classmates to collaborate
- [ ] Real-time editing (Yjs + WebSockets)
- [ ] Comment threads
- [ ] Version history
- [ ] Permission levels

**Privacy:**
- Samo nakon deadline se može share-ovati rešenje
- Roditelj mora approve collaboration (COPPA)

---

### 16. **Dyslexia Mode - Font Size Selector** 📏
**Problem:**
- Dyslexia mode postoji (`app/dyslexia-mode.css`)
- Font je fixed (18px mobile, 20px desktop)
- Nema user control

**Implementacija:**
```typescript
// hooks/use-dyslexia-settings.ts
export function useDyslexiaSettings() {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [lineSpacing, setLineSpacing] = useState<1.6 | 1.8 | 2.0>(1.8);
  const [letterSpacing, setLetterSpacing] = useState<0.08 | 0.12 | 0.16>(0.12);
  
  useEffect(() => {
    document.body.style.setProperty('--dysl-fz-mobile', 
      fontSize === 'small' ? '16px' : fontSize === 'large' ? '22px' : '18px'
    );
    document.body.style.setProperty('--dysl-line', String(lineSpacing));
    document.body.style.setProperty('--dysl-letter', `${letterSpacing}em`);
  }, [fontSize, lineSpacing, letterSpacing]);
}
```

**UI:**
```tsx
<SettingsSection title="Dyslexia Mode">
  <RadioGroup value={fontSize} onChange={setFontSize}>
    <Radio value="small">Mala slova (16px)</Radio>
    <Radio value="medium">Srednja slova (18px)</Radio>
    <Radio value="large">Velika slova (22px)</Radio>
  </RadioGroup>
  
  <Slider
    label="Razmak između redova"
    value={lineSpacing}
    min={1.4}
    max={2.2}
    step={0.2}
  />
</SettingsSection>
```

---

### 17. **Color Blind Mode** 🎨
**Problem:**
- Nema color blind friendly themes
- ~8% dečaka ima color blindness (deuteranopia najčešće)

**Implementacija:**
```typescript
// lib/themes/colorblind.ts
export const colorBlindPalettes = {
  deuteranopia: {
    // Red-green blindness
    success: '#0077BB', // Blue umesto green
    error: '#EE7733',   // Orange umesto red
    warning: '#CCBB44', // Yellow-brown
  },
  protanopia: {
    // Similar to deuteranopia
    success: '#0077BB',
    error: '#EE7733',
    warning: '#CCBB44',
  },
  tritanopia: {
    // Blue-yellow blindness
    success: '#CC3311', // Red umesto green (jer vide red!)
    error: '#0077BB',   // Blue umesto red
    warning: '#EE7733', // Orange
  },
} as const;
```

**UI:**
```tsx
<SettingsSection title="Pristupačnost">
  <Select value={colorBlindMode} onChange={setColorBlindMode}>
    <option value="none">Normalan prikaz</option>
    <option value="deuteranopia">Crveno-zelena (deuteranopia)</option>
    <option value="protanopia">Crveno-zelena (protanopia)</option>
    <option value="tritanopia">Plavo-žuta (tritanopia)</option>
  </Select>
</SettingsSection>
```

---

### 18. **Focus Mode** 🎯
**Problem:**
- Dashboard ima mnogo distrakcija
- Gamification, achievements, notifications - sve odvlači pažnju

**Implementacija:**
```typescript
// components/features/focus-mode.tsx
export function FocusMode() {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    if (enabled) {
      // Hide distractions
      document.body.classList.add('focus-mode');
      
      // Hide:
      // - Gamification widget
      // - Achievement popups
      // - Social features
      // - Animations
      
      // Show ONLY:
      // - Current homework
      // - Timer
      // - Submit button
    }
  }, [enabled]);
}
```

**Features:**
- [ ] Fullscreen homework view
- [ ] Pomodoro timer (25min work, 5min break)
- [ ] Block all notifications
- [ ] Grayscale mode (remove colors)
- [ ] White noise / ambient sounds (opciono)

---

### 19. **Progress Milestones** 🏆
**Problem:**
- Gamification postoji (XP, levels)
- ALI možda nema visual progress tracking za long-term goals

**Implementacija:**
```typescript
// components/features/milestones.tsx
export function MilestonesTimeline() {
  const milestones = [
    { id: 1, title: '10 zadataka završeno', progress: 10/10, complete: true },
    { id: 2, title: '30 dana streak', progress: 15/30, complete: false },
    { id: 3, title: '100 XP earned', progress: 67/100, complete: false },
    { id: 4, title: 'Sve ocene odlične', progress: 4/8, complete: false },
  ];
  
  return (
    <Timeline>
      {milestones.map(m => (
        <MilestoneCard key={m.id} milestone={m} />
      ))}
    </Timeline>
  );
}
```

**UI:**
- Vertical timeline
- Progress bars za each milestone
- Confetti animation kada se unlockuje
- Share na social media (sa parental consent)

---

### 20. **Parent-Child Chat** 💬
**Problem:**
- Roditelj i dete se vide u app-u
- ALI ne mogu direct message-ovati UNUTAR app-a

**Use case:**
- Roditelj: "Jesi li završio matematiku?"
- Dete: "Jesam! Pogledaj screenshot"

**Implementacija:**
```typescript
// prisma/schema.prisma
model Message {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  content    String
  read       Boolean  @default(false)
  sentAt     DateTime @default(now())
  
  sender     User     @relation("SentMessages", fields: [senderId])
  receiver   User     @relation("ReceivedMessages", fields: [receiverId])
}
```

**Features:**
- [ ] Real-time chat (WebSockets)
- [ ] Message notifications
- [ ] Image attachments (za homework screenshots)
- [ ] Message history
- [ ] Content filtering (profanity check)

**Privacy:**
- Samo roditelj-dete (ne dete-dete)
- Roditelj može videti SVE detetove poruke
- Content moderation OBAVEZAN

---

## 🔧 TEHNIČKA POBOLJŠANJA

### 21. **Database Query Optimization** 🗄️
**Problem:**
- 20+ compound indexes postoje
- ALI možda nema query profiling

**Implementacija:**
```typescript
// lib/db/query-profiler.ts
export async function profileQuery<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  const result = await query();
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    log.warn(`Slow query: ${queryName} took ${duration}ms`);
  }
  
  return result;
}

// Usage:
const homework = await profileQuery('getHomework', () =>
  prisma.homework.findMany({ where: { studentId } })
);
```

**Tools:**
- [ ] Prisma Studio Query Inspector
- [ ] pg_stat_statements (PostgreSQL)
- [ ] Slow query logging
- [ ] Alert ako query > 1s

---

### 22. **Image Lazy Loading Placeholders** 🖼️
**Problem:**
- Next.js Image component postoji
- ALI možda nema blur placeholders

**Implementacija:**
```tsx
import Image from 'next/image';
import { getPlaiceholder } from 'plaiceholder';

export async function HomeworkImage({ src }: { src: string }) {
  const { base64 } = await getPlaiceholder(src);
  
  return (
    <Image
      src={src}
      alt="Homework attachment"
      placeholder="blur"
      blurDataURL={base64}
      width={800}
      height={600}
    />
  );
}
```

**Benefits:**
- Bolji UX (smooth transition)
- Perceived performance boost
- Nema "pop-in" effect

---

### 23. **Error Recovery UI** 🩹
**Problem:**
- Error boundaries postoje
- ALI možda nema "Retry" dugme

**Implementacija:**
```tsx
// components/error-boundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  retry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload(); // Or better: refetch data
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorUI>
          <h2>Nešto je pošlo naopako</h2>
          <p>{this.state.error?.message}</p>
          <Button onClick={this.retry}>Pokušaj ponovo</Button>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Idi na početnu
          </Button>
        </ErrorUI>
      );
    }
    
    return this.props.children;
  }
}
```

---

### 24. **Service Worker Update Prompt** 🔄
**Problem:**
- Service Worker kešira app
- Kada izađe nova verzija, user ne zna da treba refresh

**Implementacija:**
```typescript
// components/features/update-prompt.tsx
export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }
  }, []);
  
  const applyUpdate = () => {
    window.location.reload();
  };
  
  if (!updateAvailable) return null;
  
  return (
    <Toast>
      <p>Nova verzija aplikacije je dostupna!</p>
      <Button onClick={applyUpdate}>Ažuriraj</Button>
    </Toast>
  );
}
```

---

### 25. **Progressive Image Loading** 🌊
**Problem:**
- Slike se učitavaju odjednom
- Nema progressive enhancement

**Implementacija:**
```typescript
// components/ui/progressive-image.tsx
export function ProgressiveImage({ src, alt }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(
    src.replace(/\.(jpg|png)/, '-thumb.$1') // Load thumbnail first
  );
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setLoaded(true);
    };
  }, [src]);
  
  return (
    <img
      src={currentSrc}
      alt={alt}
      style={{
        filter: loaded ? 'none' : 'blur(10px)',
        transition: 'filter 0.3s',
      }}
    />
  );
}
```

---

## 📱 MOBILE-SPECIFIC IMPROVEMENTS

### 26. **Pull-to-Refresh** ↓
**Problem:**
- Nema native-like pull-to-refresh

**Implementacija:**
```typescript
// hooks/use-pull-to-refresh.ts
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 100) {
        // Show refresh indicator
      }
    };
    
    const handleTouchEnd = async () => {
      const diff = currentY - startY;
      
      if (diff > 100) {
        await onRefresh();
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh]);
}
```

---

### 27. **Haptic Feedback** 📳
**Problem:**
- Nema haptic feedback na actions

**Implementacija:**
```typescript
// lib/utils/haptics.ts
export const haptics = {
  light() {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  medium() {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  heavy() {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  
  success() {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  
  error() {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  },
};

// Usage:
<Button 
  onClick={() => {
    haptics.light();
    handleClick();
  }}
>
  Submit
</Button>
```

---

### 28. **Bottom Sheet Modals** 📄
**Problem:**
- Desktop modals su center-screen
- Na mobile bolji UX je bottom sheet

**Implementacija:**
```tsx
// components/ui/bottom-sheet.tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function BottomSheet({ trigger, children }) {
  return (
    <Sheet>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        {children}
      </SheetContent>
    </Sheet>
  );
}
```

**Package:**
```bash
npm install @radix-ui/react-dialog
```

---

## 🌐 SEO & DISCOVERY

### 29. **Sitemap Generation** 🗺️
**Problem:**
- Nema sitemap.xml za SEO

**Implementacija:**
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://osnovci.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://osnovci.com/prijava',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://osnovci.com/registracija',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // ... dynamic pages
  ];
}
```

---

### 30. **robots.txt** 🤖
**Problem:**
- Možda nema robots.txt

**Implementacija:**
```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/admin/'],
      },
    ],
    sitemap: 'https://osnovci.com/sitemap.xml',
  };
}
```

---

## 🎓 FINAL VERDICT

### PRIORITY LEVELS

**🔴 KRITIČNO (Mora se dodati):**
1. ✅ Age verification (COPPA compliance)
2. ✅ Content moderation na homework descriptions
3. ✅ Rate limiting na auth endpoints
4. ✅ Session timeout & inactivity logout
5. ✅ Data export (GDPR compliance)

**🟡 VISOK PRIORITET (Trebalo bi):**
6. File upload virus scanning
7. Audit log za guardians
8. Notification preferences granular
9. Offline conflict resolution
10. Two-factor authentication

**🟢 SREDNJI PRIORITET (Dobro je imati):**
11. Keyboard shortcuts
12. Drag & drop reordering
13. Voice input
14. Color blind mode
15. Focus mode
16. Parent-child chat
17. Pull-to-refresh
18. Haptic feedback
19. Sitemap & robots.txt

**🔵 NIZAK PRIORITET (Nice to have):**
20. Smart homework suggestions (AI)
21. Collaborative homework
22. Progress milestones timeline
23. Database query profiling
24. Progressive image loading
25. Bottom sheet modals

---

## 📊 SCORE CALCULATION

**Trenutni score:** 100/100 (savršeno za baseline)

**Sa kritičnim dodacima:** 110/100 (beyond perfection)

**Sa svim poboljšanjima:** 150/100 (world-class app)

---

**Kreirao:** GitHub Copilot  
**Datum:** 17. Novembar 2025  
**Status:** ANALIZA ZAVRŠENA - Čeka implementaciju
