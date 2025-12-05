/**
 * Grades Filters Bar Component
 * Filter controls and action buttons for grades page
 */

"use client";

import { Calculator, Download, Filter, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GradesFiltersBarProps {
  gradesCount: number;
  onFilterClick: () => void;
  onSimulatorToggle: () => void;
  showSimulator: boolean;
  onExportClick: () => void;
  isExportingPDF?: boolean;
}

// Helper za srpsku deklinaciju
const formatGradesCount = (count: number): string => {
  if (count === 1) return "ocena";
  if (count >= 2 && count <= 4) return "ocene";
  return "ocena";
};

export function GradesFiltersBar({
  gradesCount,
  onFilterClick,
  onSimulatorToggle,
  showSimulator: _showSimulator,
  onExportClick,
  isExportingPDF = false,
}: GradesFiltersBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <div className="text-sm text-gray-500">
            {gradesCount} {formatGradesCount(gradesCount)} prikazano
          </div>
          <div
            className="hidden sm:block h-4 w-px bg-gray-200"
            aria-hidden="true"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Filter className="h-5 w-5" />}
              onClick={onFilterClick}
              aria-haspopup="dialog"
              aria-label="Otvori filter opcije"
            >
              Filter
            </Button>
            <Button
              variant="outline"
              leftIcon={<Calculator className="h-5 w-5" />}
              onClick={onSimulatorToggle}
              aria-label="Prikaži simulator ocena"
            >
              Simulator
            </Button>
            <Button
              leftIcon={
                isExportingPDF ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )
              }
              onClick={onExportClick}
              disabled={isExportingPDF}
              aria-label={
                isExportingPDF
                  ? "Generisanje PDF-a u toku..."
                  : "Preuzmi PDF izveštaj"
              }
            >
              {isExportingPDF ? "Generisanje..." : "PDF Izveštaj"}
            </Button>
          </div>
        </div>

        {/* Mobile filter button */}
        <div className="sm:hidden">
          <Button
            variant="outline"
            leftIcon={<Filter className="h-5 w-5" />}
            onClick={onFilterClick}
            aria-haspopup="dialog"
            aria-label="Otvori filter opcije"
          >
            Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
