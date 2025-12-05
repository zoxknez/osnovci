// Ocene & Analytics - Ultra-Modern Dashboard
"use client";

import { motion } from "framer-motion";
import { Loader, Wifi, WifiOff } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { GradesFiltersBar } from "@/components/features/grades/grades-filters-bar";
import { GradesInsights } from "@/components/features/grades/grades-insights";
import { GradesList } from "@/components/features/grades/grades-list";
import { GradesStatsCards } from "@/components/features/grades/grades-stats-cards";
import { SubjectGradeCard } from "@/components/features/grades/subject-grade-card";
import { PageHeader } from "@/components/features/page-header";
import { SectionErrorBoundary } from "@/components/features/section-error-boundary";
import {
  FilterGradesModal,
  type GradeFilters,
} from "@/components/modals/filter-grades-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGrades } from "@/hooks/use-grades";
import { useOfflineGrades } from "@/hooks/use-offline-grades";
import { staggerContainer } from "@/lib/animations/variants";
import {
  calculateInsights,
  calculateSubjectStats,
  getBestSubject,
  organizeGradesBySubject,
} from "@/lib/utils/grades-calculations";
import { useSyncStore } from "@/store";

// Grade type matching API schema
type GradeValue = "1" | "2" | "3" | "4" | "5";
type GradeCategory =
  | "CLASSWORK"
  | "HOMEWORK"
  | "TEST"
  | "QUIZ"
  | "PARTICIPATION"
  | "PROJECT"
  | "EXAM"
  | "OTHER";

interface GradeItem {
  id: string;
  grade: GradeValue;
  subject: {
    id: string;
    name: string;
    color?: string;
  };
  category: GradeCategory;
  description?: string;
  date: Date | string;
  weight: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<GradeFilters>({});
  const [showSimulator, setShowSimulator] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Offline support
  const { offlineGrades, cacheGrades, hasOfflineGrades } = useOfflineGrades();
  const { isOnline } = useSyncStore();

  // React Query hook - automatic caching and refetching
  const {
    data: gradesData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useGrades({
    page: 1,
    limit: 50,
    sortBy: "date",
    order: "desc",
    ...(filters.subjectId !== undefined && { subjectId: filters.subjectId }),
    ...(filters.category !== undefined && { category: filters.category }),
    ...(filters.period !== undefined && { period: filters.period }),
  });

  // Cache grades when loaded online
  // Cache grades when loaded online
  useEffect(() => {
    if (gradesData?.data && Array.isArray(gradesData.data)) {
      // API data is compatible with GradeInput at runtime
      cacheGrades(
        gradesData.data as unknown as Parameters<typeof cacheGrades>[0],
      );
    }
  }, [gradesData, cacheGrades]);

  // Determine which grades to use
  const grades = useMemo((): GradeItem[] => {
    if (isOnline && gradesData?.data) {
      return gradesData.data as unknown as GradeItem[];
    }
    if (!isOnline && hasOfflineGrades) {
      // Map offline grades to match API structure
      return offlineGrades.map((g) => {
        const item: GradeItem = {
          id: g.id,
          grade: String(g.grade) as GradeValue,
          category: (g.category || "OTHER") as GradeCategory,
          date: g.date,
          weight: 1,
          createdAt: g.createdAt,
          updatedAt: g.createdAt,
          subject: {
            id: g.subjectId,
            name: g.subjectName,
            color: g.subjectColor,
          },
        };
        if (g.description) {
          item.description = g.description;
        }
        return item;
      });
    }
    return Array.isArray(gradesData?.data)
      ? (gradesData.data as unknown as GradeItem[])
      : [];
  }, [isOnline, gradesData, offlineGrades, hasOfflineGrades]);

  // Show error toast if query fails and no offline data
  const errorShownRef = useRef(false);
  useEffect(() => {
    if (queryError && !hasOfflineGrades && !errorShownRef.current) {
      errorShownRef.current = true;
      toast.error("Greška pri učitavanju ocena", {
        action: {
          label: "Pokušaj ponovo",
          onClick: () => refetch(),
        },
      });
    }
    if (!queryError) {
      errorShownRef.current = false;
    }
  }, [queryError, hasOfflineGrades, refetch]);

  const stats = gradesData?.stats || null;

  // Calculate grades statistics using utility functions
  const gradesBySubject = useMemo(
    () => organizeGradesBySubject(grades),
    [grades],
  );
  const subjectGrades = useMemo(
    () => calculateSubjectStats(gradesBySubject),
    [gradesBySubject],
  );
  const insights = useMemo(
    () => calculateInsights(subjectGrades),
    [subjectGrades],
  );
  const bestSubject = useMemo(
    () => getBestSubject(subjectGrades),
    [subjectGrades],
  );

  // Prepare chart data
  const distributionData = [5, 4, 3, 2, 1].map((gradeValue) => ({
    name: gradeValue.toString(),
    count: grades.filter((g) => parseInt(String(g.grade), 10) === gradeValue)
      .length,
  }));

  const radarData = subjectGrades.map((sg) => ({
    subject: sg.subject,
    average: sg.average || 0,
    fullMark: 5,
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
            <output
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
              aria-live="polite"
              aria-label={isOnline ? "Povezan na internet" : "Offline režim"}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" aria-hidden="true" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" aria-hidden="true" />
                  <span>Offline</span>
                </>
              )}
            </output>
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
          isExportingPDF={isExportingPDF}
          onExportClick={async () => {
            if (isExportingPDF) return;

            if (!stats) {
              toast.error("Nema podataka za izvoz");
              return;
            }

            setIsExportingPDF(true);
            try {
              const fullStats = {
                ...stats,
                bySubject: subjectGrades.map((sg) => ({
                  subject: sg.subject,
                  average: sg.average || 0,
                  count: sg.totalGrades ?? 0,
                })),
              };
              // Map grades to PDF export format
              const pdfGrades = grades.map((g) => ({
                subject: {
                  name: g.subject.name,
                  color: g.subject.color || "#3b82f6",
                },
                grade: String(g.grade),
                category: g.category,
                description: g.description || null,
                date: g.date,
              }));
              const { exportGradesToPDF } = await import(
                "@/lib/utils/pdf-export"
              );
              exportGradesToPDF(pdfGrades, fullStats);
              toast.success("PDF uspešno generisan!");
            } catch (err) {
              console.error("PDF export error:", err);
              toast.error("Greška pri generisanju PDF-a");
            } finally {
              setIsExportingPDF(false);
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
            initial="initial"
            animate="animate"
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
        <SectionErrorBoundary sectionName="Distribution Chart">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Distribucija ocena</CardTitle>
              <CardDescription>
                Pregled broja ocena po vrednosti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GradeDistributionChart data={distributionData} />
            </CardContent>
          </Card>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Radar Chart">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Pregled po predmetima</CardTitle>
              <CardDescription>Prosečna ocena po predmetu</CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectRadarChart data={radarData} />
            </CardContent>
          </Card>
        </SectionErrorBoundary>
      </div>

      {/* Subject Cards */}
      <SectionErrorBoundary sectionName="Subject Grades">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
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
