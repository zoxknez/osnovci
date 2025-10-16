"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface AddHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HomeworkFormData) => Promise<void>;
}

export interface HomeworkFormData {
  title: string;
  description: string;
  subjectId: string;
  dueDate: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
}

export function AddHomeworkModal({
  isOpen,
  onClose,
  onSubmit,
}: AddHomeworkModalProps) {
  const [subjects, setSubjects] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<HomeworkFormData>({
    title: "",
    description: "",
    subjectId: "",
    dueDate: "",
    priority: "NORMAL",
  });

  // Fetch subjects on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/subjects", {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Greška pri učitavanju predmeta");

        const data = await response.json();
        setSubjects(data.data || []);
      } catch (err) {
        toast.error("Greška", {
          description: "Nije moguće učitati predmete",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Naslov je obavezan";
    } else if (formData.title.length < 3) {
      newErrors.title = "Naslov mora biti najmanje 3 karaktera";
    }

    if (!formData.subjectId) {
      newErrors.subjectId = "Predmet je obavezan";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Rok je obavezan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Greška pri validaciji", {
        description: "Popuni sve obavezne polje",
      });
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);

      // Reset form
      setFormData({
        title: "",
        description: "",
        subjectId: "",
        dueDate: "",
        priority: "NORMAL",
      });
      setErrors({});
      onClose();

      toast.success("✅ Zadatak je dodan!", {
        description: "Novi domaći zadatak je uspješno kreiran",
      });
    } catch (err) {
      toast.error("Greška pri kreiranju", {
        description:
          err instanceof Error ? err.message : "Nepoznata greška",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <Card
              className="w-full max-w-md bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  📝 Dodaj novi zadatak
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naslov *
                  </label>
                  <Input
                    type="text"
                    placeholder="npr. Zadaci sa strane 45"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Predmet *
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectId: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.subjectId
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={loading}
                  >
                    <option value="">
                      {loading ? "Učitavam..." : "Odaberi predmet"}
                    </option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {errors.subjectId && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.subjectId}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis
                  </label>
                  <textarea
                    placeholder="Detaljnije objašnjenje zadatka..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rok *
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    min={getTomorrowDate()}
                    className={errors.dueDate ? "border-red-500" : ""}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.dueDate}
                    </p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioritet
                  </label>
                  <div className="flex gap-2">
                    {["NORMAL", "IMPORTANT", "URGENT"].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            priority: priority as HomeworkFormData["priority"],
                          })
                        }
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          formData.priority === priority
                            ? priority === "URGENT"
                              ? "bg-red-600 text-white"
                              : priority === "IMPORTANT"
                                ? "bg-orange-600 text-white"
                                : "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {priority === "NORMAL"
                          ? "Normalno"
                          : priority === "IMPORTANT"
                            ? "Važno"
                            : "Hitno"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Otkaži
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || loading}
                    className="flex-1"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    {submitting ? "Kreiram..." : "Kreiraj zadatak"}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
