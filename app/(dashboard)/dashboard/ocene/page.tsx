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
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { log } from "@/lib/logger";
import { toast } from "sonner";
import { PageHeader } from "@/components/features/page-header";
import {
  FilterGradesModal,
  type GradeFilters,
} from "@/components/modals/filter-grades-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { staggerContainer, staggerItem } from "@/lib/animations/variants";
import { useGrades } from "@/lib/hooks/use-react-query";
import { exportGradesToPDF } from "@/lib/utils/pdf-export";

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

  // Show error toast if query fails
  if (queryError) {
    toast.error("Greška pri učitavanju ocjena", {
      description: queryError.message,
    });
  }

  const grades = Array.isArray(gradesData?.data) ? gradesData.data : [];
  const stats = gradesData?.stats || null;
  const error = queryError ? queryError.message : null;

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

  // Konvertuj u niz i kalkuliši prosjeke
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

  // Pripremi podatke za grafike
  const chartData = subjectGrades.map((sg) => ({
    name: sg.subject.substring(0, 8),
    average: sg.average || 0,
  }));

  const radarData = subjectGrades.map((sg) => ({
    name: sg.subject.substring(0, 6),
    value: sg.average || 0,
  }));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="📊 Ocjene"
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
        title="📊 Ocjene"
        description="Analiza i praćenje tvojih rezultata"
        variant="purple"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<Filter className="h-5 w-5" />}
              onClick={() => setShowFilterModal(true)}
            >
              Filter
            </Button>
            <Button
              leftIcon={<Download className="h-5 w-5" />}
              onClick={() => {
                try {
                  if (grades.length === 0) {
                    toast.error("Nema ocena za izvoz");
                    return;
                  }

                  // Transform grades to expected format for PDF export
                  const gradesForPDF = grades.map((g: any) => ({
                    subject: g.subject,
                    grade: g.grade,
                    category: g.category,
                    description: g.description,
                    date: g.date,
                  }));

                  const fileName = exportGradesToPDF(
                    gradesForPDF,
                    stats as any, // stats is already checked for null above via disabled prop
                    "Učenik", // Student name could be retrieved from profile API if needed
                  );

                  toast.success("📥 PDF Izvoz", {
                    description: `${fileName} je preuzet`,
                    duration: 3000,
                  });
                } catch (error) {
                  log.error("PDF export failed", error);
                  toast.error("Greška pri kreiranju PDF-a");
                }
              }}
              disabled={grades.length === 0 || !stats}
            >
              Izvoz PDF
            </Button>
          </div>
        }
      />

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
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Opšti prosjek</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.average.toFixed(2)}
                    </p>
                  </div>
                  <Star className="h-12 w-12 text-yellow-400 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Grades */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ukupne ocjene</p>
                    <p className="text-3xl font-bold text-green-700">
                      {stats.total}
                    </p>
                  </div>
                  <Award className="h-12 w-12 text-green-400 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Best Subject */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Najbolji predmet
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {subjectGrades.length > 0 && subjectGrades[0] !== undefined
                        ? subjectGrades
                            .reduce(
                              (max, s) => ((s.average ?? 0) > (max.average ?? 0) ? s : max),
                              subjectGrades[0],
                            )
                            .subject.substring(0, 10)
                        : "N/A"}
                    </p>
                  </div>
                  <Target className="h-12 w-12 text-purple-400 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Categories Count */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Kategorije</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {Object.keys(stats.byCategory).length}
                    </p>
                  </div>
                  <Calendar className="h-12 w-12 text-orange-400 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-6 lg:grid-cols-2"
      >
        {/* Bar Chart */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Prosjeci po predmetu</CardTitle>
            </CardHeader>
            <CardContent>
              <GradeDistributionChart
                data={chartData.map((item: any) => ({
                  name: item.name,
                  count: item.average,
                }))}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Radar analiza</CardTitle>
            </CardHeader>
            <CardContent>
              <SubjectRadarChart
                data={radarData.map((item: any) => ({
                  subject: item.name,
                  average: item.value,
                }))}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Subject Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {subjectGrades.map((sg) => (
          <motion.div key={sg.subject} variants={staggerItem}>
            <Card
              className="border-0 hover:shadow-lg transition-all h-full"
              style={{
                borderTop: `4px solid ${sg.color}`,
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sg.icon}</span>
                    <h3 className="font-semibold text-gray-900">
                      {sg.subject}
                    </h3>
                  </div>
                  {sg.trend === "up" && (
                    <TrendingUp className="h-5 w-5 text-green-700" />
                  )}
                  {sg.trend === "down" && (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Prosjek</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sg.average || 0}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Zadnja ocjena</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {sg.lastGrade || 0}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Broj ocjena</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {sg.totalGrades || 0}
                    </p>
                  </div>
                </div>

                {/* Grade bars */}
                <div className="mt-4 flex gap-1">
                  {sg.grades.slice(0, 5).map((g: number, i: number) => (
                    <div
                      key={`${sg.subject}-grade-${i}`}
                      className="flex-1 h-6 rounded-md flex items-center justify-center text-xs font-semibold text-white"
                      style={{
                        backgroundColor: sg.color,
                        opacity: 0.4 + (g / 5) * 0.6,
                      }}
                    >
                      {g}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Grades List */}
      <Card>
        <CardHeader>
          <CardTitle>Sve ocjene</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {grades.slice(0, 10).map((grade: any) => (
              <div
                key={grade.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: grade.subject.color }}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {grade.subject.name}
                    </p>
                    <p className="text-sm text-gray-600">{grade.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xl font-bold"
                    style={{ color: grade.subject.color }}
                  >
                    {grade.grade}
                  </span>
                  <p className="text-sm text-gray-600">
                    {new Date(grade.date).toLocaleDateString("sr-RS")}
                  </p>
                </div>
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
