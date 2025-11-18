"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert as AlertComponent, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
} from "lucide-react";

// Types
type Period = "week" | "month" | "semester" | "year";

interface GradeTrendData {
  date: string;
  grade: number;
  subject: string;
  category: string;
}

interface MovingAverage {
  date: string;
  ma7: number;
  ma30: number;
}

interface SubjectTrend {
  subjectId: string;
  subjectName: string;
  currentAverage: number;
  previousAverage: number;
  trend: "up" | "down" | "stable";
  percentageChange: number;
  grades: GradeTrendData[];
}

interface CategoryPerformance {
  category: string;
  count: number;
  average: number;
  trend: "up" | "down" | "stable";
}

interface GradeDistribution {
  grade: number;
  count: number;
  percentage: number;
}

interface Alert {
  type: "declining" | "improvement" | "below-threshold" | "high-performer";
  severity: "low" | "medium" | "high";
  message: string;
  subjectId?: string;
  subjectName?: string;
  data?: any;
}

interface Prediction {
  subjectId: string;
  subjectName: string;
  predictedGrade: number;
  confidence: number;
  trend: "up" | "down" | "stable";
}

interface GradeAnalytics {
  period: {
    type: Period;
    startDate: string;
    endDate: string;
  };
  overview: {
    totalGrades: number;
    averageGrade: number;
    highestGrade: number;
    lowestGrade: number;
    trend: "up" | "down" | "stable";
    trendPercentage: number;
  };
  timeline: GradeTrendData[];
  movingAverages: MovingAverage[];
  subjectTrends: SubjectTrend[];
  categoryPerformance: CategoryPerformance[];
  distribution: GradeDistribution[];
  predictions: Prediction[];
  alerts: Alert[];
}

interface GradeAnalyticsProps {
  studentId: string;
}

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  secondary: "#8b5cf6",
};

const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

export default function GradeAnalytics({ studentId }: GradeAnalyticsProps) {
  const [analytics, setAnalytics] = useState<GradeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("semester");

  useEffect(() => {
    fetchAnalytics();
  }, [studentId, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/analytics/grades?studentId=${studentId}&period=${period}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching grade analytics:", err);
      setError("Greška pri učitavanju analitike");
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up")
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "down")
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getAlertIcon = (severity: "low" | "medium" | "high") => {
    if (severity === "high")
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (severity === "medium")
      return <Info className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  };

  const getAlertVariant = (
    type: Alert["type"]
  ): "default" | "destructive" => {
    if (type === "declining" || type === "below-threshold")
      return "destructive";
    return "default";
  };

  const handleExportPDF = async () => {
    if (!analytics) return;

    try {
      const { generateGradeAnalyticsPDF } = await import(
        "@/lib/reports/grade-pdf-export"
      );
      const blob = await generateGradeAnalyticsPDF(
        `Učenik ${studentId}`,
        analytics
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ocene-analitika-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-4">
        <AlertComponent variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Greška</AlertTitle>
          <AlertDescription>
            {error || "Nije moguće učitati analitiku"}
          </AlertDescription>
        </AlertComponent>
      </div>
    );
  }

  const { overview, timeline, movingAverages, subjectTrends, categoryPerformance, distribution, predictions, alerts } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analitika Ocena</h2>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(analytics.period.startDate), "dd. MMM yyyy", {
              locale: sr,
            })}{" "}
            -{" "}
            {format(parseISO(analytics.period.endDate), "dd. MMM yyyy", {
              locale: sr,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Nedelja</SelectItem>
              <SelectItem value="month">Mesec</SelectItem>
              <SelectItem value="semester">Semestar</SelectItem>
              <SelectItem value="year">Godina</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportPDF} variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <AlertComponent
              key={index}
              variant={getAlertVariant(alert.type)}
            >
              <div className="flex items-start gap-2">
                {getAlertIcon(alert.severity)}
                <div className="flex-1">
                  <AlertDescription>{alert.message}</AlertDescription>
                </div>
              </div>
            </AlertComponent>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prosek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {overview.averageGrade.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {overview.totalGrades} ocena
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getTrendIcon(overview.trend)}
                <span
                  className={`text-xs font-medium ${
                    overview.trend === "up"
                      ? "text-green-500"
                      : overview.trend === "down"
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {overview.trendPercentage > 0 ? "+" : ""}
                  {overview.trendPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Raspon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{overview.highestGrade}</div>
                <div className="text-xs text-muted-foreground">Najviša</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{overview.lowestGrade}</div>
                <div className="text-xs text-muted-foreground">Najniža</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Predmeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectTrends.length}</div>
            <div className="text-xs text-muted-foreground">
              {subjectTrends.filter((s) => s.trend === "up").length} poboljšanje
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Predikcije
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictions.length}</div>
            <div className="text-xs text-muted-foreground">
              Prosečna pouzdanost:{" "}
              {predictions.length
                ? (
                    predictions.reduce((sum, p) => sum + p.confidence, 0) /
                    predictions.length
                  ).toFixed(0)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Trendovi</TabsTrigger>
          <TabsTrigger value="subjects">Predmeti</TabsTrigger>
          <TabsTrigger value="distribution">Distribucija</TabsTrigger>
          <TabsTrigger value="categories">Kategorije</TabsTrigger>
          <TabsTrigger value="predictions">Predikcije</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trendovi Ocena</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      format(parseISO(value), "dd.MM", { locale: sr })
                    }
                  />
                  <YAxis domain={[1, 5]} />
                  <Tooltip
                    labelFormatter={(value) =>
                      format(parseISO(value as string), "dd. MMM yyyy", {
                        locale: sr,
                      })
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke={COLORS.primary}
                    name="Ocena"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pokretni Proseci</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={movingAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      format(parseISO(value), "dd.MM", { locale: sr })
                    }
                  />
                  <YAxis domain={[1, 5]} />
                  <Tooltip
                    labelFormatter={(value) =>
                      format(parseISO(value as string), "dd. MMM yyyy", {
                        locale: sr,
                      })
                    }
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ma7"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                    name="7-dnevni prosek"
                  />
                  <Area
                    type="monotone"
                    dataKey="ma30"
                    stroke={COLORS.secondary}
                    fill={COLORS.secondary}
                    fillOpacity={0.3}
                    name="30-dnevni prosek"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectTrends.map((subject) => (
              <Card key={subject.subjectId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {subject.subjectName}
                    </CardTitle>
                    {getTrendIcon(subject.trend)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Trenutni prosek:
                    </span>
                    <span className="text-lg font-bold">
                      {subject.currentAverage.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Prethodni prosek:
                    </span>
                    <span className="text-sm">
                      {subject.previousAverage.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Promena:
                    </span>
                    <Badge
                      variant={
                        subject.trend === "up"
                          ? "default"
                          : subject.trend === "down"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {subject.percentageChange > 0 ? "+" : ""}
                      {subject.percentageChange.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="pt-4">
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={subject.grades}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) =>
                            format(parseISO(value), "dd.MM", { locale: sr })
                          }
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          labelFormatter={(value) =>
                            format(parseISO(value as string), "dd. MMM yyyy", {
                              locale: sr,
                            })
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="grade"
                          stroke={COLORS.primary}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribucija Ocena</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={COLORS.primary} name="Broj ocena">
                      {distribution.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Procentualna Distribucija</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribution.filter((d) => d.count > 0) as any}
                      dataKey="percentage"
                      nameKey="grade"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry: any) => `${entry.grade}: ${entry.percentage}%`}
                    >
                      {distribution.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Statistika</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {distribution.map((item) => (
                  <div key={item.grade} className="text-center">
                    <div className="text-3xl font-bold">{item.count}</div>
                    <div className="text-sm text-muted-foreground">
                      Ocena {item.grade}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performanse po Kategorijama</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill={COLORS.primary} name="Prosek">
                    {categoryPerformance.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryPerformance.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {category.category}
                    </CardTitle>
                    {getTrendIcon(category.trend)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Prosek:
                    </span>
                    <span className="text-lg font-bold">
                      {category.average.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Broj:</span>
                    <span className="text-sm">{category.count}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predikcije Budućih Ocena</CardTitle>
              <p className="text-sm text-muted-foreground">
                Predikcije zasnovane na linearnoj regresiji postojećih ocena
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nedovoljno podataka za predikcije
                  </p>
                ) : (
                  predictions.map((prediction) => (
                    <div
                      key={prediction.subjectId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {prediction.subjectName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          {getTrendIcon(prediction.trend)}
                          <span>
                            Pouzdanost: {prediction.confidence.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {prediction.predictedGrade.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Predikcija
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {predictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Vizualizacija Predikcija</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subjectName" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="predictedGrade"
                      fill={COLORS.secondary}
                      name="Predviđena ocena"
                    >
                      {predictions.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
