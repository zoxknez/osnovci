// Domaći zadaci stranica - lista svih zadataka
"use client";

import { Loader, Plus, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";
import {
  bulkCompleteHomeworkAction,
  bulkDeleteHomeworkAction,
  bulkUpdateDueDateAction,
  bulkUpdatePriorityAction,
} from "@/app/actions/tasks";
import {
  showErrorToast,
  showSuccessToast,
} from "@/components/features/error-toast";
import { HomeworkBulkActions } from "@/components/features/homework/homework-bulk-actions";
import {
  HomeworkBulkSelection,
  HomeworkItemCheckbox,
} from "@/components/features/homework/homework-bulk-selection";
import { HomeworkCard } from "@/components/features/homework/homework-card";
import { HomeworkEmptyState } from "@/components/features/homework/homework-empty-state";
import { HomeworkFilters } from "@/components/features/homework/homework-filters";
import { HomeworkKanbanView } from "@/components/features/homework/homework-kanban-view";
import { HomeworkStats } from "@/components/features/homework/homework-stats";
import { HomeworkCelebration } from "@/components/features/homework-celebration";
import { LoadingWithRetry } from "@/components/features/loading-states";
import { PageHeader } from "@/components/features/page-header";
import { SectionErrorBoundary } from "@/components/features/section-error-boundary";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { exportHomeworkToPDF } from "@/lib/utils/homework-export";

// Lazy load heavy components (Camera uses MediaStream API)
const ModernCamera = lazy(() =>
  import("@/components/features/modern-camera").then((mod) => ({
    default: mod.ModernCamera,
  })),
);

import { useQueryClient } from "@tanstack/react-query";
import {
  AddHomeworkModal,
  type HomeworkFormData,
} from "@/components/modals/add-homework-modal";
import {
  homeworkKeys,
  useCreateHomework,
  useMarkHomeworkComplete,
} from "@/hooks/use-homework";
import { useHomeworkList } from "@/hooks/use-homework-list";
import { useSyncStore } from "@/store";

export default function DomaciPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "done">(
    "all",
  );

  // Debounce search query za bolje performanse
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(
    null,
  );
  const [showCelebration, setShowCelebration] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);

  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Unified Homework Hook
  const {
    data: filteredHomework,
    pagination,
    isLoading,
    error,
    saveOffline,
    syncOfflineItems,
    hasOfflineItems,
    unsyncedCount,
  } = useHomeworkList(page, debouncedSearchQuery, filterStatus);

  const queryClient = useQueryClient();
  const createHomeworkMutation = useCreateHomework();
  const markCompleteMutation = useMarkHomeworkComplete();
  const { isOnline, isSyncing } = useSyncStore();

  // Group homework for Kanban
  const kanbanColumns = {
    todo: filteredHomework.filter(
      (h) => h.status === "assigned" || h.status === "in_progress",
    ),
    done: filteredHomework.filter(
      (h) => h.status === "done" || h.status === "submitted",
    ),
  };

  const handleOpenCamera = (homeworkId: string) => {
    setSelectedHomeworkId(homeworkId);
    setCameraOpen(true);
  };

  const handlePhotoCapture = async (file: File) => {
    try {
      if (!selectedHomeworkId) {
        toast.error("Greška - Nije odabran zadatak");
        return;
      }

      // Upload to API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("homeworkId", selectedHomeworkId);

      const response = await fetch(`/api/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      showSuccessToast(
        "📸 Fotografija je uspešno sačuvana!",
        "Prilog je dodat domaćem zadatku.",
      );

      setCameraOpen(false);
      setSelectedHomeworkId(null);
    } catch {
      // Error uploading photo
      showErrorToast({
        error: new Error("Greška prilikom čuvanja fotografije"),
        retry: () => handlePhotoCapture(file),
      });
    }
  };

  const handleMarkComplete = (hwId: string) => {
    markCompleteMutation.mutate(hwId, {
      onSuccess: () => {
        setShowCelebration(true);
        showSuccessToast("✅ Zadatak je označen kao urađen!");
      },
      onError: () => {
        showErrorToast({
          error: new Error("Greška pri ažuriranju zadatka"),
          retry: () => handleMarkComplete(hwId),
        });
      },
    });
  };

  const handleBulkComplete = async (ids: string[]) => {
    try {
      await bulkCompleteHomeworkAction(ids);
      // Invalidate cache umesto reload
      await queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      setSelectedIds([]);
    } catch (error) {
      throw error;
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await bulkDeleteHomeworkAction(ids);
      // Invalidate cache umesto reload
      await queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      setSelectedIds([]);
    } catch (error) {
      throw error;
    }
  };

  const handleBulkUpdatePriority = async (
    ids: string[],
    priority: "NORMAL" | "IMPORTANT" | "URGENT",
  ) => {
    try {
      await bulkUpdatePriorityAction(ids, priority);
      // Invalidate cache umesto reload
      await queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      setSelectedIds([]);
    } catch (error) {
      throw error;
    }
  };

  const handleBulkUpdateDueDate = async (ids: string[], date: Date) => {
    try {
      await bulkUpdateDueDateAction(ids, date);
      // Invalidate cache umesto reload
      await queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      setSelectedIds([]);
    } catch (error) {
      throw error;
    }
  };

  const handleBulkExport = async (ids: string[]) => {
    const selectedHomework = filteredHomework.filter((h) => ids.includes(h.id));
    exportHomeworkToPDF(selectedHomework);
  };

  const handleAddHomework = async (data: HomeworkFormData) => {
    try {
      // Ako nema interneta, sačuvaj offline
      if (!isOnline) {
        await saveOffline({
          title: data.title,
          subjectId: data.subjectId,
          description: data.description,
          dueDate: new Date(data.dueDate),
          priority: data.priority,
          status: "ASSIGNED",
        });
        toast.success("💾 Sačuvano offline", {
          description:
            "Zadatak će biti sinhronizovan kada se povežeš na internet",
        });
        return;
      }

      // Pokušaj online
      createHomeworkMutation.mutate(
        {
          ...data,
          dueDate: new Date(data.dueDate),
          status: "ASSIGNED",
        },
        {
          onSuccess: () => {
            // Reset page to 1 to see new item
            setPage(1);
          },
          onError: async () => {
            // Ako API ne uspije, sačuvaj offline kao fallback
            await saveOffline({
              title: data.title,
              subjectId: data.subjectId,
              description: data.description,
              dueDate: new Date(data.dueDate),
              priority: data.priority,
              status: "ASSIGNED",
            });
            toast.warning("⚠️ Sačuvano offline", {
              description:
                "API nije dostupan - zadatak će biti sinhronizovan kasnije",
            });
          },
        },
      );
    } catch (_err) {
      throw new Error(
        _err instanceof Error ? _err.message : "Nepoznata greška",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="📚 Domaći zadaci"
          description="Upravljaj svojim zadacima i rokovima"
          variant="blue"
        />
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const total = pagination?.total || 0;
  const activeCount = filteredHomework.filter(
    (h) => h.status !== "done" && h.status !== "submitted",
  ).length;
  const completedCount = filteredHomework.filter(
    (h) => h.status === "done" || h.status === "submitted",
  ).length;
  const urgentCount = filteredHomework.filter(
    (h) => h.priority === "urgent" && h.status !== "done",
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Header */}
      <PageHeader
        title="📚 Domaći zadaci"
        description={
          isOnline
            ? "Upravljaj svojim zadacima i rokovima"
            : "Offline režim - promene će biti sinhronizovane"
        }
        variant="blue"
        action={
          <div className="flex gap-2 items-center flex-wrap">
            {/* Online/Offline status */}
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

            {/* Sync button */}
            {hasOfflineItems && isOnline && (
              <Button
                variant="outline"
                size="lg"
                leftIcon={
                  <RefreshCw
                    className={`h-5 w-5 ${isSyncing ? "animate-spin" : ""}`}
                  />
                }
                onClick={syncOfflineItems}
                disabled={isSyncing}
              >
                Sinhronizuj ({unsyncedCount})
              </Button>
            )}

            {/* Add task button */}
            <Button
              size="lg"
              leftIcon={<Plus className="h-5 w-5" />}
              aria-label="Dodaj novi domaći zadatak"
              onClick={() => setShowAddModal(true)}
            >
              Dodaj zadatak
            </Button>
          </div>
        }
      />

      {/* Filters & View Toggle */}
      <SectionErrorBoundary sectionName="Homework Filters">
        <div className="space-y-4">
          <HomeworkFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          {viewMode === "list" && filteredHomework.length > 0 && (
            <HomeworkBulkSelection
              items={filteredHomework}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}
        </div>
      </SectionErrorBoundary>

      {/* Stats - Compact */}
      <SectionErrorBoundary sectionName="Homework Stats">
        <HomeworkStats
          active={activeCount}
          completed={completedCount}
          urgent={urgentCount}
        />
      </SectionErrorBoundary>

      {/* Content Area */}
      <SectionErrorBoundary sectionName="Homework List">
        {viewMode === "kanban" ? (
          <HomeworkKanbanView
            todo={kanbanColumns.todo}
            done={kanbanColumns.done}
            onComplete={handleMarkComplete}
            onCamera={handleOpenCamera}
          />
        ) : (
          <div className="space-y-4">
            {error && (
              <LoadingWithRetry
                error={
                  error instanceof Error ? error : new Error(String(error))
                }
                onRetry={() => window.location.reload()}
              />
            )}

            {filteredHomework.length === 0 ? (
              <HomeworkEmptyState
                searchQuery={searchQuery}
                onAddClick={() => setShowAddModal(true)}
              />
            ) : (
              <div className="space-y-4">
                {filteredHomework.map((task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <div className="pt-5">
                      <HomeworkItemCheckbox
                        id={task.id}
                        checked={selectedIds.includes(task.id)}
                        onToggle={(id) => {
                          if (selectedIds.includes(id)) {
                            setSelectedIds(
                              selectedIds.filter((sid) => sid !== id),
                            );
                          } else {
                            setSelectedIds([...selectedIds, id]);
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <HomeworkCard
                        task={task}
                        onComplete={() => handleMarkComplete(task.id)}
                        onCamera={() => handleOpenCamera(task.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionErrorBoundary>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prethodna
          </Button>
          <span className="flex items-center px-4">
            Stranica {page} od {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
          >
            Sledeća
          </Button>
        </div>
      )}

      {/* Camera Modal - Lazy Loaded with Error Boundary */}
      {cameraOpen && (
        <SectionErrorBoundary sectionName="Camera">
          <Suspense
            fallback={
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                <Loader className="h-8 w-8 animate-spin text-white" />
              </div>
            }
          >
            <ModernCamera
              onClose={() => {
                setCameraOpen(false);
                setSelectedHomeworkId(null);
              }}
              onCapture={handlePhotoCapture}
            />
          </Suspense>
        </SectionErrorBoundary>
      )}

      {/* Celebration Animation */}
      <HomeworkCelebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        message="🎉 Odličan posao!"
      />

      {/* Modal */}
      <AddHomeworkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddHomework}
      />

      {/* Bulk Actions */}
      <HomeworkBulkActions
        selectedIds={selectedIds}
        onComplete={handleBulkComplete}
        onDelete={handleBulkDelete}
        onUpdatePriority={handleBulkUpdatePriority}
        onUpdateDueDate={handleBulkUpdateDueDate}
        onExport={handleBulkExport}
        onClearSelection={() => setSelectedIds([])}
      />
    </div>
  );
}
