/**
 * Comparative Analytics Component for Parents
 * Uporedna analitika za roditelje
 * Compare student progress against class/school averages
 */

"use client";

import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SubjectStats {
  subjectId: string;
  subjectName: string;
  studentAverage: number;
  classAverage: number;
  schoolAverage?: number;
  trend: "up" | "down" | "stable";
  percentile: number; // Student's percentile in class
}

interface ActivityStats {
  weeklyHours: number;
  classAverageHours: number;
  homeworkCompletionRate: number;
  classCompletionRate: number;
  streakDays: number;
  classAverageStreak: number;
}

interface StudentData {
  id: string;
  name: string;
  grade: string;
  overallAverage: number;
  classRank: number;
  totalStudents: number;
  subjectStats: SubjectStats[];
  activityStats: ActivityStats;
  xpProgress: {
    current: number;
    weeklyEarned: number;
    classAverageWeekly: number;
  };
}

interface ComparativeAnalyticsProps {
  studentData: StudentData;
  period?: "week" | "month" | "semester";
}

export function ComparativeAnalytics({
  studentData,
  period = "month",
}: ComparativeAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [comparisonType, setComparisonType] = useState<"class" | "school">(
    "class",
  );

  // Calculate insights
  const insights = useMemo(() => {
    const aboveAverage = studentData.subjectStats.filter(
      (s) => s.studentAverage > s.classAverage,
    );
    const belowAverage = studentData.subjectStats.filter(
      (s) => s.studentAverage < s.classAverage,
    );
    const improving = studentData.subjectStats.filter((s) => s.trend === "up");
    const declining = studentData.subjectStats.filter(
      (s) => s.trend === "down",
    );

    return {
      aboveAverageCount: aboveAverage.length,
      belowAverageCount: belowAverage.length,
      improvingCount: improving.length,
      decliningCount: declining.length,
      topSubject: studentData.subjectStats.reduce((prev, curr) =>
        curr.studentAverage > prev.studentAverage ? curr : prev,
      ),
      needsAttention: belowAverage.sort(
        (a, b) =>
          a.studentAverage -
          a.classAverage -
          (b.studentAverage - b.classAverage),
      )[0],
    };
  }, [studentData]);

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up")
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "down")
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Uporedna Analitika
          </h2>
          <p className="text-muted-foreground">
            Napredak učenika {studentData.name} u poređenju sa razredom
          </p>
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedPeriod}
            onValueChange={(v: "week" | "month" | "semester") =>
              setSelectedPeriod(v)
            }
          >
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Nedelja</SelectItem>
              <SelectItem value="month">Mesec</SelectItem>
              <SelectItem value="semester">Polugodište</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={comparisonType}
            onValueChange={(v: "class" | "school") => setComparisonType(v)}
          >
            <SelectTrigger className="w-[140px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="class">Razred</SelectItem>
              <SelectItem value="school">Škola</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rang u razredu</p>
                <p className="text-3xl font-bold">
                  {studentData.classRank}/{studentData.totalStudents}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Top{" "}
              {Math.round(
                (studentData.classRank / studentData.totalStudents) * 100,
              )}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opšti prosek</p>
                <p className="text-3xl font-bold">
                  {studentData.overallAverage.toFixed(2)}
                </p>
              </div>
              <Badge
                variant={
                  studentData.overallAverage >= 4.5 ? "default" : "secondary"
                }
                className="text-lg"
              >
                {studentData.overallAverage >= 4.5
                  ? "Odličan"
                  : studentData.overallAverage >= 3.5
                    ? "Vrlo dobar"
                    : studentData.overallAverage >= 2.5
                      ? "Dobar"
                      : "Dovoljan"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Iznad proseka</p>
                <p className="text-3xl font-bold text-green-500">
                  {insights.aboveAverageCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ispod proseka</p>
                <p className="text-3xl font-bold text-red-500">
                  {insights.belowAverageCount}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">predmeta</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trend</p>
                <p className="text-3xl font-bold text-green-500">
                  ↑{insights.improvingCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">&nbsp;</p>
                <p className="text-3xl font-bold text-red-500">
                  ↓{insights.decliningCount}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">predmeta</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">Po predmetima</TabsTrigger>
          <TabsTrigger value="activity">Aktivnost</TabsTrigger>
          <TabsTrigger value="xp">XP & Dostignuća</TabsTrigger>
        </TabsList>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="grid gap-4">
            {studentData.subjectStats.map((subject) => {
              const diff = subject.studentAverage - subject.classAverage;
              const isAbove = diff > 0;

              return (
                <motion.div
                  key={subject.subjectId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{subject.subjectName}</p>
                            <div className="flex items-center gap-2">
                              <TrendIcon trend={subject.trend} />
                              <span className="text-sm text-muted-foreground">
                                {subject.trend === "up"
                                  ? "Poboljšanje"
                                  : subject.trend === "down"
                                    ? "Pad"
                                    : "Stabilno"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {subject.studentAverage.toFixed(2)}
                          </p>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isAbove ? "text-green-500" : "text-red-500",
                            )}
                          >
                            {isAbove ? "+" : ""}
                            {diff.toFixed(2)} vs prosek
                          </p>
                        </div>
                      </div>

                      {/* Comparison Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Učenik</span>
                          <span>{subject.studentAverage.toFixed(2)}</span>
                        </div>
                        <Progress
                          value={(subject.studentAverage / 5) * 100}
                          className="h-2"
                        />

                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Prosek razreda</span>
                          <span>{subject.classAverage.toFixed(2)}</span>
                        </div>
                        <Progress
                          value={(subject.classAverage / 5) * 100}
                          className="h-2 opacity-50"
                        />

                        <div className="flex justify-between items-center mt-2">
                          <Badge variant="secondary">
                            Percentil: {subject.percentile}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Bolji od {subject.percentile}% učenika
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Vreme učenja
                </CardTitle>
                <CardDescription>
                  Nedeljno vreme provedeno u učenju
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Učenik</span>
                      <span className="font-bold">
                        {studentData.activityStats.weeklyHours}h
                      </span>
                    </div>
                    <Progress
                      value={
                        (studentData.activityStats.weeklyHours /
                          Math.max(studentData.activityStats.weeklyHours, 20)) *
                        100
                      }
                      className="h-3"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-muted-foreground">
                      <span>Prosek razreda</span>
                      <span>
                        {studentData.activityStats.classAverageHours}h
                      </span>
                    </div>
                    <Progress
                      value={
                        (studentData.activityStats.classAverageHours /
                          Math.max(studentData.activityStats.weeklyHours, 20)) *
                        100
                      }
                      className="h-3 opacity-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Završenost domaćih
                </CardTitle>
                <CardDescription>
                  Stopa završetka domaćih zadataka
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold">
                        {studentData.activityStats.homeworkCompletionRate}%
                      </p>
                      <p className="text-sm text-muted-foreground">Učenik</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-muted-foreground">
                        {studentData.activityStats.classCompletionRate}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Prosek razreda
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      studentData.activityStats.homeworkCompletionRate >=
                      studentData.activityStats.classCompletionRate
                        ? "default"
                        : "secondary"
                    }
                  >
                    {studentData.activityStats.homeworkCompletionRate >=
                    studentData.activityStats.classCompletionRate
                      ? "Iznad proseka ✓"
                      : "Ispod proseka"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Niz aktivnosti</CardTitle>
                <CardDescription>Uzastopni dani sa aktivnošću</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">
                      {studentData.activityStats.streakDays}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      dana zaredom
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Prosek razreda</span>
                      <span>
                        {studentData.activityStats.classAverageStreak} dana
                      </span>
                    </div>
                    <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-primary/20 rounded-full"
                        style={{
                          width: `${
                            (studentData.activityStats.classAverageStreak /
                              Math.max(
                                studentData.activityStats.streakDays,
                                30,
                              )) *
                            100
                          }%`,
                        }}
                      />
                      <div
                        className="absolute h-full bg-primary rounded-full"
                        style={{
                          width: `${
                            (studentData.activityStats.streakDays /
                              Math.max(
                                studentData.activityStats.streakDays,
                                30,
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* XP Tab */}
        <TabsContent value="xp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>XP Napredak</CardTitle>
              <CardDescription>Poređenje zarađenih XP poena</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-4xl font-bold text-primary">
                    {studentData.xpProgress.current.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Ukupno XP</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-4xl font-bold text-green-500">
                    +{studentData.xpProgress.weeklyEarned}
                  </p>
                  <p className="text-sm text-muted-foreground">Ove nedelje</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-4xl font-bold text-muted-foreground">
                    +{studentData.xpProgress.classAverageWeekly}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Prosek razreda
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Poređenje sa prosekom razreda
                </p>
                <div className="flex items-center gap-4">
                  <Progress
                    value={
                      (studentData.xpProgress.weeklyEarned /
                        Math.max(
                          studentData.xpProgress.weeklyEarned,
                          studentData.xpProgress.classAverageWeekly,
                        )) *
                      100
                    }
                    className="flex-1"
                  />
                  <Badge
                    variant={
                      studentData.xpProgress.weeklyEarned >=
                      studentData.xpProgress.classAverageWeekly
                        ? "default"
                        : "secondary"
                    }
                  >
                    {studentData.xpProgress.weeklyEarned >=
                    studentData.xpProgress.classAverageWeekly
                      ? `+${studentData.xpProgress.weeklyEarned - studentData.xpProgress.classAverageWeekly} XP`
                      : `${studentData.xpProgress.weeklyEarned - studentData.xpProgress.classAverageWeekly} XP`}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      {insights.needsAttention && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Target className="h-5 w-5" />
              Preporuka za poboljšanje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>{insights.needsAttention.subjectName}</strong> je predmet
              gde bi dodatna pažnja mogla pomoći. Trenutni prosek je{" "}
              <strong>
                {insights.needsAttention.studentAverage.toFixed(2)}
              </strong>
              , dok je prosek razreda{" "}
              <strong>{insights.needsAttention.classAverage.toFixed(2)}</strong>
              .
            </p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm">
                AI Tutor za {insights.needsAttention.subjectName}
              </Button>
              <Button variant="outline" size="sm">
                Vežbanja
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ComparativeAnalytics;
