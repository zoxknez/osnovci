/**
 * Grades Filters Bar Component
 * Filter controls and action buttons for grades page
 */

"use client";

import { Calculator, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GradesFiltersBarProps {
  gradesCount: number;
  onFilterClick: () => void;
  onSimulatorToggle: () => void;
  showSimulator: boolean;
  onExportClick: () => void;
}

export function GradesFiltersBar({
  gradesCount,
  onFilterClick,
  onSimulatorToggle,
  showSimulator: _showSimulator,
  onExportClick,
}: GradesFiltersBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <div className="text-sm text-gray-500">
            {gradesCount} ocena{gradesCount !== 1 ? 'i' : ''} prikazano
          </div>
          <div className="hidden sm:block h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Filter className="h-5 w-5" />}
              onClick={onFilterClick}
            >
              Filter
            </Button>
            <Button
              variant="outline"
              leftIcon={<Calculator className="h-5 w-5" />}
              onClick={onSimulatorToggle}
            >
              Simulator
            </Button>
            <Button
              leftIcon={<Download className="h-5 w-5" />}
              onClick={onExportClick}
            >
              PDF Izveštaj
            </Button>
          </div>
        </div>

        {/* Mobile filter button */}
        <div className="sm:hidden">
          <Button
            variant="outline"
            leftIcon={<Filter className="h-5 w-5" />}
            onClick={onFilterClick}
          >
            Filter
          </Button>
        </div>
      </div>
    </div>
  );
}

