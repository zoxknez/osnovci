# 🎮 Enhanced Gamification System

**Status**: ✅ Production Ready  
**Version**: 2.0  
**Date**: January 2025  
**Author**: Development Team

---

## 📋 Pregled Sistema

Enhanced Gamification System je kompletna implementacija motivacionog sistema za Osnovci aplikaciju. Sistem koristi XP (Experience Points), nivoe, achievements, streak tracking, i leaderboard da motiviše učenike na redovno izvršavanje domaćih zadataka i razvijanje dobrih navika.

### Ključne Karakteristike

- ✅ **50 Nivoa Progresije** - Pažljivo balansirani level thresholds
- ✅ **15 Tipova Achievements** - 70+ milestones sa 4 rarity tiers
- ✅ **Dinamički XP Bonusi** - Vreme, kvalitet, brzina, streak multipliers
- ✅ **Streak Freeze Power-ups** - Zaštita streak-a sa smart aktivacijom
- ✅ **Leaderboard Sistem** - All-time, weekly, monthly rankings
- ✅ **Privacy Kontrole** - Opciona vidljivost na leaderboard-u
- ✅ **5 UI Komponenti** - Kompletno dizajnirane i animirane komponente

---

## 🏗️ Arhitektura

### Database Schema

```prisma
model Gamification {
  id                String   @id @default(cuid())
  studentId         String   @unique
  level             Int      @default(1)
  xp                Int      @default(0)
  totalXPEarned     Int      @default(0)
  
  // Streak System
  streak            Int      @default(0)
  longestStreak     Int      @default(0)
  lastActivityDate  DateTime?
  streakFreezes     Int      @default(0)
  lastStreakFreeze  DateTime?
  
  // Stats Tracking
  totalHomeworkDone Int      @default(0)
  perfectWeeks      Int      @default(0)
  earlySubmissions  Int      @default(0)
  weekendTasks      Int      @default(0)
  nightTasks        Int      @default(0)
  fastCompletions   Int      @default(0)
  
  // Periodic XP
  weeklyXP          Int      @default(0)
  monthlyXP         Int      @default(0)
  lastWeekReset     DateTime?
  lastMonthReset    DateTime?
  
  // Privacy
  showOnLeaderboard Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  student       Student       @relation(fields: [studentId], references: [id], onDelete: Cascade)
  achievements  Achievement[]
}

model Achievement {
  id             String          @id @default(cuid())
  studentId      String
  gamificationId String
  type           AchievementType
  unlockedAt     DateTime        @default(now())
  
  // Progress Tracking
  progress       Int?
  target         Int?
  isHidden       Boolean         @default(false)
  category       String?
  
  gamification Gamification @relation(fields: [gamificationId], references: [id], onDelete: Cascade)
}

enum AchievementType {
  // Original (6)
  FIRST_HOMEWORK
  HOMEWORK_STREAK_7
  HOMEWORK_STREAK_30
  LEVEL_UP_10
  LEVEL_UP_25
  HOMEWORK_100
  
  // New (9)
  SPEED_DEMON      // Fast completion
  NIGHT_OWL        // Late-night tasks
  WEEKEND_WARRIOR  // Weekend tasks
  COMEBACK_KID     // Streak recovery
  PERFECTIONIST    // Perfect scores
  HELPER           // Help others
  CONSISTENT       // Perfect weeks
  EXPLORER         // Try all subjects
  OVERACHIEVER     // Exceed expectations
}
```

### XP System Components

#### 1. XP Rewards (`lib/gamification/xp-system-v2.ts`)

```typescript
const XP_REWARDS = {
  HOMEWORK_SUBMIT: 50,
  HOMEWORK_EARLY: 20,      // +40% bonus
  HOMEWORK_PERFECT: 30,    // +60% bonus
  
  // Time-based bonuses
  WEEKEND_BONUS: 5,        // Weekend completion
  NIGHT_OWL_BONUS: 3,      // 10pm-6am
  MORNING_BONUS: 3,        // 6am-8am
  FAST_COMPLETION: 10,     // <5 min
  
  // Streak multipliers
  STREAK_7_MULTIPLIER: 1.1,   // +10%
  STREAK_14_MULTIPLIER: 1.2,  // +20%
  STREAK_30_MULTIPLIER: 1.3,  // +30%
  STREAK_50_MULTIPLIER: 1.4,  // +40%
  STREAK_100_MULTIPLIER: 1.5, // +50%
  
  // Level rewards
  LEVEL_UP_BONUS: 20,
  LEVEL_5_STREAK_FREEZE: 1, // Every 5 levels
};
```

#### 2. Level Progression (50 Levels)

```typescript
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  850,   // Level 5
  1300,  // Level 6
  1850,  // Level 7
  2500,  // Level 8
  3250,  // Level 9
  4100,  // Level 10
  // ... total 50 levels
  245000, // Level 50 (MAX)
];
```

**Level Tiers:**
- **Novice** (1-9): Gray - Starting levels
- **Beginner** (10-19): Green - Building habits
- **Intermediate** (20-29): Blue - Consistent performer
- **Advanced** (30-39): Amber - Dedicated student
- **Expert** (40-49): Purple - Elite status
- **Master** (50): Gold - Maximum achievement

---

## 🏆 Achievement System

### Achievement Categories

1. **Homework** - Task completion milestones
2. **Streak** - Daily consistency rewards
3. **Level** - Progression milestones
4. **Consistency** - Perfect weeks/months
5. **Planning** - Early submissions
6. **Subject** - Subject mastery
7. **Speed** - Fast completions
8. **Time** - Time-based achievements (weekend, night)
9. **Motivation** - Comeback achievements
10. **Quality** - Perfect score achievements
11. **Social** - Helping others
12. **Exploration** - Try all subjects
13. **Excellence** - Overachievement

### Rarity Tiers

```typescript
type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

// Rarity Distribution
COMMON: 40%      // 5-20 XP
RARE: 35%        // 25-50 XP
EPIC: 20%        // 75-150 XP
LEGENDARY: 5%    // 200-500 XP
```

### Achievement Examples

#### FIRST_HOMEWORK (COMMON)
- **Unlock**: Complete first homework
- **XP Reward**: 10
- **Icon**: 🎓
- **Description**: "Početak je najteži deo!"

#### SPEED_DEMON (RARE)
- **Milestones**: 10, 50, 100, 250, 500 fast completions
- **XP Rewards**: 25-200
- **Icon**: ⚡
- **Condition**: Complete task in <5 minutes
- **Best**: 500 → "Brzina Svetlosti" (200 XP, EPIC)

#### NIGHT_OWL (RARE)
- **Milestones**: 10, 50, 100 night tasks
- **XP Rewards**: 25-100
- **Icon**: 🦉
- **Condition**: Complete 10pm-6am
- **Best**: 100 → "Noćni Zmaj" (100 XP, EPIC)

#### COMEBACK_KID (EPIC)
- **Unlock**: Restore streak after 7+ days
- **XP Reward**: 150
- **Icon**: 💪
- **Hidden**: Yes (surprise achievement)

#### PERFECTIONIST (LEGENDARY)
- **Milestones**: 50, 100, 250, 500 perfect scores
- **XP Rewards**: 100-500
- **Icon**: 💯
- **Condition**: Grade = 5 (A+)
- **Best**: 500 → "Savršenstvo" (500 XP, LEGENDARY)

---

## 🔥 Streak System

### Streak Logic

```typescript
// Daily activity check
if (isActivityToday) {
  if (isConsecutiveDay) {
    streak++;
    longestStreak = Math.max(streak, longestStreak);
  } else if (missedOneDayOnly && hasStreakFreeze) {
    // Auto-activate freeze
    activateStreakFreeze();
    // Streak preserved
  } else {
    // Streak broken
    if (streak >= 7) {
      // Check for COMEBACK_KID achievement
    }
    streak = 1;
  }
}
```

### Streak Freeze Power-ups

- **Earn**: Every 5 levels + special achievements
- **Auto-Activation**: When missing exactly 1 day
- **Cooldown**: 7 days between uses
- **Max Stack**: Unlimited (carry forward)
- **UI Indicator**: Shield icon with count

### Streak Milestones

| Streak | Multiplier | Achievement | Color |
|--------|------------|-------------|-------|
| 1-6 | 1.0x | - | Yellow |
| 7-13 | 1.1x | Streak Rookie | Orange |
| 14-29 | 1.2x | Streak Warrior | Red |
| 30-49 | 1.3x | Streak Master | Amber |
| 50-99 | 1.4x | Streak Legend | Orange |
| 100+ | 1.5x | Streak Titan | Purple |

---

## 📊 Leaderboard System

### Three Leaderboards

#### 1. All-Time Leaderboard
- **Metric**: Total XP earned
- **Top**: 100 players
- **Data Included**:
  - Rank, name, avatar
  - Level, XP, total XP earned
  - Streak stats
  - Achievement counts by rarity
  - Total homework done

#### 2. Weekly Leaderboard
- **Metric**: Weekly XP
- **Top**: 50 players
- **Reset**: Every Monday 00:00
- **Next Reset**: Displayed in UI

#### 3. Monthly Leaderboard
- **Metric**: Monthly XP
- **Top**: 50 players
- **Reset**: First day of month 00:00
- **Next Reset**: Displayed in UI

### Privacy Controls

```typescript
// Student can hide from leaderboard
showOnLeaderboard: boolean // default: true

// When hidden:
// - Not shown in public rankings
// - Can still see own rank
// - Personal stats preserved
```

---

## 🎨 UI Components

### 1. AchievementBadge

**Location**: `components/gamification/AchievementBadge.tsx`  
**Lines**: 200+

#### Props
```typescript
interface AchievementBadgeProps {
  achievement: {
    type: AchievementType;
    unlockedAt?: Date;
    progress?: number;
    target?: number;
    isHidden?: boolean;
  };
  size?: "sm" | "md" | "lg";
  showAnimation?: boolean;
  isLocked?: boolean;
}
```

#### Features
- Rarity-based styling (COMMON→LEGENDARY)
- Icon display with emoji fallback
- XP reward badge
- Progress bar for locked achievements
- Hidden achievement support ("???")
- Unlock animation (Framer Motion)

#### Styling Examples
```tsx
// LEGENDARY achievement
<div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-1 rounded-lg">
  <div className="bg-white dark:bg-gray-900 rounded-lg">
    {/* Content with sparkle effects */}
  </div>
</div>
```

---

### 2. LevelProgressBar

**Location**: `components/gamification/LevelProgressBar.tsx`  
**Lines**: 150+

#### Props
```typescript
interface LevelProgressBarProps {
  level: number;
  currentXP: number;
  totalXP: number;
  showDetails?: boolean;
}
```

#### Features
- Level badge with tier colors
- Progress bar with shimmer animation
- XP display: current/required/percentage
- "MAX LEVEL" badge for level 50
- Responsive design

---

### 3. StreakDisplay

**Location**: `components/gamification/StreakDisplay.tsx`  
**Lines**: 180+

#### Props
```typescript
interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
}
```

#### Features
- Animated flame icon (pulsing)
- Tier-based coloring
- Streak freeze badge (Shield icon)
- Stats grid: longest streak, available freezes
- Next milestones display (7, 14, 30, 50, 100)
- Active freeze info banner

---

### 4. GamificationDashboard

**Location**: `components/gamification/GamificationDashboard.tsx`  
**Lines**: 380+

#### Props
```typescript
interface GamificationDashboardProps {
  studentId: string;
  initialData?: GamificationData;
}
```

#### Features

**Header Stats (4 cards):**
1. Level with progress bar
2. Streak with flame icon
3. Total XP earned
4. Total homework done

**Tab 1: Overview**
- LevelProgressBar component
- StreakDisplay component
- Recent achievements (6 badges)
- Weekly XP progress bar
- Monthly XP progress bar

**Tab 2: Achievements**
- All unlocked achievements
- Large badge display
- Sorted by unlock date (newest first)

**Tab 3: Leaderboard**
- Leaderboard component integration
- Rank display
- Privacy toggle (Eye/EyeOff icon)

---

### 5. Leaderboard

**Location**: `components/gamification/Leaderboard.tsx`  
**Lines**: 450+

#### Props
```typescript
interface LeaderboardProps {
  studentId: string;
  period?: "all-time" | "weekly" | "monthly";
  showOnLeaderboard: boolean;
  onToggleVisibility: (visible: boolean) => void;
}
```

#### Features

**Period Tabs:**
- All-Time (Trophy icon)
- Weekly (Calendar icon)
- Monthly (Clock icon)

**Podium Display (Top 3):**
- Gold medal (1st): Crown icon, height 40
- Silver medal (2nd): Medal icon, height 32
- Bronze medal (3rd): Medal icon, height 28
- Avatar with rarity border
- XP display with gradient backgrounds

**List Display (4+):**
- Rank badge
- Avatar or initial circle
- Name + Level + XP
- Achievement badges (LEGENDARY/EPIC)
- "TI" badge for current user

**Current User Highlight:**
- Blue border and background
- Shown even if not in top list
- "Nastavi da radiš! 💪" encouragement

**Privacy Toggle:**
- Checkbox control
- "Prikaži me na tabeli" label
- Explanation text

---

## 🔌 API Endpoints

### 1. GET `/api/gamification/student/[studentId]`

**Description**: Load complete gamification data for a student

**Authorization**: 
- Student owner
- Guardian with active link

**Response**:
```json
{
  "level": 15,
  "xp": 2350,
  "totalXPEarned": 12450,
  "streak": 23,
  "longestStreak": 45,
  "streakFreezes": 3,
  "totalHomeworkDone": 87,
  "weeklyXP": 450,
  "monthlyXP": 1850,
  "showOnLeaderboard": true,
  "recentAchievements": [
    {
      "id": "...",
      "type": "SPEED_DEMON",
      "unlockedAt": "2025-01-15T10:30:00Z",
      "progress": 50,
      "target": 50
    }
  ],
  "leaderboardPosition": {
    "rank": 12,
    "totalPlayers": 458
  }
}
```

**Error Codes**:
- `401`: Unauthorized (no session)
- `403`: Forbidden (not owner/guardian)
- `404`: Student not found
- `500`: Server error

---

### 2. PATCH `/api/gamification/student/[studentId]/settings`

**Description**: Update gamification settings

**Authorization**: Student owner only

**Request Body**:
```json
{
  "showOnLeaderboard": false
}
```

**Response**:
```json
{
  "success": true,
  "showOnLeaderboard": false
}
```

**Error Codes**:
- `401`: Unauthorized
- `403`: Forbidden (only student can change settings)
- `500`: Server error

---

### 3. GET `/api/gamification/leaderboard/all-time`

**Description**: All-time leaderboard (total XP)

**Query Params**: None

**Response**:
```json
{
  "entries": [
    {
      "rank": 1,
      "studentId": "...",
      "name": "Marko P.",
      "avatar": "https://...",
      "level": 35,
      "xp": 45000,
      "totalXPEarned": 52000,
      "streak": 78,
      "longestStreak": 95,
      "totalHomeworkDone": 450,
      "achievementCounts": {
        "COMMON": 12,
        "RARE": 8,
        "EPIC": 5,
        "LEGENDARY": 2
      }
    }
  ],
  "currentUserRank": 12,
  "totalPlayers": 458
}
```

---

### 4. GET `/api/gamification/leaderboard/weekly`

**Description**: Weekly leaderboard (weeklyXP)

**Response**:
```json
{
  "entries": [...],
  "currentUserRank": 5,
  "totalPlayers": 458,
  "nextResetTime": "2025-01-20T00:00:00Z"
}
```

---

### 5. GET `/api/gamification/leaderboard/monthly`

**Description**: Monthly leaderboard (monthlyXP)

**Response**: Same as weekly with `nextResetTime` = first day of next month

---

## 🧮 XP Calculation Formulas

### Base Calculation

```typescript
function calculateXP(homework: Homework, metadata: Metadata): number {
  let xp = XP_REWARDS.HOMEWORK_SUBMIT; // 50 base
  
  // Time-based bonuses
  if (metadata.isWeekend) xp += XP_REWARDS.WEEKEND_BONUS; // +5
  if (metadata.isNightTime) xp += XP_REWARDS.NIGHT_OWL_BONUS; // +3
  if (metadata.isMorning) xp += XP_REWARDS.MORNING_BONUS; // +3
  
  // Quality bonuses
  if (metadata.isEarly) xp += XP_REWARDS.HOMEWORK_EARLY; // +20
  if (metadata.isPerfect) xp += XP_REWARDS.HOMEWORK_PERFECT; // +30
  if (metadata.isFast) xp += XP_REWARDS.FAST_COMPLETION; // +10
  
  // Streak multiplier
  const multiplier = getStreakMultiplier(currentStreak);
  xp *= multiplier; // Up to 1.5x at 100+ streak
  
  return Math.floor(xp);
}
```

### Example Scenarios

#### Scenario 1: Basic Homework
```
Base: 50 XP
Streak: 5 days (1.0x)
Total: 50 XP
```

#### Scenario 2: Perfect Weekend Homework
```
Base: 50 XP
+ Perfect score: +30 XP
+ Weekend: +5 XP
Subtotal: 85 XP
Streak: 15 days (1.2x)
Total: 102 XP
```

#### Scenario 3: Speed Demon
```
Base: 50 XP
+ Early submission: +20 XP
+ Fast completion: +10 XP
+ Morning bonus: +3 XP
Subtotal: 83 XP
Streak: 35 days (1.3x)
Total: 108 XP
```

#### Scenario 4: Ultimate Combo
```
Base: 50 XP
+ Perfect score: +30 XP
+ Early submission: +20 XP
+ Fast completion: +10 XP
+ Weekend: +5 XP
+ Night owl: +3 XP
Subtotal: 118 XP
Streak: 100+ days (1.5x)
Total: 177 XP
```

---

## 🔄 Integration Guide

### Step 1: Add XP After Homework Submission

```typescript
import { addXP, updateStreak } from "@/lib/gamification/xp-system-v2";
import { trackHomeworkCompletion } from "@/lib/gamification/achievements";

// In homework submission handler
async function handleHomeworkSubmit(homeworkId: string, studentId: string) {
  // 1. Save homework to database
  const homework = await prisma.homework.update({
    where: { id: homeworkId },
    data: { status: "SUBMITTED", submittedAt: new Date() }
  });
  
  // 2. Calculate metadata
  const metadata = {
    isEarly: homework.submittedAt < homework.dueDate,
    isPerfect: homework.grade === 5,
    isFast: homework.completionTime < 300, // 5 min
    isWeekend: [0, 6].includes(new Date().getDay()),
    isNightTime: new Date().getHours() >= 22 || new Date().getHours() < 6,
    isMorning: new Date().getHours() >= 6 && new Date().getHours() < 8,
  };
  
  // 3. Add XP
  const xpEarned = await addXP(studentId, "HOMEWORK_SUBMIT", metadata);
  
  // 4. Update streak
  await updateStreak(studentId);
  
  // 5. Check achievements
  await trackHomeworkCompletion(studentId, homework, metadata);
  
  // 6. Send notification
  await showLocalNotification({
    title: "Domaći Zadatak Predat!",
    body: `Osvojio si ${xpEarned} XP! 🎉`,
  });
}
```

---

### Step 2: Display Gamification Dashboard

```tsx
import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";

export default function StudentDashboardPage() {
  const { student } = useSession();
  
  return (
    <div>
      <h1>Tvoj Profil</h1>
      
      <GamificationDashboard studentId={student.id} />
      
      {/* Other content */}
    </div>
  );
}
```

---

### Step 3: Show Achievement Unlocks

```tsx
import { AchievementBadge } from "@/components/gamification/AchievementBadge";
import { Dialog } from "@/components/ui/dialog";

export function AchievementUnlockModal({ achievement, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Novo Dostignuće!</h2>
        
        <AchievementBadge
          achievement={achievement}
          size="lg"
          showAnimation
        />
        
        <p className="mt-4 text-gray-600">
          Osvojio si {achievement.xp} XP!
        </p>
        
        <button onClick={onClose} className="mt-6 btn-primary">
          Nastavi
        </button>
      </div>
    </Dialog>
  );
}
```

---

### Step 4: Periodic XP Reset (Cron Job)

```typescript
// In cron job or scheduled task
import { resetPeriodicXP } from "@/lib/gamification/xp-system-v2";

// Run daily at 00:00
export async function dailyReset() {
  await resetPeriodicXP();
  
  // Log reset
  console.log("Periodic XP reset completed");
}
```

---

## 🧪 Testing Checklist

### XP System Tests

- [ ] Base XP award (50 XP)
- [ ] Early submission bonus (+20 XP)
- [ ] Perfect score bonus (+30 XP)
- [ ] Weekend bonus (+5 XP)
- [ ] Night owl bonus (+3 XP)
- [ ] Morning bonus (+3 XP)
- [ ] Fast completion bonus (+10 XP)
- [ ] Streak multiplier (1.0x → 1.5x)
- [ ] Level-up bonus (+20 XP)
- [ ] Streak freeze earning (every 5 levels)

### Streak System Tests

- [ ] Streak increment on consecutive day
- [ ] Streak freeze auto-activation (miss 1 day)
- [ ] Streak reset after freeze expires
- [ ] Comeback achievement (7+ days break)
- [ ] Longest streak tracking
- [ ] Freeze cooldown (7 days)

### Achievement System Tests

- [ ] FIRST_HOMEWORK unlock
- [ ] SPEED_DEMON progress tracking
- [ ] NIGHT_OWL unlock (10+ night tasks)
- [ ] COMEBACK_KID hidden achievement
- [ ] PERFECTIONIST milestones (50, 100, 250, 500)
- [ ] Achievement XP rewards
- [ ] Rarity tier styling
- [ ] Progress bar for locked achievements

### Leaderboard Tests

- [ ] All-time ranking (by total XP)
- [ ] Weekly ranking (by weeklyXP)
- [ ] Monthly ranking (by monthlyXP)
- [ ] Privacy toggle (hide from leaderboard)
- [ ] Current user highlight
- [ ] Rank tracking (even if not in top list)
- [ ] Achievement counts display
- [ ] Weekly/monthly reset times

### UI Component Tests

- [ ] AchievementBadge rendering (all rarities)
- [ ] LevelProgressBar tier colors
- [ ] StreakDisplay animations
- [ ] GamificationDashboard tab switching
- [ ] Leaderboard period switching
- [ ] Responsive design (mobile/desktop)

---

## 📈 Performance Considerations

### Database Indexes

```prisma
@@index([weeklyXP])           // For weekly leaderboard
@@index([monthlyXP])          // For monthly leaderboard
@@index([xp])                 // For all-time leaderboard
@@index([showOnLeaderboard])  // For privacy filter
@@index([studentId])          // Foreign key
```

### Caching Strategy

```typescript
// Leaderboard caching (5 minutes)
const leaderboard = await cache.get("leaderboard:all-time");
if (!leaderboard) {
  const data = await prisma.gamification.findMany(...);
  await cache.set("leaderboard:all-time", data, 300);
}
```

### Query Optimization

```typescript
// Only load necessary fields
const gamif = await prisma.gamification.findUnique({
  where: { studentId },
  select: {
    level: true,
    xp: true,
    streak: true,
    // Don't load all achievements
  },
});

// Load achievements separately with limit
const achievements = await prisma.achievement.findMany({
  where: { studentId },
  orderBy: { unlockedAt: "desc" },
  take: 20, // Only recent 20
});
```

---

## 🚀 Future Enhancements

### Planned Features (FAZA 5+)

1. **Badges System**
   - Visual badges for achievements
   - Badge showcase on profile
   - Rare badge trading/gifting

2. **Team Challenges**
   - Class-based competitions
   - Team XP pooling
   - Collaborative achievements

3. **Seasonal Events**
   - Limited-time achievements
   - Seasonal leaderboards
   - Special rewards

4. **Customization**
   - Avatar customization with XP
   - Profile themes
   - Title system (e.g., "Streak Master")

5. **Analytics Dashboard**
   - XP earning trends
   - Achievement completion rate
   - Leaderboard position history

6. **Push Notifications**
   - Streak reminder (daily)
   - Leaderboard position changes
   - Achievement unlock notifications

---

## 🛠️ Troubleshooting

### Issue: XP Not Awarded

**Symptoms**: Homework submitted but no XP gained

**Causes**:
1. Gamification record doesn't exist
2. XP calculation error
3. Database update failed

**Solution**:
```typescript
// Check if gamification record exists
const gamif = await prisma.gamification.findUnique({
  where: { studentId }
});

if (!gamif) {
  // Create record
  await prisma.gamification.create({
    data: { studentId }
  });
}
```

---

### Issue: Streak Not Updating

**Symptoms**: Daily activity but streak stays at 0

**Causes**:
1. Timezone mismatch
2. Activity date not saved
3. Streak freeze not deactivating

**Solution**:
```typescript
// Ensure consistent timezone
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// Save activity date
await prisma.gamification.update({
  where: { studentId },
  data: { lastActivityDate: today }
});
```

---

### Issue: Leaderboard Not Showing

**Symptoms**: Empty leaderboard or missing entries

**Causes**:
1. Privacy filter too strict
2. No users with showOnLeaderboard=true
3. XP values all zero

**Solution**:
```typescript
// Check privacy settings
const visibleUsers = await prisma.gamification.count({
  where: { showOnLeaderboard: true }
});

console.log(`${visibleUsers} users visible on leaderboard`);

// If count is low, ask users to enable visibility
```

---

## 📚 References

### Related Documentation
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Overall project architecture
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Testing procedures
- [BIOMETRIC_AUTH.md](./BIOMETRIC_AUTH.md) - Authentication system (FAZA 3)

### External Resources
- [Gamification Design Principles](https://www.interaction-design.org/literature/article/gamification-design)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Framer Motion](https://www.framer.com/motion/)

---

## 📞 Support

For questions or issues with the gamification system:

1. Check this documentation first
2. Review code comments in implementation files
3. Check existing achievements in `lib/gamification/achievements.ts`
4. Test with demo account: `npm run db:seed:demo`

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Complete & Production Ready
