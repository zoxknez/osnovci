"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  Circle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Subtask {
  id?: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  status?: string;
  order: number;
}

interface SubtaskEditorProps {
  parentId?: string;
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
  onSave?: () => Promise<void>;
}

export function SubtaskEditor({
  parentId,
  subtasks,
  onSubtasksChange,
  onSave,
}: SubtaskEditorProps) {
  const [newSubtask, setNewSubtask] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addSubtask = () => {
    if (!newSubtask.trim()) return;

    const subtask: Subtask = {
      title: newSubtask,
      order: subtasks.length,
    };

    onSubtasksChange([...subtasks, subtask]);
    setNewSubtask("");
  };

  const removeSubtask = (index: number) => {
    const updated = subtasks.filter((_, i) => i !== index);
    onSubtasksChange(updated.map((s, i) => ({ ...s, order: i })));
  };

  const toggleSubtask = (index: number) => {
    const updated = [...subtasks];
    const current = updated[index];
    if (!current) return;
    
    updated[index] = {
      ...current,
      status: current.status === "SUBMITTED" ? "ASSIGNED" : "SUBMITTED",
    };
    onSubtasksChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...subtasks];
    const draggedItem = updated[draggedIndex];
    if (!draggedItem) return;
    
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    onSubtasksChange(updated.map((s, i) => ({ ...s, order: i })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const completedCount = subtasks.filter(s => s.status === "SUBMITTED").length;
  const progress = subtasks.length > 0 
    ? Math.round((completedCount / subtasks.length) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Podzadaci</span>
          {subtasks.length > 0 && (
            <Badge variant="secondary">
              {completedCount}/{subtasks.length} ({progress}%)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {subtasks.length > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Subtask List */}
        <div className="space-y-2">
          {subtasks.map((subtask, index) => (
            <div
              key={subtask.id || index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors",
                draggedIndex === index && "opacity-50"
              )}
            >
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
              
              <button
                onClick={() => toggleSubtask(index)}
                className="flex-shrink-0"
              >
                {subtask.status === "SUBMITTED" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </button>

              <div className="flex-1">
                <p className={cn(
                  "text-sm",
                  subtask.status === "SUBMITTED" && "line-through text-gray-500"
                )}>
                  {subtask.title}
                </p>
                {subtask.estimatedMinutes && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {subtask.estimatedMinutes} min
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSubtask(index)}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Subtask */}
        <div className="flex gap-2">
          <Input
            placeholder="Dodaj podzadatak..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubtask()}
          />
          <Button onClick={addSubtask} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Save Button */}
        {onSave && parentId && (
          <Button onClick={onSave} className="w-full">
            Sačuvaj Podzadatke
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
