/**
 * Homework Filters Component
 * Search and filter controls for homework list
 */

"use client";

import { Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HomeworkFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: "all" | "active" | "done";
  onFilterChange: (status: "all" | "active" | "done") => void;
  viewMode: "list" | "kanban";
  onViewModeChange: (mode: "list" | "kanban") => void;
}

export function HomeworkFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  viewMode,
  onViewModeChange,
}: HomeworkFiltersProps) {
  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="flex-1 relative max-w-md">
            <Input
              type="text"
              placeholder="Pretraži zadatke..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-gray-400" />}
              className="bg-white border-gray-200 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0">
            <div className="flex bg-gray-100/80 p-1 rounded-lg">
              <button
                onClick={() => onViewModeChange("list")}
                aria-label="Prikaži kao listu"
                aria-pressed={viewMode === "list"}
                className={cn(
                  "p-2 rounded-md transition-all text-sm font-medium flex items-center gap-2",
                  viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <MoreVertical className="h-4 w-4 rotate-90" />
                Lista
              </button>
              <button
                onClick={() => onViewModeChange("kanban")}
                aria-label="Prikaži kao tablu"
                aria-pressed={viewMode === "kanban"}
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
                onClick={() => onFilterChange("all")}
                className={filterStatus === "all" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
              >
                Sve
              </Button>
              <Button
                variant={filterStatus === "active" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("active")}
                className={filterStatus === "active" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
              >
                Aktivni
              </Button>
              <Button
                variant={filterStatus === "done" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("done")}
                className={filterStatus === "done" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}
              >
                Urađeni
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

