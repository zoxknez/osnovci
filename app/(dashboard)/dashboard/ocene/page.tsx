// Ocene & Analytics - Ultra-Modern Dashboard
"use client";

import { motion } from "framer-motion";
import { Loader, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { showErrorToast } from "@/components/features/error-toast";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/features/page-header";
import {
  FilterGradesModal,
  type GradeFilters,
} from "@/components/modals/filter-grades-modal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { staggerContainer } from "@/lib/animations/variants";
import { useGrades } from "@/hooks/use-grades";
import { useOfflineGrades } from "@/hooks/use-offline-grades";
import { useSyncStore } from "@/store";
import { GradesStatsCards } from "@/components/features/grades/grades-stats-cards";
import { GradesInsights } from "@/components/features/grades/grades-insights";
import { SubjectGradeCard } from "@/components/features/grades/subject-grade-card";
import { GradesList } from "@/components/features/grades/grades-list";
import { GradesFiltersBar } from "@/components/features/grades/grades-filters-bar";
import { SectionErrorBoundary } from "@/components/features/section-error-boundary";
import {
  organizeGradesBySubject,
  calculateSubjectStats,
  calculateInsights,
  getBestSubject,
} from "@/lib/utils/grades-calculations";

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
    showErrorToast({ 
      error: queryError,
      retry: () => window.location.reload(),
    });
  }

  const stats = gradesData?.stats || null;

  // Calculate grades statistics using utility functions
  const gradesBySubject = useMemo(() => organizeGradesBySubject(grades), [grades]);
  const subjectGrades = useMemo(() => calculateSubjectStats(gradesBySubject), [gradesBySubject]);
  const insights = useMemo(() => calculateInsights(subjectGrades), [subjectGrades]);
  const bestSubject = useMemo(() => getBestSubject(subjectGrades), [subjectGrades]);

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
      <SectionErrorBoundary sectionName="Grades Filters">
        <GradesFiltersBar
          gradesCount={grades.length}
          onFilterClick={() => setShowFilterModal(true)}
          onSimulatorToggle={() => setShowSimulator(!showSimulator)}
          showSimulator={showSimulator}
          onExportClick={async () => {
            if (stats) {
              const fullStats = {
                ...stats,
                bySubject: subjectGrades.map(sg => ({
                  subject: sg.subject,
                  average: sg.average || 0,
                  count: sg.totalGrades ?? 0
                }))
              };
              const { exportGradesToPDF } = await import("@/lib/utils/pdf-export");
              exportGradesToPDF(grades as any, fullStats);
            } else {
              showErrorToast({ 
                error: new Error("Nema podataka za izvoz"),
              });
            }
          }}
        />
      </SectionErrorBoundary>

      {/* Simulator / Insights Section */}
      {showSimulator && (
        <SectionErrorBoundary sectionName="Grades Insights">
          <GradesInsights insights={insights} />
        </SectionErrorBoundary>
      )}

      {/* Key Stats */}
      {stats && (
        <SectionErrorBoundary sectionName="Grades Stats">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <GradesStatsCards
              stats={stats}
              grades={grades}
              bestSubject={bestSubject}
            />
          </motion.div>
        </SectionErrorBoundary>
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
      <SectionErrorBoundary sectionName="Subject Grades">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {subjectGrades.map((sg) => (
            <SubjectGradeCard key={sg.subject} subjectGrade={sg} />
          ))}
        </motion.div>
      </SectionErrorBoundary>

      {/* Grades List */}
      <SectionErrorBoundary sectionName="Grades List">
        <GradesList grades={grades} limit={10} />
      </SectionErrorBoundary>

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
