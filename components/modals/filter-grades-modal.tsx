"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useFocusTrap } from "@/hooks/use-focus-trap";

interface FilterGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: GradeFilters) => void;
  currentFilters: GradeFilters;
}

export interface GradeFilters {
  subjectId?: string;
  category?: string;
  period?: string;
}

const CATEGORIES = [
  { value: "Kontrolni", label: "Kontrolni rad" },
  { value: "Usmeno", label: "Usmeno odgovaranje" },
  { value: "Domaći", label: "Domaći zadatak" },
  { value: "Pismeni", label: "Pismeni zadatak" },
];

const PERIODS = [
  { value: "this_month", label: "Ovaj mesec" },
  { value: "last_month", label: "Prošli mesec" },
  { value: "this_term", label: "Ovo polugodište" },
  { value: "this_year", label: "Ova školska godina" },
];

export function FilterGradesModal({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}: FilterGradesModalProps) {
  const [subjects, setSubjects] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<GradeFilters>(currentFilters);

  // Focus trap for accessibility
  const modalRef = useFocusTrap({
    active: isOpen,
    onClose,
    autoFocus: true,
    restoreFocus: true,
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
        setSubjects(data.subjects || []);
      } catch {
        toast.error("Greška", {
          description: "Nije moguće učitati predmete",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [isOpen]);

  // Reset filters to current on open
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 20 }}
          className="relative w-full max-w-md"
        >
          <Card
            ref={modalRef}
            className="p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-6 w-6 text-purple-600" />
                <h2 id="filter-modal-title" className="text-2xl font-bold text-gray-900">
                  Filteri za ocene
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Zatvori"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Subject Filter */}
              <div>
                <label
                  htmlFor="subject-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Predmet
                </label>
                <select
                  id="subject-filter"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={filters.subjectId || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, subjectId: e.target.value || undefined })
                  }
                  disabled={loading}
                >
                  <option value="">Svi predmeti</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label
                  htmlFor="category-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Kategorija
                </label>
                <select
                  id="category-filter"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={filters.category || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value || undefined })
                  }
                >
                  <option value="">Sve kategorije</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Filter */}
              <div>
                <label
                  htmlFor="period-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Period
                </label>
                <select
                  id="period-filter"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={filters.period || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, period: e.target.value || undefined })
                  }
                >
                  <option value="">Ceo period</option>
                  {PERIODS.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Resetuj
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Primeni filtere
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

