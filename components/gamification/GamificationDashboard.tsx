/**
 * Gamification Dashboard Component
 *
 * Main dashboard showing student's gamification progress:
 * - Level & XP
 * - Streak status
 * - Recent achievements
 * - Leaderboard position
 * - Achievement showcase
 *
 * Usage:
 * ```tsx
 * <GamificationDashboard studentId={studentId} />
 * ```
 */

"use client";

import { Eye, EyeOff, Flame, Star, TrendingUp, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getGamificationAction,
  updateGamificationSettingsAction,
} from "@/app/actions/gamification";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AchievementBadge } from "./AchievementBadge";
import { LevelProgressBar } from "./LevelProgressBar";
import { StreakDisplay } from "./StreakDisplay";

interface GamificationData {
  level: number;
  xp: number;
  totalXPEarned: number;
  streak: number;
  longestStreak: number;
  streakFreezes: number;
  totalHomeworkDone: number;
  weeklyXP: number;
  monthlyXP: number;
  showOnLeaderboard: boolean;
  recentAchievements: Array<{
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
    xpReward: number;
    unlockedAt: Date;
  }>;
  leaderboardPosition?: {
    rank: number;
    totalPlayers: number;
  };
}

interface GamificationDashboardProps {
  studentId: string;
  initialData?: GamificationData;
}

export function GamificationDashboard({
  studentId,
  initialData,
}: GamificationDashboardProps) {
  const [data, setData] = useState<GamificationData | null>(
    initialData || null,
  );
  const [loading, setLoading] = useState(!initialData);
  const [activeTab, setActiveTab] = useState<
    "overview" | "achievements" | "leaderboard"
  >("overview");

  const loadGamificationData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getGamificationAction(studentId);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        console.error("Failed to load gamification data:", result.error);
      }
    } catch (error) {
      console.error("Failed to load gamification data:", error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!initialData) {
      loadGamificationData();
    }
  }, [initialData, loadGamificationData]);

  const toggleLeaderboardVisibility = async () => {
    try {
      const result = await updateGamificationSettingsAction(studentId, {
        showOnLeaderboard: !data?.showOnLeaderboard,
      });

      if (result.success && result.data) {
        setData((prev) =>
          prev
            ? { ...prev, showOnLeaderboard: result.data.showOnLeaderboard }
            : null,
        );
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nema gamification podataka
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="w-8 h-8 text-amber-500" />
              <span className="text-3xl font-bold">{data.level}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Streak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="w-8 h-8 text-orange-600" />
              <span className="text-3xl font-bold">{data.streak}</span>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total XP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold">
                {data.totalXPEarned.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Homework Done</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold">
                {data.totalHomeworkDone}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 font-medium transition-colors border-b-2",
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("achievements")}
          className={cn(
            "px-4 py-2 font-medium transition-colors border-b-2",
            activeTab === "achievements"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Achievements
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          className={cn(
            "px-4 py-2 font-medium transition-colors border-b-2",
            activeTab === "leaderboard"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Leaderboard
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Level Progress</CardTitle>
              <CardDescription>Your journey to the top</CardDescription>
            </CardHeader>
            <CardContent>
              <LevelProgressBar
                level={data.level}
                currentXP={data.xp}
                totalXP={data.totalXPEarned}
              />
            </CardContent>
          </Card>

          {/* Streak */}
          <Card>
            <CardHeader>
              <CardTitle>Streak Status</CardTitle>
              <CardDescription>Keep the momentum going!</CardDescription>
            </CardHeader>
            <CardContent>
              <StreakDisplay
                currentStreak={data.streak}
                longestStreak={data.longestStreak}
                streakFreezes={data.streakFreezes}
              />
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your latest unlocks</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentAchievements.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {data.recentAchievements.slice(0, 6).map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      size="md"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Još nemaš otključanih achievement-a. Nastavi sa radom! 💪
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weekly/Monthly Stats */}
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
              <CardDescription>Your weekly performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Weekly XP
                    </span>
                    <span className="font-bold">{data.weeklyXP}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{
                        width: `${Math.min((data.weeklyXP / 500) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>This Month</CardTitle>
              <CardDescription>Your monthly performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Monthly XP
                    </span>
                    <span className="font-bold">{data.monthlyXP}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{
                        width: `${Math.min((data.monthlyXP / 2000) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <Card>
          <CardHeader>
            <CardTitle>All Achievements</CardTitle>
            <CardDescription>
              {data.recentAchievements.length} unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {data.recentAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="lg"
                />
              ))}
            </div>
            {data.recentAchievements.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                Još nemaš achievement-a. Počni sa radom! 🚀
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>
                  {data.leaderboardPosition
                    ? `Rank #${data.leaderboardPosition.rank} of ${data.leaderboardPosition.totalPlayers}`
                    : "Not ranked"}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLeaderboardVisibility}
              >
                {data.showOnLeaderboard ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hidden
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Leaderboard funkcionalnost - videćeš svoju poziciju među drugima!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
