"use client";

import { CheckCircle2, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BulkActionsProps {
  selectedCount: number;
  onComplete: () => void;
  onDelete: () => void;
  onUpdatePriority: (priority: "LOW" | "NORMAL" | "HIGH") => void;
  onUpdateDueDate: (date: Date) => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  onComplete,
  onDelete,
  onUpdatePriority,
  onUpdateDueDate,
  onClearSelection,
}: BulkActionsProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white rounded-full shadow-lg px-6 py-3 flex items-center gap-4 z-50 slide-in-bottom">
      <span className="font-medium">{selectedCount} izabrano</span>

      <div className="h-6 w-px bg-blue-400" />

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onComplete}
          className="text-white hover:bg-blue-700"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Završi
        </Button>

        <select
          className="bg-blue-700 text-white border-0 rounded-md px-3 py-1 text-sm cursor-pointer hover:bg-blue-800"
          onChange={(e) =>
            onUpdatePriority(e.target.value as "LOW" | "NORMAL" | "HIGH")
          }
          defaultValue=""
        >
          <option value="" disabled>
            Prioritet
          </option>
          <option value="HIGH">Visok</option>
          <option value="NORMAL">Normalan</option>
          <option value="LOW">Nizak</option>
        </select>

        {showDatePicker ? (
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-blue-700 text-white border-0 rounded-md px-3 py-1 text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedDate) {
                  onUpdateDueDate(new Date(selectedDate));
                  setShowDatePicker(false);
                  setSelectedDate("");
                }
              }}
              className="text-white hover:bg-blue-700"
            >
              OK
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDatePicker(true)}
            className="text-white hover:bg-blue-700"
          >
            <Clock className="h-4 w-4 mr-1" />
            Rok
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-200 hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Obriši
        </Button>
      </div>

      <div className="h-6 w-px bg-blue-400" />

      <button
        onClick={onClearSelection}
        className="text-blue-200 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
