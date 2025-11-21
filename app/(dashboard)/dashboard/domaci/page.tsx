// Domaći zadaci stranica - lista svih zadataka
"use client";

import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  Loader,
  Plus,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
  Play,
  MoreVertical,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HomeworkCelebration } from "@/components/features/homework-celebration";
import { PageHeader } from "@/components/features/page-header";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Lazy load heavy components (Camera uses MediaStream API)
const ModernCamera = lazy(() => 
  import("@/components/features/modern-camera").then((mod) => ({ 
    default: mod.ModernCamera 
  }))
);
import {
  AddHomeworkModal,
  type HomeworkFormData,
} from "@/components/modals/add-homework-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSyncStore } from "@/store";
import { useCreateHomework, useMarkHomeworkComplete } from "@/hooks/use-homework";
import { useHomeworkList } from "@/hooks/use-homework-list";

export default function DomaciPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "done">(
    "all",
  );
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(
    null,
  );
  const [showCelebration, setShowCelebration] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);

  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

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
  } = useHomeworkList(page, searchQuery, filterStatus);
  
  const createHomeworkMutation = useCreateHomework();
  const markCompleteMutation = useMarkHomeworkComplete();
  const { isOnline, isSyncing } = useSyncStore();

  // Group homework for Kanban
  const kanbanColumns = {
    todo: filteredHomework.filter(h => h.status === "ASSIGNED" || h.status === "IN_PROGRESS"),
    done: filteredHomework.filter(h => h.status === "DONE" || h.status === "SUBMITTED")
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
      case "submitted":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Urađeno
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Radim
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
            <FileText className="h-3 w-3 mr-1" />
            Novo
          </Badge>
        );
    }
  };

  const getDaysUntil = (date: Date) => {
    const diff = Math.ceil(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (diff < 0) return "Rok prošao";
    if (diff === 0) return "Danas";
    if (diff === 1) return "Sutra";
    return `Za ${diff} dana`;
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

      const response = await fetch(
        `/api/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast.success("📸 Fotografija je uspešno sačuvana!", {
        description: "Prilog je dodat domaćem zadatku.",
      });

      setCameraOpen(false);
      setSelectedHomeworkId(null);
    } catch {
      // Error uploading photo
      toast.error("Greška prilikom čuvanja fotografije");
    }
  };

  const handleMarkComplete = (hwId: string) => {
    markCompleteMutation.mutate(hwId, {
      onSuccess: () => {
        setShowCelebration(true);
        toast.success("✅ Zadatak je označen kao urađen!");
      },
      onError: () => {
        toast.error("Greška pri ažuriranju zadatka");
      }
    });
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
      createHomeworkMutation.mutate({
        ...data,
        dueDate: new Date(data.dueDate),
        status: "ASSIGNED",
      }, {
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
        }
      });

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
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <Input
                type="text"
                placeholder="Pretraži zadatke..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                className="bg-white border-gray-200 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0">
              <div className="flex bg-gray-100/80 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-md transition-all text-sm font-medium flex items-center gap-2",
                    viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <MoreVertical className="h-4 w-4 rotate-90" />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={cn(
                    "p-2 rounded-md transition-all text-sm font-medium flex items-center gap-2",
                    viewMode === "kanban" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-current rounded-full" />
                    <div className="w-1 h-3 bg-current rounded-full" />
                  </div>
                  Tabla
                </button>
              </div>

              <div className="h-6 w-px bg-gray-200 mx-1" />

              <div className="flex gap-1">
                <Button
                  variant={filterStatus === "all" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                  className={filterStatus === "all" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
                >
                  Sve
                </Button>
                <Button
                  variant={filterStatus === "active" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus("active")}
                  className={filterStatus === "active" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
                >
                  Aktivni
                </Button>
                <Button
                  variant={filterStatus === "done" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus("done")}
                  className={filterStatus === "done" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}
                >
                  Urađeni
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats - Compact */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-blue-700">
            {filteredHomework.filter(h => h.status !== "done" && h.status !== "submitted").length}
          </span>
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wider mt-1">Aktivni</span>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-green-700">
            {filteredHomework.filter(h => h.status === "done" || h.status === "submitted").length}
          </span>
          <span className="text-xs font-medium text-green-600 uppercase tracking-wider mt-1">Urađeni</span>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-red-700">
            {filteredHomework.filter(h => h.priority === "urgent" && h.status !== "done").length}
          </span>
          <span className="text-xs font-medium text-red-600 uppercase tracking-wider mt-1">Hitni</span>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "kanban" ? (
        <div className="grid md:grid-cols-2 gap-6 h-full min-h-[500px]">
          {/* To Do Column */}
          <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Za uraditi
                <Badge variant="secondary" className="ml-2 bg-white">{kanbanColumns.todo.length}</Badge>
              </h3>
            </div>
            <div className="space-y-3">
              {kanbanColumns.todo.map(task => (
                <HomeworkCard 
                  key={task.id} 
                  task={task} 
                  compact 
                  onComplete={() => handleMarkComplete(task.id)}
                  onCamera={() => handleOpenCamera(task.id)}
                />
              ))}
              {kanbanColumns.todo.length === 0 && (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  <p>Nema aktivnih zadataka 🎉</p>
                </div>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Završeno
                <Badge variant="secondary" className="ml-2 bg-white">{kanbanColumns.done.length}</Badge>
              </h3>
            </div>
            <div className="space-y-3">
              {kanbanColumns.done.map(task => (
                <HomeworkCard 
                  key={task.id} 
                  task={task} 
                  compact 
                  isDone
                  onComplete={() => {}}
                  onCamera={() => handleOpenCamera(task.id)}
                />
              ))}
              {kanbanColumns.done.length === 0 && (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  <p>Još ništa nije završeno</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {error && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-600">{error instanceof Error ? error.message : "Došlo je do greške"}</p>
              </CardContent>
            </Card>
          )}
          
          {filteredHomework.length === 0 ? (
            <Card className="border-dashed border-2 bg-gray-50/50">
              <CardContent className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Search className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Nema zadataka</h3>
                <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                  {searchQuery ? "Nismo našli ništa za tvoju pretragu." : "Trenutno nemaš domaćih zadataka. Uživaj u slobodnom vremenu! 🎉"}
                </p>
                <Button 
                  className="mt-6"
                  onClick={() => setShowAddModal(true)}
                >
                  Dodaj novi zadatak
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredHomework.map((task) => (
              <HomeworkCard 
                key={task.id} 
                task={task} 
                onComplete={() => handleMarkComplete(task.id)}
                onCamera={() => handleOpenCamera(task.id)}
              />
            ))
          )}
        </div>
      )}

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
            Sljedeća
          </Button>
        </div>
      )}

      {/* Camera Modal - Lazy Loaded */}
      {cameraOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <Loader className="h-8 w-8 animate-spin text-white" />
          </div>
        }>
          <ModernCamera
            onClose={() => {
              setCameraOpen(false);
              setSelectedHomeworkId(null);
            }}
            onCapture={handlePhotoCapture}
          />
        </Suspense>
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
    </div>
  );
}

function HomeworkCard({ 
  task, 
  compact = false, 
  isDone = false,
  onComplete, 
  onCamera 
}: { 
  task: any, 
  compact?: boolean, 
  isDone?: boolean,
  onComplete: () => void, 
  onCamera: () => void 
}) {
  const router = useRouter();
  const isOverdue =
    task.dueDate < new Date() &&
    task.status !== "done" &&
    task.status !== "submitted";
  
  const isUrgent = task.priority === "urgent";

  const getDaysUntil = (date: Date) => {
    const diff = Math.ceil(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (diff < 0) return "Rok prošao";
    if (diff === 0) return "Danas";
    if (diff === 1) return "Sutra";
    return `Za ${diff} dana`;
  };

  if (compact) {
    return (
      <Card className={cn(
        "group relative overflow-hidden transition-all hover:shadow-md border-l-4",
        isDone ? "border-l-green-500 opacity-75 hover:opacity-100" :
        isOverdue ? "border-l-red-500 bg-red-50/30" : 
        isUrgent ? "border-l-red-500" : "border-l-blue-500"
      )}>
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="text-[10px] px-1.5 h-5" style={{ 
              backgroundColor: task.color ? `${task.color}20` : '#eff6ff',
              color: task.color || '#1d4ed8',
              borderColor: task.color ? `${task.color}40` : '#dbeafe'
            }}>
              {task.subject || "Predmet"}
            </Badge>
            {!isDone && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-gray-400">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onCamera}>
                    <Camera className="h-3 w-3 mr-2" />
                    Prilog
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onComplete}>
                    <CheckCircle2 className="h-3 w-3 mr-2" />
                    Završi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <h4 className={cn("font-bold text-sm mb-1 line-clamp-2", isDone && "line-through text-gray-500")}>
            {task.title}
          </h4>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span className={cn("flex items-center gap-1", isOverdue && !isDone && "text-red-600 font-bold")}>
              <CalendarIcon className="h-3 w-3" />
              {getDaysUntil(task.dueDate)}
            </span>
            {task.attachments > 0 && (
              <span className="flex items-center gap-1">
                <Camera className="h-3 w-3" />
                {task.attachments}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md group relative overflow-hidden border-l-4",
        isOverdue ? "border-l-red-500 bg-red-50/10" : 
        isUrgent ? "border-l-red-500" : 
        task.priority === "medium" ? "border-l-amber-500" : "border-l-blue-500"
      )}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4 flex-1">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: task.color || "#3b82f6" }}
            >
              <span className="text-lg font-bold">
                {(task.subject || "P").charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {task.title}
                    </h3>
                    {task.isOffline && !task.synced && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    {task.subject || "Predmet"}
                    <span className="text-gray-300">•</span>
                    <span className={cn("flex items-center gap-1", isOverdue ? "text-red-600 font-bold" : "")}>
                      <CalendarIcon className="h-3 w-3" />
                      {getDaysUntil(task.dueDate)}
                    </span>
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onCamera}>
                      <Camera className="h-4 w-4 mr-2" />
                      Dodaj prilog
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (task.subjectId) {
                        router.push(`/dashboard/fokus?subjectId=${task.subjectId}`);
                      } else {
                        toast.error("Predmet nije definisan za ovaj zadatak");
                      }
                    }}>
                      <Play className="h-4 w-4 mr-2" />
                      Pokreni tajmer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {task.description && (
                <div className="mt-2 mb-3 text-sm text-gray-600 bg-gray-50/50 p-2 rounded-md border border-gray-100">
                  <p className="line-clamp-2">{task.description}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3">
                {/* Status Badge Logic duplicated for component isolation */}
                {(() => {
                  switch (task.status) {
                    case "done":
                    case "submitted":
                      return <Badge variant="secondary" className="bg-green-100 text-green-700">Urađeno</Badge>;
                    case "in_progress":
                      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Radim</Badge>;
                    default:
                      return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Novo</Badge>;
                  }
                })()}

                {task.priority === "urgent" && (
                  <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Hitno
                  </Badge>
                )}

                {task.attachments > 0 && (
                  <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                    <Camera className="h-3 w-3 mr-1" />
                    {task.attachments}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-2 mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
            {task.status !== "done" && task.status !== "submitted" ? (
              <>
                <Button
                  size="sm"
                  className="flex-1 sm:w-32 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
                  onClick={onComplete}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Završi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:w-32"
                  onClick={onCamera}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Uslikaj
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[80px] w-full sm:w-32 bg-green-50 rounded-lg border border-green-100">
                <span className="text-2xl">🎉</span>
                <span className="text-xs font-bold text-green-700 mt-1">Bravo!</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
