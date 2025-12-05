"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Star,
  Target,
  Zap,
  Award,
  Clock,
  TrendingUp,
  Users,
  Loader,
  Lock,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { format } from "date-fns";
import { sr } from "date-fns/locale";
import { toast } from "sonner";
import { staggerContainer, staggerItem } from "@/lib/animations/variants";
import { useOfflineAchievements } from "@/hooks/use-offline-achievements";
import { Celebration } from "@/components/ui/celebration";
import { checkAchievementsAction } from "@/app/actions/achievements";
import { SectionErrorBoundary } from "@/components/features/section-error-boundary";

interface Achievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  xpReward: number;
  unlockedAt: string | Date;
}

interface AchievementProgress {
  type: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AchievementStats {
  total: number;
  totalXP: number;
  level: number;
  currentXP: number;
  totalXPEarned: number;
}

interface AchievementsData {
  achievements: Achievement[];
  progress: AchievementProgress[];
  stats: AchievementStats;
}

// Achievement type union for strict typing
type AchievementType = 
  | "FIRST_HOMEWORK" | "HOMEWORK_STREAK_3" | "HOMEWORK_STREAK_7" | "HOMEWORK_STREAK_30"
  | "ALL_HOMEWORK_WEEK" | "EARLY_SUBMISSION" | "PERFECT_WEEK" | "GRADE_FIVE"
  | "PERFECT_MONTH" | "TOP_STUDENT" | "LEVEL_5" | "LEVEL_10" | "LEVEL_20"
  | "XP_1000" | "XP_5000" | "XP_10000" | "HELPFUL_STUDENT" | "NIGHT_OWL"
  | "EARLY_BIRD" | "SPEEDRUNNER";

// Localization map for Serbian achievement names
const ACHIEVEMENT_NAMES: Record<AchievementType, string> = {
  FIRST_HOMEWORK: "Prvi Domaći",
  HOMEWORK_STREAK_3: "Niz od 3 Dana",
  HOMEWORK_STREAK_7: "Niz od 7 Dana",
  HOMEWORK_STREAK_30: "Niz od 30 Dana",
  ALL_HOMEWORK_WEEK: "Sav Domaći za Nedelju",
  EARLY_SUBMISSION: "Rana Predaja",
  PERFECT_WEEK: "Savršena Nedelja",
  GRADE_FIVE: "Petica",
  PERFECT_MONTH: "Savršen Mesec",
  TOP_STUDENT: "Najbolji Učenik",
  LEVEL_5: "Nivo 5",
  LEVEL_10: "Nivo 10",
  LEVEL_20: "Nivo 20",
  XP_1000: "1000 XP",
  XP_5000: "5000 XP",
  XP_10000: "10000 XP",
  HELPFUL_STUDENT: "Pomoćni Učenik",
  NIGHT_OWL: "Noćna Ptica",
  EARLY_BIRD: "Rana Ptica",
  SPEEDRUNNER: "Brzinac",
};

// Helper function to get localized achievement name
function getAchievementName(type: string): string {
  return ACHIEVEMENT_NAMES[type as AchievementType] || type.replace(/_/g, " ");
}

const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  FIRST_HOMEWORK: <Star className="w-6 h-6" />,
  HOMEWORK_STREAK_3: <Target className="w-6 h-6" />,
  HOMEWORK_STREAK_7: <Trophy className="w-6 h-6" />,
  HOMEWORK_STREAK_30: <Award className="w-6 h-6" />,
  ALL_HOMEWORK_WEEK: <CheckCircle2 className="w-6 h-6" />,
  EARLY_SUBMISSION: <Clock className="w-6 h-6" />,
  PERFECT_WEEK: <TrendingUp className="w-6 h-6" />,
  GRADE_FIVE: <Star className="w-6 h-6" />,
  PERFECT_MONTH: <Trophy className="w-6 h-6" />,
  TOP_STUDENT: <Award className="w-6 h-6" />,
  LEVEL_5: <Zap className="w-6 h-6" />,
  LEVEL_10: <Zap className="w-6 h-6" />,
  LEVEL_20: <Zap className="w-6 h-6" />,
  XP_1000: <Star className="w-6 h-6" />,
  XP_5000: <Star className="w-6 h-6" />,
  XP_10000: <Star className="w-6 h-6" />,
  HELPFUL_STUDENT: <Users className="w-6 h-6" />,
  NIGHT_OWL: <Clock className="w-6 h-6" />,
  EARLY_BIRD: <Clock className="w-6 h-6" />,
  SPEEDRUNNER: <Zap className="w-6 h-6" />,
};

const ACHIEVEMENT_COLORS: Record<string, string> = {
  FIRST_HOMEWORK: "from-yellow-400 to-yellow-600",
  HOMEWORK_STREAK_3: "from-blue-400 to-blue-600",
  HOMEWORK_STREAK_7: "from-purple-400 to-purple-600",
  HOMEWORK_STREAK_30: "from-pink-400 to-pink-600",
  ALL_HOMEWORK_WEEK: "from-green-400 to-green-600",
  EARLY_SUBMISSION: "from-cyan-400 to-cyan-600",
  PERFECT_WEEK: "from-indigo-400 to-indigo-600",
  GRADE_FIVE: "from-yellow-400 to-yellow-600",
  PERFECT_MONTH: "from-orange-400 to-orange-600",
  TOP_STUDENT: "from-red-400 to-red-600",
  LEVEL_5: "from-teal-400 to-teal-600",
  LEVEL_10: "from-blue-400 to-blue-600",
  LEVEL_20: "from-purple-400 to-purple-600",
  XP_1000: "from-green-400 to-green-600",
  XP_5000: "from-yellow-400 to-yellow-600",
  XP_10000: "from-red-400 to-red-600",
  HELPFUL_STUDENT: "from-pink-400 to-pink-600",
  NIGHT_OWL: "from-indigo-400 to-indigo-600",
  EARLY_BIRD: "from-orange-400 to-orange-600",
  SPEEDRUNNER: "from-cyan-400 to-cyan-600",
};

export default function AchievementsDashboard() {
  const { data, loading, isOnline, refresh } = useOfflineAchievements();
  const [checking, setChecking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const isMountedRef = useRef(true);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkAchievements = async () => {
    if (!isOnline) {
      toast.error("Provera postignuća zahteva internet konekciju");
      return;
    }

    try {
      setChecking(true);
      const result = await checkAchievementsAction();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data && result.data.newUnlocks > 0) {
        toast.success(`🏆 Otključano ${result.data.newUnlocks} novih postignuća!`);
        if (isMountedRef.current) {
          setShowCelebration(true);
          setStatusMessage(`Otključano ${result.data.newUnlocks} novih postignuća`);
        }
      } else {
        toast.info("Nema novih postignuća");
        if (isMountedRef.current) {
          setStatusMessage("Nema novih postignuća");
        }
      }
      
      await refresh();
    } catch (error) {
      console.error("Error checking achievements:", error);
      toast.error("Greška pri proveri postignuća");
      if (isMountedRef.current) {
        setStatusMessage("Greška pri proveri postignuća");
      }
    } finally {
      if (isMountedRef.current) {
        setChecking(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">
          Nije moguće učitati postignuća
        </p>
      </div>
    );
  }

  // Cast data to AchievementsData to match the interface if needed, 
  // though the hook should return compatible structure.
  // The hook returns StoredGamificationData which has string dates, 
  // while the component expects Date objects in some places.
  // We handle the date formatting in the render.
  const { achievements, progress, stats } = data as unknown as AchievementsData;

  // Memoize filtered progress to avoid recalculation on every render
  const inProgressAchievements = useMemo(
    () => progress.filter((p) => (p.progress || 0) > 0),
    [progress]
  );

  const lockedAchievements = useMemo(
    () => progress.filter((p) => (p.progress || 0) === 0),
    [progress]
  );

  // Safe celebration complete handler
  const handleCelebrationComplete = () => {
    if (isMountedRef.current) {
      setShowCelebration(false);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <Celebration trigger={showCelebration} onComplete={handleCelebrationComplete} />
      
      {/* Aria-live region for screen readers */}
      <output aria-live="polite" className="sr-only">
        {statusMessage}
      </output>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Postignuća
          </h1>
          <p className="text-muted-foreground mt-2">
            Prati svoj napredak i otključavaj nagrade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              isOnline
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
            role="status"
            aria-label={isOnline ? "Povezani ste na internet" : "Radite offline - podaci su lokalno sačuvani"}
          >
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>
          <Button
            onClick={checkAchievements}
            disabled={checking || !isOnline}
            className="flex items-center gap-2"
          >
            {checking ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Proveri Nova Postignuća</span>
            <span className="sm:hidden">Proveri</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <SectionErrorBoundary sectionName="Statistika">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          role="region"
          aria-label="Statistika postignuća"
        >
          <motion.div variants={staggerItem}>
            <Card 
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-0"
              role="group"
              aria-label={`Otključano ${stats.total} postignuća`}
            >
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Otključano</p>
                  <p className="text-3xl font-bold text-yellow-700">
                    {stats.total}
                  </p>
                </div>
                <Trophy className="w-12 h-12 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card 
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-0"
            role="group"
            aria-label={`Ukupno ${stats.totalXP} XP bodova`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ukupno XP</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {stats.totalXP}
                  </p>
                </div>
                <Star className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card 
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-0"
            role="group"
            aria-label={`Nivo ${stats.level}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nivo</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {stats.level}
                  </p>
                </div>
                <Zap className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card 
            className="bg-gradient-to-br from-green-50 to-green-100 border-0"
            role="group"
            aria-label={`${inProgressAchievements.length} postignuća u toku`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Napredak</p>
                  <p className="text-3xl font-bold text-green-700">
                    {inProgressAchievements.length}
                  </p>
                </div>
                <Target className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      </SectionErrorBoundary>

      {/* Unlocked Achievements */}
      {achievements.length > 0 && (
        <SectionErrorBoundary sectionName="Otključana Postignuća">
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            Otključana Postignuća
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {achievements.map((achievement) => (
              <motion.div key={achievement.id} variants={staggerItem}>
                <Card
                  className={`border-0 bg-gradient-to-br ${
                    ACHIEVEMENT_COLORS[achievement.achievementType] ||
                    "from-gray-400 to-gray-600"
                  } text-white hover:shadow-lg transition-all`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        {ACHIEVEMENT_ICONS[achievement.achievementType] || (
                          <Award className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">
                          {achievement.title}
                        </h3>
                        <p className="text-sm opacity-90 mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="bg-white/20 text-white"
                          >
                            +{achievement.xpReward} XP
                          </Badge>
                          <span className="text-xs opacity-75">
                            {format(
                              new Date(achievement.unlockedAt),
                              "dd. MMM yyyy",
                              { locale: sr }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
        </SectionErrorBoundary>
      )}

      {/* Progress Achievements */}
      {inProgressAchievements.length > 0 && (
        <SectionErrorBoundary sectionName="Postignuća u Toku">
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-gray-500" />
            U Toku
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {inProgressAchievements.map((item) => {
                const progressPercentage =
                  ((item.progress || 0) / (item.maxProgress || 1)) * 100;

                return (
                  <motion.div key={item.type} variants={staggerItem}>
                    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gray-200 rounded-lg">
                            {ACHIEVEMENT_ICONS[item.type] || (
                              <Lock className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 text-gray-700">
                              {getAchievementName(item.type)}
                            </h3>
                            <div className="space-y-2">
                              <Progress
                                value={progressPercentage}
                                className="h-2"
                                aria-label={`Napredak: ${item.progress || 0} od ${item.maxProgress || 1}`}
                              />
                              <p className="text-sm text-gray-600">
                                {item.progress || 0} / {item.maxProgress || 1}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </motion.div>
        </div>
        </SectionErrorBoundary>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <SectionErrorBoundary sectionName="Zaključana Postignuća">
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-gray-400" />
            Zaključano
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {lockedAchievements.map((item) => (
                <motion.div key={item.type} variants={staggerItem}>
                  <Card className="border border-gray-200 bg-white opacity-50">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {ACHIEVEMENT_ICONS[item.type] || (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                          {getAchievementName(item.type)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </motion.div>
        </div>
        </SectionErrorBoundary>
      )}
    </div>
  );
}
