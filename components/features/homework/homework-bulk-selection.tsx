/**
 * Homework Bulk Selection Component
 * Provides checkbox selection for bulk actions
 */

"use client";

import { CheckSquare2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface HomeworkBulkSelectionProps {
  items: Array<{ id: string }>;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function HomeworkBulkSelection({
  items,
  selectedIds,
  onSelectionChange,
  disabled = false,
}: HomeworkBulkSelectionProps) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map((item) => item.id));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSelectAll}
        disabled={disabled || items.length === 0}
        className="h-8 px-2"
        aria-label={allSelected ? "Deselektuj sve" : "Selektuj sve"}
      >
        {allSelected ? (
          <CheckSquare2 className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        <span className="ml-1 text-xs">
          {allSelected ? "Sve" : someSelected ? `${selectedIds.length}` : "Sve"}
        </span>
      </Button>
      {someSelected && (
        <span className="text-xs text-gray-500">
          {selectedIds.length} od {items.length} izabrano
        </span>
      )}
    </div>
  );
}

interface HomeworkItemCheckboxProps {
  id: string;
  checked: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

export function HomeworkItemCheckbox({
  id,
  checked,
  onToggle,
  disabled = false,
  className,
}: HomeworkItemCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={() => onToggle(id)}
      disabled={disabled}
      className={cn("h-4 w-4", className)}
      aria-label={checked ? "Deselektuj" : "Selektuj"}
    />
  );
}
