/**
 * Parental Oversight Dashboard - Panel za Roditelje
 * 
 * Kompletni pregled aktivnosti djeteta za roditelje:
 * - Pregled domaćih zadataka
 * - Statistike i trendovi
 * - Postignuća
 * - Bezbjednosni izvještaji
 * - Direktna komunikacija
 */

"use client";

import { useState, useMemo } from "react";
import { 
  BookOpen,
  TrendingUp,
  Trophy,
  Shield,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ChevronRight,
  Star,
  Flame,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { sr } from "date-fns/locale";

interface StudentInfo {
  id: string;
  name: string;
  grade: number;
  class: string;
  school: string;
  avatar?: string;
}

interface HomeworkItem {
  id: string;
  title: string;
  subject: { name: string; color: string };
  dueDate: Date | string;
  status: "ASSIGNED" | "IN_PROGRESS" | "DONE" | "SUBMITTED" | "REVIEWED";
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  reviewNote?: string;
}

interface GamificationStats {
  level: number;
  xp: number;
  streak: number;
  totalHomeworkDone: number;
  achievements: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: Date | string;
}

interface SafetyReport {
  id: string;
  type: "content_flag" | "time_alert" | "pii_detected";
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: Date | string;
  resolved: boolean;
}

interface ParentalDashboardProps {
  student: StudentInfo;
  homework: HomeworkItem[];
  gamification: GamificationStats;
  recentActivity: ActivityItem[];
  safetyReports?: SafetyReport[];
  className?: string;
}

export function ParentalDashboard({
  student,
  homework,
  gamification,
  recentActivity,
  safetyReports = [],
  className,
}: ParentalDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "homework" | "progress" | "safety"
  >("overview");

  // Statistike
  const stats = useMemo(() => {
    const pending = homework.filter(h => 
      h.status === "ASSIGNED" || h.status === "IN_PROGRESS"
    ).length;
    const completed = homework.filter(h => 
      h.status === "DONE" || h.status === "SUBMITTED" || h.status === "REVIEWED"
    ).length;
    const overdue = homework.filter(h => {
      const due = new Date(h.dueDate);
      return due < new Date() && h.status !== "DONE" && h.status !== "SUBMITTED";
    }).length;
    const urgent = homework.filter(h => h.priority === "URGENT").length;
    
    return { pending, completed, overdue, urgent };
  }, [homework]);

  const unresolvedSafetyIssues = safetyReports.filter(r => !r.resolved);

  const getStatusColor = (status: HomeworkItem["status"]) => {
    switch (status) {
      case "DONE":
      case "SUBMITTED":
      case "REVIEWED":
        return "text-green-600 bg-green-50";
      case "IN_PROGRESS":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusLabel = (status: HomeworkItem["status"]) => {
    switch (status) {
      case "DONE": return "Završeno";
      case "SUBMITTED": return "Predato";
      case "REVIEWED": return "Pregledano";
      case "IN_PROGRESS": return "U toku";
      default: return "Čeka";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header - Student Info */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
              {student.avatar || student.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-blue-100">
                {student.grade}. razred, odeljenje {student.class} • {student.school}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Flame className="w-5 h-5 text-orange-300" />
                  <span className="text-2xl font-bold">{gamification.streak}</span>
                </div>
                <span className="text-xs text-blue-100">dana zaredom</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <span className="text-2xl font-bold">{gamification.level}</span>
                </div>
                <span className="text-xs text-blue-100">nivo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 divide-x">
          <div className="p-4 text-center">
            <span className="block text-2xl font-bold text-gray-800">
              {stats.completed}
            </span>
            <span className="text-xs text-gray-500">Završeno</span>
          </div>
          <div className="p-4 text-center">
            <span className="block text-2xl font-bold text-blue-600">
              {stats.pending}
            </span>
            <span className="text-xs text-gray-500">U toku</span>
          </div>
          <div className="p-4 text-center">
            <span className={cn(
              "block text-2xl font-bold",
              stats.overdue > 0 ? "text-red-600" : "text-gray-800"
            )}>
              {stats.overdue}
            </span>
            <span className="text-xs text-gray-500">Prekoračeno</span>
          </div>
          <div className="p-4 text-center">
            <span className="block text-2xl font-bold text-amber-600">
              {stats.urgent}
            </span>
            <span className="text-xs text-gray-500">Hitno</span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "overview" as const, label: "Pregled", icon: Eye },
          { id: "homework" as const, label: "Domaći", icon: BookOpen },
          { id: "progress" as const, label: "Napredak", icon: TrendingUp },
          { id: "safety" as const, label: "Bezbjednost", icon: Shield, badge: unresolvedSafetyIssues.length },
        ].map(({ id, label, icon: Icon, badge }) => (
          <Button
            key={id}
            variant={activeTab === id ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex items-center gap-2",
              badge && badge > 0 && "relative"
            )}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge && badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Nedavna Aktivnost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true, 
                        locale: sr 
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Nema nedavne aktivnosti
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                Predstojeći Rokovi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {homework
                .filter(h => h.status !== "DONE" && h.status !== "SUBMITTED")
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 5)
                .map((hw) => {
                  const dueDate = new Date(hw.dueDate);
                  const isOverdue = dueDate < new Date();
                  
                  return (
                    <div 
                      key={hw.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        isOverdue ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <div 
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: hw.subject.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {hw.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {hw.subject.name}
                        </p>
                      </div>
                      <div className={cn(
                        "text-right shrink-0",
                        isOverdue ? "text-red-600" : "text-gray-500"
                      )}>
                        <p className="text-xs font-medium">
                          {isOverdue ? "Prekoračeno" : format(dueDate, "d. MMM", { locale: sr })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              {homework.filter(h => h.status !== "DONE" && h.status !== "SUBMITTED").length === 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-700">Svi zadaci su završeni!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Postignuća
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {gamification.achievements}
                  </p>
                  <p className="text-sm text-gray-600">Otključanih postignuća</p>
                </div>
                <Trophy className="w-12 h-12 text-amber-400" />
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-gray-800">
                    {gamification.totalHomeworkDone}
                  </p>
                  <p className="text-xs text-gray-500">Ukupno domaćih</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-gray-800">
                    {gamification.xp.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">XP poena</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                Bezbjednost
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unresolvedSafetyIssues.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {unresolvedSafetyIssues.length} upozorenja čeka pregled
                      </p>
                      <p className="text-xs text-amber-600">
                        Kliknite na "Bezbjednost" za detalje
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <Shield className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-medium text-green-800">Sve je u redu!</p>
                    <p className="text-sm text-green-600">
                      Nema prijavljenih sigurnosnih problema
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "homework" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Svi Domaći Zadaci
              </span>
              <span className="text-sm font-normal text-gray-500">
                {homework.length} ukupno
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {homework.map((hw) => {
              const dueDate = new Date(hw.dueDate);
              const isOverdue = dueDate < new Date() && 
                hw.status !== "DONE" && hw.status !== "SUBMITTED";
              
              return (
                <div 
                  key={hw.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm",
                    isOverdue ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                  )}
                >
                  <div 
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: hw.subject.color }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-800 truncate">
                        {hw.title}
                      </h4>
                      {hw.priority === "URGENT" && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          Hitno
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{hw.subject.name}</span>
                      <span>•</span>
                      <span>
                        Rok: {format(dueDate, "d. MMM yyyy", { locale: sr })}
                      </span>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium shrink-0",
                    getStatusColor(hw.status)
                  )}>
                    {getStatusLabel(hw.status)}
                  </div>
                  
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {activeTab === "progress" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Level Napredak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white mb-4">
                  <span className="text-3xl font-bold">{gamification.level}</span>
                </div>
                <p className="text-gray-600">Trenutni nivo</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">XP do sledećeg nivoa</span>
                    <span className="font-medium">{gamification.xp % 1000}/1000</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${(gamification.xp % 1000) / 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Streak Istorija
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white mb-4">
                  <Flame className="w-8 h-8 mr-1" />
                  <span className="text-3xl font-bold">{gamification.streak}</span>
                </div>
                <p className="text-gray-600">Dana u nizu</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-xl text-center">
                <p className="text-sm text-orange-800">
                  {gamification.streak >= 7 
                    ? "🔥 Odličan streak! Nastavi tako!" 
                    : "Motivišite dijete da održava dnevni streak!"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "safety" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Bezbjednosni Izvještaji
            </CardTitle>
            <CardDescription>
              Pregled svih sigurnosnih upozorenja i aktivnosti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {safetyReports.length > 0 ? (
              <div className="space-y-3">
                {safetyReports.map((report) => (
                  <div 
                    key={report.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border",
                      report.resolved 
                        ? "bg-gray-50 border-gray-200" 
                        : report.severity === "high"
                          ? "bg-red-50 border-red-200"
                          : report.severity === "medium"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-blue-50 border-blue-200"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      report.severity === "high" ? "bg-red-100" :
                      report.severity === "medium" ? "bg-amber-100" : "bg-blue-100"
                    )}>
                      <AlertTriangle className={cn(
                        "w-5 h-5",
                        report.severity === "high" ? "text-red-600" :
                        report.severity === "medium" ? "text-amber-600" : "text-blue-600"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-800">
                          {report.type === "content_flag" ? "Sadržaj označen" :
                           report.type === "time_alert" ? "Upozorenje o vremenu" :
                           "Lični podaci detektovani"}
                        </h4>
                        {report.resolved && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            Riješeno
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{report.description}</p>
                      <span className="text-xs text-gray-400 mt-2 block">
                        {format(new Date(report.timestamp), "d. MMM yyyy, HH:mm", { locale: sr })}
                      </span>
                    </div>
                    
                    {!report.resolved && (
                      <Button variant="outline" size="sm">
                        Riješi
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="w-16 h-16 text-green-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Sve je sigurno!
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Nema sigurnosnih upozorenja. Sistem automatski prati aktivnost 
                  i obavještiće vas o bilo kakvim problemima.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
