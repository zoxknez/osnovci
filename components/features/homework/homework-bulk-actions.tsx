/**
 * Homework Bulk Actions Component
 * Actions toolbar for selected homework items
 */

"use client";

import {
  Calendar,
  CheckCircle2,
  Download,
  Flag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  showErrorToast,
  showSuccessToast,
} from "@/components/features/error-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HomeworkBulkActionsProps {
  selectedIds: string[];
  onComplete: (ids: string[]) => Promise<void>;
  onDelete: (ids: string[]) => Promise<void>;
  onUpdatePriority: (
    ids: string[],
    priority: "NORMAL" | "IMPORTANT" | "URGENT",
  ) => Promise<void>;
  onUpdateDueDate: (ids: string[], date: Date) => Promise<void>;
  onExport: (ids: string[]) => Promise<void>;
  onClearSelection: () => void;
  disabled?: boolean;
}

export function HomeworkBulkActions({
  selectedIds,
  onComplete,
  onDelete,
  onUpdatePriority,
  onUpdateDueDate,
  onExport,
  onClearSelection,
  disabled = false,
}: HomeworkBulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  if (selectedIds.length === 0) return null;

  const handleAction = async (
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    setIsProcessing(true);
    try {
      await action();
      showSuccessToast(successMessage);
      onClearSelection();
    } catch (error) {
      showErrorToast({
        error: error instanceof Error ? error : new Error(String(error)),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    handleAction(
      () => onComplete(selectedIds),
      `✅ ${selectedIds.length} zadataka označeno kao urađeno!`,
    );
  };

  const handleDelete = () => {
    if (
      !confirm(
        `Da li ste sigurni da želite da obrišete ${selectedIds.length} zadataka?`,
      )
    ) {
      return;
    }
    handleAction(
      () => onDelete(selectedIds),
      `🗑️ ${selectedIds.length} zadataka obrisano!`,
    );
  };

  const handlePriorityChange = (
    priority: "NORMAL" | "IMPORTANT" | "URGENT",
  ) => {
    handleAction(
      () => onUpdatePriority(selectedIds, priority),
      `📌 Prioritet ažuriran za ${selectedIds.length} zadataka!`,
    );
  };

  const handleDateSubmit = () => {
    if (!selectedDate) return;
    handleAction(
      () => onUpdateDueDate(selectedIds, new Date(selectedDate)),
      `📅 Rok ažuriran za ${selectedIds.length} zadataka!`,
    );
    setShowDatePicker(false);
    setSelectedDate("");
  };

  const handleExport = () => {
    handleAction(
      () => onExport(selectedIds),
      `📥 Export započet za ${selectedIds.length} zadataka!`,
    );
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "bg-blue-600 text-white rounded-full shadow-lg px-4 py-2",
        "flex items-center gap-3 animate-in slide-in-from-bottom-5",
      )}
    >
      <span className="font-medium text-sm">{selectedIds.length} izabrano</span>

      <div className="h-6 w-px bg-blue-400" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleComplete}
          disabled={disabled || isProcessing}
          className="text-white hover:bg-blue-700 h-8 px-2"
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled || isProcessing}
              className="text-white hover:bg-blue-700 h-8 px-2"
            >
              <Flag className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePriorityChange("URGENT")}>
              🔴 Hitno
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange("IMPORTANT")}>
              🟠 Važno
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange("NORMAL")}>
              🟢 Normalno
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showDatePicker ? (
          <div className="flex items-center gap-1 bg-blue-700 rounded-md px-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs border-0 outline-none"
              min={new Date().toISOString().split("T")[0]}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDateSubmit}
              disabled={!selectedDate}
              className="text-white hover:bg-blue-800 h-6 px-1"
            >
              ✓
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDatePicker(false);
                setSelectedDate("");
              }}
              className="text-white hover:bg-blue-800 h-6 px-1"
            >
              ✕
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDatePicker(true)}
            disabled={disabled || isProcessing}
            className="text-white hover:bg-blue-700 h-8 px-2"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={disabled || isProcessing}
          className="text-white hover:bg-blue-700 h-8 px-2"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={disabled || isProcessing}
          className="text-red-200 hover:bg-red-700 h-8 px-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-blue-400" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        disabled={isProcessing}
        className="text-blue-200 hover:text-white h-8 px-2"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
