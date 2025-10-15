// Domaći zadaci stranica - lista svih zadataka
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { ModernCamera } from "@/components/features/modern-camera";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function DomaciPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "done">(
    "all",
  );
  const [cameraOpen, setCameraOpen] = useState(false);
  const [, setSelectedHomeworkId] = useState<number | null>(null);

  // Mock data
  const homework = [
    {
      id: 1,
      subject: "Matematika",
      title: "Zadaci sa strane 45",
      description: "Uradi zadatke 1-10",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: "in_progress",
      priority: "normal",
      attachments: 2,
      color: "#3b82f6",
    },
    {
      id: 2,
      subject: "Srpski",
      title: "Sastav: Moj omiljeni pisac",
      description: "Napisi sastav od 200 reči",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "assigned",
      priority: "important",
      attachments: 0,
      color: "#ef4444",
    },
    {
      id: 3,
      subject: "Engleski",
      title: "Unit 3 - vežbe",
      description: "Vocabulary and grammar exercises",
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "done",
      priority: "normal",
      attachments: 3,
      color: "#10b981",
    },
    {
      id: 4,
      subject: "Fizika",
      title: "Priprema za kontrolni",
      description: "Ponovi lekcije 5-8",
      dueDate: new Date(Date.now() + 0),
      status: "in_progress",
      priority: "urgent",
      attachments: 1,
      color: "#8b5cf6",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
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

  const filteredHomework = homework.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && task.status !== "done") ||
      (filterStatus === "done" && task.status === "done");
    return matchesSearch && matchesFilter;
  });

  const handleOpenCamera = (homeworkId: number) => {
    setSelectedHomeworkId(homeworkId);
    setCameraOpen(true);
  };

  const handlePhotoCapture = async (file: File) => {
    try {
      // TODO: Save to IndexedDB offline-storage
      toast.success("📸 Fotografija je snimljena!", {
        description:
          "Biće automatski sinhronizovana kada se povežeš na internet.",
      });

      // Close camera
      setCameraOpen(false);
      setSelectedHomeworkId(null);

      // TODO: Upload to cloud when online
    } catch {
      toast.error("Greška prilikom čuvanja fotografije");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            📚 Domaći zadaci
          </h1>
          <p className="text-gray-600 mt-1">
            Upravljaj svojim zadacima i rokovima
          </p>
        </div>
        <Button
          size="lg"
          leftIcon={<Plus className="h-5 w-5" />}
          aria-label="Dodaj novi domaći zadatak"
        >
          Dodaj zadatak
        </Button>
      </motion.div>

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
            <div
              className="flex gap-2"
              role="group"
              aria-label="Filteri za zadatke"
            >
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {homework.filter((h) => h.status !== "done").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Aktivni zadaci</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {homework.filter((h) => h.status === "done").length}
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
                  homework.filter(
                    (h) => h.priority === "urgent" && h.status !== "done",
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
              task.dueDate < new Date() && task.status !== "done";
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
                            <h3 className="text-lg font-semibold text-gray-900">
                              {task.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {task.subject}
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
                        {task.status !== "done" && (
                          <Button
                            size="sm"
                            variant="success"
                            className="flex-1 sm:flex-initial"
                            aria-label={`Označi zadatak ${task.title} kao urađen`}
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
    </div>
  );
}
