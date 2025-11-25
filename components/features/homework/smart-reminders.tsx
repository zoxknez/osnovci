/**
 * Smart Reminders - Pametni Podsjetnici za Domaće
 * 
 * Inteligentni sistem podsjetnika koji:
 * - Analizira navike učenika
 * - Predlaže optimalno vrijeme za rad
 * - Upozorava na deadline-ove
 * - Procjenjuje vrijeme potrebno za zadatak
 */

"use client";

import { useState, useMemo } from "react";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Brain,
  TrendingUp,
  Zap,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { differenceInHours, isPast, isToday, isTomorrow } from "date-fns";

interface HomeworkItem {
  id: string;
  title: string;
  subject: {
    name: string;
    color: string;
  };
  dueDate: Date | string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  status: string;
  estimatedMinutes?: number;
  description?: string;
}

interface SmartRemindersProps {
  homework: HomeworkItem[];
  studentName?: string;
  averageCompletionTime?: number; // u minutima
  preferredStudyTime?: "morning" | "afternoon" | "evening";
  className?: string;
}

interface SmartInsight {
  type: "urgent" | "warning" | "tip" | "achievement";
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  homeworkId?: string;
}

// Procijeni vrijeme za zadatak na osnovu opisa i tipa
function estimateTaskTime(homework: HomeworkItem): number {
  if (homework.estimatedMinutes) return homework.estimatedMinutes;
  
  const descLength = homework.description?.length || 0;
  const baseTime = 20; // bazično 20 minuta
  
  // Dodaj vrijeme na osnovu dužine opisa
  const descriptionBonus = Math.floor(descLength / 100) * 5;
  
  // Dodaj vrijeme za teže predmete
  const hardSubjects = ["Matematika", "Fizika", "Hemija"];
  const subjectBonus = hardSubjects.some(s => 
    homework.subject.name.toLowerCase().includes(s.toLowerCase())
  ) ? 15 : 0;
  
  // Prioritet
  const priorityBonus = homework.priority === "URGENT" ? 10 : 
                        homework.priority === "IMPORTANT" ? 5 : 0;
  
  return Math.min(baseTime + descriptionBonus + subjectBonus + priorityBonus, 90);
}

// Odredi optimalnu preporuku za rad
function getStudyRecommendation(
  homework: HomeworkItem[],
  preferredTime: string = "afternoon"
): string {
  const urgentCount = homework.filter(h => {
    const dueDate = new Date(h.dueDate);
    return differenceInHours(dueDate, new Date()) < 24;
  }).length;

  if (urgentCount > 2) {
    return "Preporučujemo da počneš odmah - imaš više hitnih zadataka!";
  }

  const timeLabels = {
    morning: "ujutro (8-11h)",
    afternoon: "popodne (15-18h)",
    evening: "uveče (19-21h)"
  };

  return `Najbolje vrijeme za rad: ${timeLabels[preferredTime as keyof typeof timeLabels]}`;
}

// Generiši pametne uvide
function generateInsights(homework: HomeworkItem[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const now = new Date();
  
  // Sortiraj po deadline-u
  const sorted = [...homework].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  for (const hw of sorted) {
    const dueDate = new Date(hw.dueDate);
    const hoursLeft = differenceInHours(dueDate, now);

    // Prekoračen rok
    if (isPast(dueDate) && hw.status !== "DONE" && hw.status !== "SUBMITTED") {
      insights.push({
        type: "urgent",
        title: "Prekoračen rok!",
        description: `"${hw.title}" - ${hw.subject.name} je trebao biti predan`,
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        homeworkId: hw.id
      });
      continue;
    }

    // Manje od 6 sati
    if (hoursLeft > 0 && hoursLeft < 6 && hw.status !== "DONE") {
      insights.push({
        type: "urgent",
        title: "Hitno! Manje od 6 sati",
        description: `"${hw.title}" ističe za ${hoursLeft}h`,
        icon: <Clock className="w-5 h-5 text-red-500 animate-pulse" />,
        homeworkId: hw.id
      });
    }
    // Danas
    else if (isToday(dueDate) && hw.status !== "DONE") {
      insights.push({
        type: "warning",
        title: "Danas je rok!",
        description: `"${hw.title}" - ${hw.subject.name}`,
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        homeworkId: hw.id
      });
    }
    // Sutra
    else if (isTomorrow(dueDate) && hw.status !== "DONE") {
      insights.push({
        type: "warning",
        title: "Sutra je rok",
        description: `"${hw.title}" - spremi se na vrijeme`,
        icon: <Calendar className="w-5 h-5 text-orange-500" />,
        homeworkId: hw.id
      });
    }
  }

  // Dodaj motivacijske poruke ako nema hitnih
  if (insights.filter(i => i.type === "urgent").length === 0) {
    const pendingCount = homework.filter(h => h.status !== "DONE" && h.status !== "SUBMITTED").length;
    
    if (pendingCount === 0) {
      insights.push({
        type: "achievement",
        title: "Sve je završeno! 🎉",
        description: "Nemaš aktivnih domaćih zadataka. Odlično!",
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });
    } else if (pendingCount <= 2) {
      insights.push({
        type: "tip",
        title: "Odlično napreduješ!",
        description: `Samo još ${pendingCount} zadatak${pendingCount > 1 ? 'a' : ''} do cilja`,
        icon: <TrendingUp className="w-5 h-5 text-blue-500" />
      });
    }
  }

  // Tip za produktivnost
  const urgentTasks = insights.filter(i => i.type === "urgent" || i.type === "warning").length;
  if (urgentTasks > 0 && urgentTasks < 4) {
    insights.push({
      type: "tip",
      title: "💡 Savjet",
      description: "Počni sa najtežim zadatkom dok si svež!",
      icon: <Brain className="w-5 h-5 text-purple-500" />
    });
  }

  return insights.slice(0, 5); // Max 5 uvida
}

export function SmartReminders({
  homework,
  preferredStudyTime = "afternoon",
  className,
}: SmartRemindersProps) {
  const [expanded, setExpanded] = useState(false);
  
  const insights = useMemo(() => generateInsights(homework), [homework]);
  const recommendation = useMemo(() => 
    getStudyRecommendation(homework, preferredStudyTime), 
    [homework, preferredStudyTime]
  );

  const totalEstimatedTime = useMemo(() => {
    return homework
      .filter(h => h.status !== "DONE" && h.status !== "SUBMITTED")
      .reduce((sum, h) => sum + estimateTaskTime(h), 0);
  }, [homework]);

  const urgentCount = insights.filter(i => i.type === "urgent").length;
  const warningCount = insights.filter(i => i.type === "warning").length;

  const getInsightColor = (type: SmartInsight["type"]) => {
    switch (type) {
      case "urgent": return "bg-red-50 border-red-200";
      case "warning": return "bg-amber-50 border-amber-200";
      case "tip": return "bg-blue-50 border-blue-200";
      case "achievement": return "bg-green-50 border-green-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn(
        "pb-3",
        urgentCount > 0 
          ? "bg-gradient-to-r from-red-500 to-orange-500" 
          : warningCount > 0
            ? "bg-gradient-to-r from-amber-500 to-orange-500"
            : "bg-gradient-to-r from-blue-500 to-cyan-500"
      )}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Pametni Podsjetnici
              </CardTitle>
              <p className="text-xs text-white/80 mt-0.5">
                {urgentCount > 0 
                  ? `${urgentCount} hitnih zadataka!` 
                  : recommendation}
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>~{Math.round(totalEstimatedTime / 60)}h {totalEstimatedTime % 60}min</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {(expanded ? insights : insights.slice(0, 3)).map((insight, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border transition-all",
              getInsightColor(insight.type),
              "hover:shadow-sm"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {insight.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-800">
                {insight.title}
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                {insight.description}
              </p>
            </div>
            {insight.homeworkId && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="shrink-0 h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        {insights.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-500"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Prikaži manje" : `Još ${insights.length - 3} podsjetnika`}
          </Button>
        )}

        {/* Quick Action */}
        {urgentCount > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <Button 
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Počni sa hitnim zadacima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
