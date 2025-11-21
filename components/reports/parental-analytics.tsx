/**
 * Parental Analytics Dashboard
 * Comprehensive analytics view for guardians
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Clock,
  Award,
  Download,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { getParentalAnalyticsAction } from "@/app/actions/analytics";

interface AnalyticsData {
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
  homework: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
    dailyCompletion: Array<{
      date: string;
      completed: number;
      assigned: number;
      rate: number;
    }>;
    avgCompletionTime: number;
    withAttachments: number;
  };
  grades: {
    count: number;
    average: number;
    highest: number;
    lowest: number;
    trend: "improving" | "declining" | "stable";
    bySubject: Array<{
      subjectId: string;
      subjectName: string;
      count: number;
      average: number;
    }>;
    byType: Array<{
      type: string;
      count: number;
      average: number;
    }>;
    timeline: Array<{
      date: string;
      grade: number;
      subject: string;
      type: string;
    }>;
  };
  timeSpent: {
    totalMinutes: number;
    totalHours: number;
    sessions: number;
    avgSessionMinutes: number;
    dailyBreakdown: Array<{
      date: string;
      minutes: number;
      hours: number;
    }>;
  };
  subjectPerformance: Array<{
    subjectId: string;
    subjectName: string;
    gradeAverage: number | null;
    gradeCount: number;
    homeworkCompletionRate: number | null;
    homeworkTotal: number;
  }>;
  weeklyComparison: {
    currentWeek: {
      homeworkTotal: number;
      homeworkCompleted: number;
      gradeAverage: number;
      gradeCount: number;
    };
    previousWeek: {
      homeworkTotal: number;
      homeworkCompleted: number;
      gradeAverage: number;
      gradeCount: number;
    };
    changes: {
      homework: number;
      grade: number;
    };
  };
  achievements: {
    total: number;
    totalPoints: number;
    recent: Array<{
      id: string;
      name: string;
      description: string;
      points: number;
      unlockedAt: string;
    }>;
  };
  generatedAt: string;
}

interface ParentalAnalyticsProps {
  studentId: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function ParentalAnalytics({ studentId }: ParentalAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    if (studentId) {
      fetchAnalytics();
    }
  }, [studentId, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getParentalAnalyticsAction(studentId, period);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setAnalytics(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!analytics) return;

    try {
      const { generateAnalyticsPDF } = await import("@/lib/reports/pdf-export");
      const blob = await generateAnalyticsPDF("Student", analytics);

      // Download PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analitika-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Greška pri generisanju PDF-a");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Učitavanje analitike...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Greška: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "declining":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analitika Učenika</h2>
          <p className="text-muted-foreground">
            Period: {format(new Date(analytics.period.startDate), "dd.MM.yyyy")} -{" "}
            {format(new Date(analytics.period.endDate), "dd.MM.yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as "week" | "month")}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Ova nedelja</SelectItem>
              <SelectItem value="month">Ovaj mesec</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Izvezi PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domaći Zadaci</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.homework.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.homework.completed} / {analytics.homework.total} završeno
            </p>
            {analytics.homework.overdue > 0 && (
              <p className="text-xs text-destructive mt-1">
                {analytics.homework.overdue} prekoračeno
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prosek Ocena</CardTitle>
            {getTrendIcon(analytics.grades.trend)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.grades.average > 0 ? analytics.grades.average.toFixed(2) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.grades.count} ocene ({analytics.grades.lowest} - {analytics.grades.highest})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vreme Učenja</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.timeSpent.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              {analytics.timeSpent.sessions} sesija (prosek {analytics.timeSpent.avgSessionMinutes} min)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dostignuća</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.achievements.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.achievements.totalPoints} poena
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="homework" className="space-y-4">
        <TabsList>
          <TabsTrigger value="homework">Domaći Zadaci</TabsTrigger>
          <TabsTrigger value="grades">Ocene</TabsTrigger>
          <TabsTrigger value="subjects">Predmeti</TabsTrigger>
          <TabsTrigger value="time">Vreme</TabsTrigger>
        </TabsList>

        {/* Homework Tab */}
        <TabsContent value="homework" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dnevna Stopa Završetka</CardTitle>
              <CardDescription>Praćenje završenih domaćih zadataka po danima</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.homework.dailyCompletion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "dd.MM")}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), "dd.MM.yyyy")}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#00C49F" name="Završeno" />
                  <Bar dataKey="assigned" fill="#0088FE" name="Dodeljeno" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Domaćih</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Završeno", value: analytics.homework.completed },
                        { name: "U toku", value: analytics.homework.pending },
                        { name: "Prekoračeno", value: analytics.homework.overdue },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistika</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ukupno:</span>
                  <span className="font-medium">{analytics.homework.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sa prilozima:</span>
                  <span className="font-medium">{analytics.homework.withAttachments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prosečno vreme:</span>
                  <span className="font-medium">{analytics.homework.avgCompletionTime}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stopa završetka:</span>
                  <span className="font-medium">{analytics.homework.completionRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trend Ocena</CardTitle>
              <CardDescription>Praćenje ocena tokom vremena</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.grades.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "dd.MM")}
                  />
                  <YAxis domain={[1, 5]} />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), "dd.MM.yyyy")}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Ocena"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ocene po Predmetu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.grades.bySubject.map((subject) => (
                    <div key={subject.subjectId} className="flex justify-between items-center">
                      <span className="text-sm">{subject.subjectName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">({subject.count})</span>
                        <span className="font-medium">{subject.average.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ocene po Tipu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.grades.byType.map((type) => (
                    <div key={type.type} className="flex justify-between items-center">
                      <span className="text-sm">{type.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">({type.count})</span>
                        <span className="font-medium">{type.average.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performanse po Predmetima</CardTitle>
              <CardDescription>Komparativni prikaz uspeha po predmetima</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.subjectPerformance.map((subject) => (
                  <div key={subject.subjectId} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{subject.subjectName}</h4>
                      {subject.gradeAverage !== null && (
                        <span className="text-lg font-bold">{subject.gradeAverage.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Ocene: </span>
                        <span>{subject.gradeCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Domaći: </span>
                        <span>{subject.homeworkTotal}</span>
                      </div>
                      {subject.homeworkCompletionRate !== null && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Stopa završetka: </span>
                          <span className="font-medium">{subject.homeworkCompletionRate}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tab */}
        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dnevno Vreme Učenja</CardTitle>
              <CardDescription>Praćenje vremena provedenog na platformi</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.timeSpent.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "dd.MM")}
                  />
                  <YAxis label={{ value: "Minuti", angle: -90, position: "insideLeft" }} />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), "dd.MM.yyyy")}
                  />
                  <Bar dataKey="minutes" fill="#8884d8" name="Minuti" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Weekly Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Nedeljno Poređenje</CardTitle>
          <CardDescription>Trenutna nedelja vs. prethodna nedelja</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Trenutna Nedelja</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domaći završeno:</span>
                  <span>
                    {analytics.weeklyComparison.currentWeek.homeworkCompleted} /{" "}
                    {analytics.weeklyComparison.currentWeek.homeworkTotal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prosek ocena:</span>
                  <span>{analytics.weeklyComparison.currentWeek.gradeAverage.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Prethodna Nedelja</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domaći završeno:</span>
                  <span>
                    {analytics.weeklyComparison.previousWeek.homeworkCompleted} /{" "}
                    {analytics.weeklyComparison.previousWeek.homeworkTotal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prosek ocena:</span>
                  <span>{analytics.weeklyComparison.previousWeek.gradeAverage.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Promene</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Domaći:</span>
                <span
                  className={
                    analytics.weeklyComparison.changes.homework > 0
                      ? "text-green-600"
                      : analytics.weeklyComparison.changes.homework < 0
                        ? "text-red-600"
                        : ""
                  }
                >
                  {analytics.weeklyComparison.changes.homework > 0 && "+"}
                  {analytics.weeklyComparison.changes.homework}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Ocene:</span>
                <span
                  className={
                    analytics.weeklyComparison.changes.grade > 0
                      ? "text-green-600"
                      : analytics.weeklyComparison.changes.grade < 0
                        ? "text-red-600"
                        : ""
                  }
                >
                  {analytics.weeklyComparison.changes.grade > 0 && "+"}
                  {analytics.weeklyComparison.changes.grade.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
