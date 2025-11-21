// Ocene & Analytics - Ultra-Modern Dashboard
"use client";

import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  Download,
  Filter,
  Loader,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Calculator,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/features/page-header";
import {
  FilterGradesModal,
  type GradeFilters,
} from "@/components/modals/filter-grades-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { staggerContainer, staggerItem } from "@/lib/animations/variants";
import { useGrades } from "@/hooks/use-grades";
import { useOfflineGrades } from "@/hooks/use-offline-grades";
import { useSyncStore } from "@/store";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

// Lazy load charts - reducira initial bundle za ~200KB
const GradeDistributionChart = dynamic(
  () =>
    import("@/components/features/charts/grade-charts").then(
      (mod) => mod.GradeDistributionChart,
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false,
  },
);

const SubjectRadarChart = dynamic(
  () =>
    import("@/components/features/charts/grade-charts").then(
      (mod) => mod.SubjectRadarChart,
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false,
  },
);

export default function OcenePage() {
  const [page, _setPage] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<GradeFilters>({});
  const [showSimulator, setShowSimulator] = useState(false);

  // Offline support
  const { offlineGrades, cacheGrades, hasOfflineGrades } = useOfflineGrades();
  const { isOnline } = useSyncStore();

  // React Query hook - automatic caching and refetching
  const {
    data: gradesData,
    isLoading: loading,
    error: queryError,
  } = useGrades({
    page,
    limit: 50,
    sortBy: "date",
    order: "desc",
    ...(filters.subjectId !== undefined && { subjectId: filters.subjectId }),
    ...(filters.category !== undefined && { category: filters.category }),
    ...(filters.period !== undefined && { period: filters.period }),
  });

  // Cache grades when loaded online
  useEffect(() => {
    if (gradesData?.data && Array.isArray(gradesData.data)) {
      cacheGrades(gradesData.data);
    }
  }, [gradesData, cacheGrades]);

  // Determine which grades to use
  const grades = useMemo(() => {
    if (isOnline && gradesData?.data) {
      return gradesData.data;
    }
    if (!isOnline && hasOfflineGrades) {
      // Map offline grades to match API structure if needed, or use as is if compatible
      return offlineGrades.map(g => ({
        ...g,
        subject: {
          id: g.subjectId,
          name: g.subjectName,
          color: g.subjectColor
        }
      }));
    }
    return Array.isArray(gradesData?.data) ? gradesData.data : [];
  }, [isOnline, gradesData, offlineGrades, hasOfflineGrades]);

  // Show error toast if query fails and no offline data
  if (queryError && !hasOfflineGrades) {
    toast.error("Greška pri učitavanju ocena", {
      description: queryError.message,
    });
  }

  const stats = gradesData?.stats || null;

  // Types
  type GradeBySubject = {
    subject: string;
    color: string;
    grades: number[];
    icon: string;
    average?: number;
    trend?: string;
    lastGrade?: number;
    totalGrades?: number;
  };


  // Organizuj grade po subjektu za prikaz
  const gradesBySubject = grades.reduce(
    (acc: Record<string, GradeBySubject>, grade: any) => {
      const subjectName = grade.subject?.name || "Unknown";
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          color: grade.subject?.color || "#3b82f6",
          grades: [],
          icon: "📚",
        };
      }
      acc[subjectName].grades.push(parseInt(grade.grade, 10));
      return acc;
    },
    {},
  );

  // Konvertuj u niz i kalkuliši proseke
  const subjectGrades = Object.values(gradesBySubject).map(
    (sg) => {
      const avg =
        sg.grades.reduce((a: number, b: number) => a + b, 0) / sg.grades.length;
      const firstGrade = sg.grades[0];
      const lastGrade = sg.grades[sg.grades.length - 1];
      const trend =
        sg.grades.length > 1 && firstGrade !== undefined && lastGrade !== undefined
          ? firstGrade > lastGrade
            ? "up"
            : firstGrade < lastGrade
              ? "down"
              : "stable"
          : "stable";

      return {
        ...sg,
        average: Math.round(avg * 100) / 100,
        trend,
        lastGrade: firstGrade,
        totalGrades: sg.grades.length,
      };
    },
  );

  // Calculate Insights
  const insights = subjectGrades.map(sg => {
    const currentAvg = sg.average || 0;
    if (currentAvg >= 5 || currentAvg === 0) return null;
    
    const nextWhole = Math.floor(currentAvg) + 1;
    const targetAvg = nextWhole - 0.5; 
    
    if (currentAvg >= targetAvg) return null;

    const sum = sg.grades.reduce((a: number, b: number) => a + b, 0);
    const count = sg.grades.length;
    
    const needed = Math.ceil((targetAvg * count - sum) / (5 - targetAvg));
    
    if (needed <= 0 || needed > 20) return null; 

    return {
      subject: sg.subject,
      currentAvg,
      suggestion: `Treba ti još ${needed} petic${needed === 1 ? 'a' : 'e'} za ${nextWhole}!`
    };
  }).filter(Boolean).slice(0, 3);

  // Prepare chart data
  const distributionData = [5, 4, 3, 2, 1].map(grade => ({
    name: grade.toString(),
    count: grades.filter((g: any) => parseInt(g.grade) === grade).length
  }));

  const radarData = subjectGrades.map(sg => ({
    subject: sg.subject,
    average: sg.average || 0,
    fullMark: 5
  }));

  if (loading && !hasOfflineGrades) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="📊 Ocene"
          description="Analiza i praćenje tvojih rezultata"
          variant="purple"
        />
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="📊 Ocene"
        description={
          isOnline
            ? "Analiza i praćenje tvojih rezultata"
            : "Offline režim - prikazujem sačuvane ocene"
        }
        variant="purple"
        action={
          <div className="flex gap-2 items-center">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  Offline
                </>
              )}
            </div>
          </div>
        }
      />

      {/* Filter & Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Filter section - always show some info here */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="text-sm text-gray-500">
              {grades.length} ocena{grades.length !== 1 ? 'i' : ''} prikazano
            </div>
            <div className="hidden sm:block h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                leftIcon={<Filter className="h-5 w-5" />}
                onClick={() => setShowFilterModal(true)}
              >
                Filter
              </Button>
              <Button
                variant="outline"
                leftIcon={<Calculator className="h-5 w-5" />}
                onClick={() => setShowSimulator(!showSimulator)}
              >
                Simulator
              </Button>
              <Button
                leftIcon={<Download className="h-5 w-5" />}
                onClick={async () => {
                  if (stats) {
                    const fullStats = {
                      ...stats,
                      bySubject: subjectGrades.map(sg => ({
                        subject: sg.subject,
                        average: sg.average || 0,
                        count: sg.totalGrades
                      }))
                    };
                    const { exportGradesToPDF } = await import("@/lib/utils/pdf-export");
                    exportGradesToPDF(grades as any, fullStats);
                  } else {
                    toast.error("Nema podataka za izvoz");
                  }
                }}
              >
                PDF Izveštaj
              </Button>
            </div>
          </div>

          {/* Mobile filter button */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              leftIcon={<Filter className="h-5 w-5" />}
              onClick={() => setShowFilterModal(true)}
            >
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Simulator / Insights Section */}
      {showSimulator && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-bold text-indigo-900">Pametni Saveti</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {insights.map((insight, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur border-indigo-100">
                <CardContent className="p-4">
                  <h4 className="font-bold text-gray-900 mb-1">{insight?.subject}</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Trenutno:</span>
                    <span className="font-bold text-indigo-600">{insight?.currentAvg}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-snug font-medium">{insight?.suggestion}</p>
                </CardContent>
              </Card>
            ))}
            {insights.length === 0 && (
              <div className="col-span-3 text-center py-4 text-gray-500 italic">
                Nema posebnih saveta trenutno. Odlično ti ide! 🌟
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Key Stats */}
      {stats && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Overall Average */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 mb-1 font-medium">Opšti prosek</p>
                    <p className="text-4xl font-bold text-white">
                      {stats.average.toFixed(2)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Star className="h-6 w-6 text-white" fill="currentColor" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={(stats.average / 5) * 100} className="h-2 bg-blue-800/30" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Grades */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1 font-medium">Ukupne ocene</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex gap-1">
                   {/* Mini histogram visual */}
                   {[5,4,3,2,1].map(g => {
                     const count = grades.filter((x: any) => parseInt(x.grade) === g).length;
                     const height = Math.max(4, Math.min(24, count * 2));
                     return (
                       <div key={g} className="flex-1 flex flex-col items-center gap-1">
                         <div className="w-full bg-gray-100 rounded-t-sm relative group">
                           <div 
                            className={`w-full rounded-t-sm ${
                              g===5 ? 'bg-green-500' : g===4 ? 'bg-blue-500' : g===3 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ height: `${height}px` }} 
                           />
                         </div>
                         <span className="text-[10px] text-gray-400">{g}</span>
                       </div>
                     )
                   })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Best Subject */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1 font-medium">
                      Najbolji predmet
                    </p>
                    <p className="text-xl font-bold text-purple-600 truncate max-w-[140px]">
                      {subjectGrades.length > 0 && subjectGrades[0] !== undefined
                        ? subjectGrades
                            .reduce(
                              (max, s) => ((s.average ?? 0) > (max.average ?? 0) ? s : max),
                              subjectGrades[0],
                            )
                            .subject
                        : "N/A"}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full inline-block">
                  Top rezultat! 🏆
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Categories Count */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1 font-medium">Kategorije</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {Object.keys(stats.byCategory).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  Raznovrsnost ocena
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Distribucija ocena</CardTitle>
            <CardDescription>Pregled broja ocena po vrednosti</CardDescription>
          </CardHeader>
          <CardContent>
            <GradeDistributionChart data={distributionData} />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Pregled po predmetima</CardTitle>
            <CardDescription>Prosečna ocena po predmetu</CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectRadarChart data={radarData} />
          </CardContent>
        </Card>
      </div>

      {/* Subject Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {subjectGrades.map((sg) => {
          // Calculate goal progress
          const currentAvg = sg.average || 0;
          const nextGrade = Math.floor(currentAvg) + 1;
          const progressToNext = Math.max(0, Math.min(100, ((currentAvg - Math.floor(currentAvg)) * 100)));
          
          return (
            <motion.div key={sg.subject} variants={staggerItem}>
              <Card
                className="border-0 hover:shadow-xl transition-all h-full group overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: sg.color }} />
                
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gray-50 group-hover:bg-gray-100 transition-colors">
                        {sg.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {sg.subject}
                        </h3>
                        <p className="text-xs text-gray-500">{sg.totalGrades} ocena</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      sg.trend === 'up' ? 'bg-green-100 text-green-700' : 
                      sg.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sg.trend === "up" && <TrendingUp className="h-3 w-3" />}
                      {sg.trend === "down" && <TrendingDown className="h-3 w-3" />}
                      {sg.trend === "stable" && <span className="text-lg leading-3">−</span>}
                      <span className="capitalize">{sg.trend === 'stable' ? 'Stabilno' : sg.trend === 'up' ? 'Raste' : 'Pada'}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Prosek</p>
                      <p className="text-4xl font-bold text-gray-900 tracking-tight">
                        {sg.average || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Zadnja</p>
                      <span className={`text-xl font-bold ${
                        (sg.lastGrade || 0) >= 4 ? 'text-green-600' : (sg.lastGrade || 0) >= 3 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {sg.lastGrade || 0}
                      </span>
                    </div>
                  </div>

                  {/* Goal Progress */}
                  {currentAvg < 5 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Do ocene {nextGrade}</span>
                        <span>{Math.round(progressToNext)}%</span>
                      </div>
                      <Progress value={progressToNext} className="h-1.5" />
                    </div>
                  )}

                  {/* Grade bars */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Istorija ocena</span>
                      <span>Novije &rarr;</span>
                    </div>
                    <div className="flex gap-1 h-8 items-end">
                      {sg.grades.slice(-8).map((g: number, i: number) => (
                        <div
                          key={`${sg.subject}-grade-${i}`}
                          className="flex-1 rounded-sm flex items-center justify-center text-[10px] font-bold text-white transition-all hover:opacity-100 hover:scale-110"
                          style={{
                            backgroundColor: sg.color,
                            opacity: 0.6 + (g / 5) * 0.4,
                            height: `${(g / 5) * 100}%`,
                            minHeight: '20%'
                          }}
                          title={`Ocena: ${g}`}
                        >
                          {g}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Grades List */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle>Sve ocene</CardTitle>
            <Button variant="ghost" size="sm" className="text-gray-500">
              Vidi sve <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {grades.slice(0, 10).map((grade: any) => (
              <div
                key={grade.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                    style={{ backgroundColor: grade.subject.color }}
                  >
                    {grade.grade}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {grade.subject.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        {grade.category}
                      </Badge>
                      <span>•</span>
                      <span>{new Date(grade.date).toLocaleDateString("sr-RS")}</span>
                    </div>
                  </div>
                </div>
                
                {grade.description && (
                  <p className="text-sm text-gray-400 italic hidden sm:block max-w-[200px] truncate">
                    "{grade.description}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Modal */}
      <FilterGradesModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        currentFilters={filters}
      />
    </div>
  );
}
