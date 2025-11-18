/**
 * Weekly Report Viewer Component
 *
 * Displays comprehensive weekly reports with statistics, charts, and recommendations.
 * Features:
 * - XP trends visualization
 * - Homework completion stats
 * - Subject performance breakdown
 * - Achievement showcase
 * - Personalized recommendations
 * - Print/PDF export functionality
 */

"use client";

import { format } from "date-fns";
import { sr } from "date-fns/locale";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type React from "react";
import type { WeeklyReportData } from "@/lib/reports/weekly-report-generator";
import { cn } from "@/lib/utils";

interface WeeklyReportViewProps {
  report: WeeklyReportData;
  onDownloadPdf?: () => void;
  showPrintButton?: boolean;
}

export function WeeklyReportView({
  report,
  onDownloadPdf,
  showPrintButton = true,
}: WeeklyReportViewProps) {
  const {
    student,
    period,
    gamification,
    homework,
    subjects,
    achievements,
    recommendations,
  } = report;

  const weekLabel = `${format(period.startDate, "d. MMM", { locale: sr })} - ${format(period.endDate, "d. MMM yyyy", { locale: sr })}`;

  const xpTrend =
    gamification.xpChange > 0
      ? "up"
      : gamification.xpChange < 0
        ? "down"
        : "neutral";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Nedeljni Izveštaj
          </h1>
          <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
            {student.name} • {student.grade}. razred
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            {weekLabel}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {showPrintButton && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Štampaj
            </button>
          )}
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Preuzmi PDF
            </button>
          )}
        </div>
      </div>

      {/* Gamification Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly XP */}
        <StatCard
          icon={<Star className="w-6 h-6" />}
          label="Nedeljni XP"
          value={gamification.weeklyXP}
          trend={xpTrend}
          trendValue={gamification.xpChange}
          color="blue"
        />

        {/* Streak */}
        <StatCard
          icon={<Flame className="w-6 h-6" />}
          label="Streak"
          value={`${gamification.currentStreak} dana`}
          subtitle="Redovan rad"
          color="orange"
        />

        {/* Level */}
        <StatCard
          icon={<Award className="w-6 h-6" />}
          label="Nivo"
          value={gamification.currentLevel}
          subtitle={`${gamification.totalHomeworkDone} zadataka ukupno`}
          color="purple"
        />

        {/* Achievements */}
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="Nova Dostignuća"
          value={gamification.achievementsUnlocked}
          subtitle="Otkljućano ove nedelje"
          color="green"
        />
      </div>

      {/* Homework Completion Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Domaći Zadaci
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {homework.completed} od {homework.total} završeno
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">
              Procenat završenih
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {Math.round(homework.completionRate)}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                homework.completionRate >= 90
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : homework.completionRate >= 70
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                    : "bg-gradient-to-r from-yellow-500 to-orange-500",
              )}
              style={{ width: `${homework.completionRate}%` }}
            />
          </div>
        </div>

        {/* Homework Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-700 dark:text-green-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-2xl font-bold">{homework.completed}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Završeno</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-2xl font-bold">{homework.pending}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Na čekanju
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-2xl font-bold">{homework.total}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Ukupno</p>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      {subjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📖 Performanse Po Predmetima
          </h2>

          <div className="space-y-3">
            {subjects.map((subject, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {subject.homeworkCount}{" "}
                    {subject.homeworkCount === 1 ? "zadatak" : "zadataka"}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Completion Rate Bar */}
                  <div className="hidden sm:block w-32">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          subject.completionRate >= 90
                            ? "bg-green-500"
                            : subject.completionRate >= 70
                              ? "bg-blue-500"
                              : "bg-yellow-500",
                        )}
                        style={{ width: `${subject.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="text-right min-w-[60px]">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(subject.completionRate)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🏆 Nova Dostignuća
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {achievement.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {format(achievement.unlockedAt, "d. MMM", { locale: sr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 shadow-sm border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            💡 Preporuke Za Napredak
          </h2>

          <ul className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                </div>
                <p className="flex-1 text-gray-700 dark:text-gray-300">
                  {recommendation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p>
          Izveštaj automatski generisan za period {weekLabel} •{" "}
          {format(new Date(), "d. MMMM yyyy. 'u' HH:mm", { locale: sr })}
        </p>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  color?: "blue" | "green" | "orange" | "purple";
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  trendValue,
  color = "blue",
}: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    orange:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    purple:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>{icon}</div>

        {trend && trendValue !== undefined && trendValue !== 0 && (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend === "up"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trendValue)}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
