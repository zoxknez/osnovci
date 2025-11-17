/**
 * Leaderboard Component
 *
 * Displays student rankings across different time periods:
 * - All-Time: Total XP leaderboard
 * - Weekly: Current week's XP
 * - Monthly: Current month's XP
 *
 * Features:
 * - Top 3 podium display
 * - Current user highlight
 * - Privacy controls
 * - Achievement counts
 * - Auto-refresh on tab change
 */

"use client";

import {
  Calendar,
  Clock,
  Crown,
  Medal,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";

type LeaderboardPeriod = "all-time" | "weekly" | "monthly";

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  avatar: string | null;
  level: number;
  xp: number;
  totalXPEarned?: number;
  streak?: number;
  longestStreak?: number;
  totalHomeworkDone?: number;
  achievementCounts?: {
    COMMON: number;
    RARE: number;
    EPIC: number;
    LEGENDARY: number;
  };
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  totalPlayers?: number;
  nextResetTime?: string;
}

interface LeaderboardProps {
  studentId: string;
  period?: LeaderboardPeriod;
  showOnLeaderboard: boolean;
  onToggleVisibility: (visible: boolean) => void;
}

export function Leaderboard({
  studentId,
  period = "all-time",
  showOnLeaderboard,
  onToggleVisibility,
}: LeaderboardProps) {
  const [activePeriod, setActivePeriod] =
    React.useState<LeaderboardPeriod>(period);
  const [data, setData] = React.useState<LeaderboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/gamification/leaderboard/${activePeriod}`,
      );
      if (!response.ok) throw new Error("Failed to load leaderboard");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [activePeriod]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const topThree = data?.entries.slice(0, 3) || [];
  const restOfList = data?.entries.slice(3) || [];

  const getPeriodLabel = () => {
    switch (activePeriod) {
      case "all-time":
        return "Svih Vremena";
      case "weekly":
        return "Nedeljni";
      case "monthly":
        return "Mesečni";
    }
  };

  const getPeriodIcon = () => {
    switch (activePeriod) {
      case "all-time":
        return <Trophy className="w-5 h-5" />;
      case "weekly":
        return <Calendar className="w-5 h-5" />;
      case "monthly":
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          type="button"
          onClick={() => setActivePeriod("all-time")}
          className={cn(
            "flex-1 py-2 px-4 rounded-md font-medium transition-colors",
            activePeriod === "all-time"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
          )}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Sve Vreme
        </button>
        <button
          type="button"
          onClick={() => setActivePeriod("weekly")}
          className={cn(
            "flex-1 py-2 px-4 rounded-md font-medium transition-colors",
            activePeriod === "weekly"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
          )}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Nedelja
        </button>
        <button
          type="button"
          onClick={() => setActivePeriod("monthly")}
          className={cn(
            "flex-1 py-2 px-4 rounded-md font-medium transition-colors",
            activePeriod === "monthly"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
          )}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Mesec
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getPeriodIcon()}
          <h3 className="text-lg font-bold">Tabela {getPeriodLabel()}</h3>
        </div>
        {data?.totalPlayers && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.totalPlayers} igrača
          </p>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-600 dark:text-gray-400">
          Učitavanje...
        </div>
      ) : !data || data.entries.length === 0 ? (
        <div className="py-12 text-center text-gray-600 dark:text-gray-400">
          Nema podataka za prikaz
        </div>
      ) : (
        <>
          {/* Podium (Top 3) */}
          {topThree.length > 0 && (
            <div className="flex items-end justify-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              {/* 2nd Place */}
              {topThree[1] && (
                <PodiumCard
                  entry={topThree[1]}
                  rank={2}
                  isCurrentUser={topThree[1].studentId === studentId}
                />
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <PodiumCard
                  entry={topThree[0]}
                  rank={1}
                  isCurrentUser={topThree[0].studentId === studentId}
                />
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <PodiumCard
                  entry={topThree[2]}
                  rank={3}
                  isCurrentUser={topThree[2].studentId === studentId}
                />
              )}
            </div>
          )}

          {/* Rest of List */}
          {restOfList.length > 0 && (
            <div className="space-y-2">
              {restOfList.map((entry) => (
                <LeaderboardRow
                  key={entry.studentId}
                  entry={entry}
                  isCurrentUser={entry.studentId === studentId}
                  period={activePeriod}
                />
              ))}
            </div>
          )}

          {/* Current User Rank (if not in list) */}
          {data.currentUserRank &&
            data.currentUserRank > data.entries.length && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full font-bold">
                    {data.currentUserRank}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Tvoja Pozicija</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nastavi da radiš! 💪
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            )}

          {/* Reset Info */}
          {data.nextResetTime && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Reset:{" "}
              {new Date(data.nextResetTime).toLocaleDateString("sr-RS", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
          )}
        </>
      )}

      {/* Visibility Toggle */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnLeaderboard}
            onChange={(e) => onToggleVisibility(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <p className="font-medium">Prikaži me na tabeli</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tvoja pozicija će biti vidljiva drugim igračima
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

// Podium Card Component
function PodiumCard({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}) {
  const getMedalIcon = () => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-700" />;
      default:
        return <Medal className="w-5 h-5 text-gray-400" />;
    }
  };

  const getHeight = () => {
    switch (rank) {
      case 1:
        return "h-40";
      case 2:
        return "h-32";
      case 3:
        return "h-28";
      default:
        return "h-28";
    }
  };

  const getBorderColor = () => {
    if (isCurrentUser) return "border-blue-500";
    switch (rank) {
      case 1:
        return "border-yellow-500";
      case 2:
        return "border-gray-400";
      case 3:
        return "border-amber-700";
      default:
        return "border-gray-400";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2",
        rank === 1 ? "scale-110" : "",
      )}
    >
      <div className="relative">
        {entry.avatar ? (
          <Image
            src={entry.avatar}
            alt={entry.name}
            width={64}
            height={64}
            className={cn("rounded-full border-4", getBorderColor())}
          />
        ) : (
          <div
            className={cn(
              "w-16 h-16 rounded-full border-4 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl",
              getBorderColor(),
            )}
          >
            {entry.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute -top-2 -right-2">{getMedalIcon()}</div>
      </div>
      <p className="font-bold text-center">{entry.name}</p>
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-t-lg px-6 py-3 min-w-[100px]",
          getHeight(),
          rank === 1 && "bg-gradient-to-t from-yellow-500 to-yellow-400",
          rank === 2 && "bg-gradient-to-t from-gray-400 to-gray-300",
          rank === 3 && "bg-gradient-to-t from-amber-700 to-amber-600",
        )}
      >
        <p className="text-2xl font-bold text-white">{entry.xp}</p>
        <p className="text-sm text-white/80">XP</p>
        <p className="text-xs text-white/70 mt-1">Level {entry.level}</p>
      </div>
    </div>
  );
}

// Leaderboard Row Component
function LeaderboardRow({
  entry,
  isCurrentUser,
  period,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  period: LeaderboardPeriod;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isCurrentUser
          ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
          : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750",
      )}
    >
      {/* Rank */}
      <div className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full font-bold text-gray-700 dark:text-gray-300">
        {entry.rank}
      </div>

      {/* Avatar */}
      {entry.avatar ? (
        <Image
          src={entry.avatar}
          alt={entry.name}
          width={40}
          height={40}
          className="rounded-full"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
          {entry.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1">
        <p className="font-medium">{entry.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Level {entry.level} • {entry.xp} XP
        </p>
      </div>

      {/* Stats */}
      {period === "all-time" && entry.achievementCounts && (
        <div className="flex items-center gap-2 text-xs">
          {entry.achievementCounts.LEGENDARY > 0 && (
            <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded font-bold">
              {entry.achievementCounts.LEGENDARY} ⭐
            </span>
          )}
          {entry.achievementCounts.EPIC > 0 && (
            <span className="px-2 py-1 bg-purple-500 text-white rounded">
              {entry.achievementCounts.EPIC} 💎
            </span>
          )}
        </div>
      )}

      {period !== "all-time" && (
        <div className="text-right">
          <p className="font-bold text-lg">{entry.xp}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">XP</p>
        </div>
      )}

      {isCurrentUser && (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium">
          <TrendingUp className="w-3 h-3" />
          TI
        </div>
      )}
    </div>
  );
}
