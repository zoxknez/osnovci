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
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HomeworkCelebration } from "@/components/features/homework-celebration";
import { ModernCamera } from "@/components/features/modern-camera";
import { PageHeader } from "@/components/features/page-header";
import {
  AddHomeworkModal,
  type HomeworkFormData,
} from "@/components/modals/add-homework-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOfflineHomework } from "@/hooks/use-offline-homework";
import { useSyncStore } from "@/store";

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

  // API state
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Offline sync
  const {
    offlineItems,
    saveOffline,
    syncOfflineItems,
    hasOfflineItems,
    unsyncedCount,
  } = useOfflineHomework();
  const { isOnline, isSyncing } = useSyncStore();

  const getRandomColor = useCallback(() => {
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f59e0b"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Fetch homework na mount i kada se promijeni stranica
  useEffect(() => {
    const fetchHomework = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/homework?page=${page}&limit=20&sortBy=dueDate&order=asc`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Greška pri učitavanju domaćih zadataka");
        }

        const data = await response.json();

        // Mapiraj podatke sa API-ja na format koji frontend očekuje
        const homeworkData = Array.isArray(data.data) ? data.data : [];
        const mapped = homeworkData.map((hw: Record<string, unknown>) => ({
          id: hw["id"],
          subject:
            (hw["subject"] as Record<string, unknown> | undefined)?.["name"] || "Nepoznat predmet",
          title: hw["title"],
          description: hw["description"],
          dueDate: new Date(hw["dueDate"] as string),
          status: (hw["status"] as string).toLowerCase(),
          priority: (hw["priority"] as string).toLowerCase(),
          attachments: hw["attachmentsCount"],
          color:
            (hw["subject"] as Record<string, unknown> | undefined)?.["color"] || getRandomColor(),
        }));

        setHomework(mapped);
        setTotal(data.pagination?.total || 0);
        setError(null);
      } catch (_err) {
        const errorMessage =
          _err instanceof Error ? _err.message : "Nepoznata greška";
        setError(errorMessage);
        toast.error("Greška pri učitavanju", { description: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [page, getRandomColor]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            Urađeno
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            Radim
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
            <FileText className="h-3 w-3" />
            Novo
          </span>
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

  // Kombiniuj online i offline zadatke
  const allHomework = useMemo(() => {
    // Mapiraj offline items u isti format kao API data
    const offlineMapped = offlineItems.map((item) => ({
      id: item.id,
      subject: item.subjectId, // Subject ID is stored in offline storage
      title: item.title,
      description: item.description,
      dueDate: item.dueDate,
      status: item.status.toLowerCase(),
      priority: item.priority.toLowerCase(),
      attachments: 0,
      color: getRandomColor(),
      isOffline: true,
      synced: item.synced,
    }));

    return [...homework, ...offlineMapped];
  }, [homework, offlineItems, getRandomColor]);

  const filteredHomework = allHomework.filter((task) => {
    const subjectName =
      typeof task.subject === "string"
        ? task.subject
        : task.subject?.name || "";
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" &&
        task.status !== "done" &&
        task.status !== "submitted") ||
      (filterStatus === "done" &&
        (task.status === "done" || task.status === "submitted"));
    return matchesSearch && matchesFilter;
  });

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

      const response = await fetch(
        `/api/homework/${selectedHomeworkId}/attachments`,
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

  const handleMarkComplete = async (hwId: string) => {
    try {
      // Update homework status
      const hw = homework.find((h) => h.id === hwId);
      if (hw) {
        hw.status = "done";
        setHomework([...homework]);
      }

      // Show celebration animation
      setShowCelebration(true);

      toast.success("✅ Zadatak je označen kao urađen!");
    } catch (_err) {
      toast.error("Greška pri ažuriranju zadatka");
    }
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
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
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
        return;
      }

      // Osvježi listu
      setPage(1);

      const newResponse = await fetch(
        `/api/homework?page=1&limit=20&sortBy=dueDate&order=asc`,
        { credentials: "include" },
      );
      const newData = await newResponse.json();

      const mapped = newData.data.map((hw: any) => ({
        id: hw.id,
        subject: hw.subject.name,
        title: hw.title,
        description: hw.description,
        dueDate: new Date(hw.dueDate),
        status: hw.status.toLowerCase(),
        priority: hw.priority.toLowerCase(),
        attachments: hw.attachmentsCount,
        color: hw.subject.color || getRandomColor(),
      }));

      setHomework(mapped);
      setTotal(newData.pagination.total);

      toast.success("✅ Zadatak kreiran");
    } catch (_err) {
      throw new Error(
        _err instanceof Error ? _err.message : "Nepoznata greška",
      );
    }
  };

  if (loading) {
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

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Pretraži zadatke..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
                aria-label="Pretraži domaće zadatke po nazivu ili predmetu"
              />
            </div>
            <fieldset className="flex gap-2" aria-label="Filteri za zadatke">
              <legend className="sr-only">Filteri za zadatke</legend>
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
                aria-label="Prikaži sve zadatke"
                aria-pressed={filterStatus === "all"}
              >
                Sve
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
                aria-label="Prikaži samo aktivne zadatke"
                aria-pressed={filterStatus === "active"}
              >
                Aktivni
              </Button>
              <Button
                variant={filterStatus === "done" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("done")}
                aria-label="Prikaži samo završene zadatke"
                aria-pressed={filterStatus === "done"}
              >
                Urađeni
              </Button>
            </fieldset>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {
                  allHomework.filter(
                    (h) => h.status !== "done" && h.status !== "submitted",
                  ).length
                }
              </p>
              <p className="text-sm text-gray-600 mt-1">Aktivni zadaci</p>
              {unsyncedCount > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ({unsyncedCount} offline)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {
                  allHomework.filter(
                    (h) => h.status === "done" || h.status === "submitted",
                  ).length
                }
              </p>
              <p className="text-sm text-gray-600 mt-1">Urađeno</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {
                  allHomework.filter(
                    (h) =>
                      h.priority === "urgent" &&
                      h.status !== "done" &&
                      h.status !== "submitted",
                  ).length
                }
              </p>
              <p className="text-sm text-gray-600 mt-1">Hitno</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Homework List */}
      <div className="space-y-4">
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}
        {filteredHomework.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">
                Nema zadataka koji odgovaraju pretrazi
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredHomework.map((task) => {
            const isOverdue =
              task.dueDate < new Date() &&
              task.status !== "done" &&
              task.status !== "submitted";
            return (
              <Card
                key={task.id}
                className={`transition-all hover:shadow-lg ${
                  isOverdue ? "border-red-300 bg-red-50/30" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4 flex-1">
                      {/* Subject color indicator */}
                      <div
                        className="w-1 h-full rounded-full"
                        style={{ backgroundColor: task.color }}
                      />

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {task.title}
                              </h3>
                              {task.isOffline && !task.synced && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                  <WifiOff className="h-3 w-3" />
                                  Offline
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {typeof task.subject === "string"
                                ? task.subject
                                : task.subject?.name || "Predmet"}
                            </p>
                          </div>
                          {task.priority === "urgent" && !isOverdue && (
                            <span className="ml-2 text-red-600">
                              <AlertCircle className="h-5 w-5" />
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-700 mb-3">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3">
                          {getStatusBadge(task.status)}

                          <span
                            className={`text-xs font-medium ${
                              isOverdue ? "text-red-600" : "text-gray-600"
                            }`}
                          >
                            📅 {getDaysUntil(task.dueDate)}
                          </span>

                          {task.attachments > 0 && (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              {task.attachments}{" "}
                              {task.attachments === 1 ? "dokaz" : "dokaza"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 sm:flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-initial"
                        onClick={() => handleOpenCamera(task.id)}
                        leftIcon={<Camera className="h-4 w-4" />}
                        aria-label={`${task.attachments > 0 ? "Dodaj još jedan dokaz" : "Snimi prvi dokaz"} za zadatak ${task.title}`}
                      >
                        {task.attachments > 0 ? "Dodaj dokaz" : "Uslikaj dokaz"}
                      </Button>
                      {task.status !== "done" &&
                        task.status !== "submitted" && (
                          <Button
                            size="sm"
                            variant="success"
                            className="flex-1 sm:flex-initial"
                            aria-label={`Označi zadatak ${task.title} kao urađen`}
                            onClick={() => handleMarkComplete(task.id)}
                          >
                            Označi urađeno
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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

      {/* Camera Modal */}
      {cameraOpen && (
        <ModernCamera
          onClose={() => {
            setCameraOpen(false);
            setSelectedHomeworkId(null);
          }}
          onCapture={handlePhotoCapture}
        />
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
