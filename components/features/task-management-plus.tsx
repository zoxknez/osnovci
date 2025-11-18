/**
 * TASK MANAGEMENT++ UI COMPONENTS
 * Subtask editor, dependency graph, bulk actions interface
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  Circle,
  Clock,
  Link as LinkIcon,
  AlertCircle,
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
    updated[index] = {
      ...updated[index],
      status: updated[index].status === "SUBMITTED" ? "ASSIGNED" : "SUBMITTED",
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

// ============================================
// DEPENDENCY MANAGER
// ============================================

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: Date;
}

interface Dependency {
  from: string;
  to: string;
  type: string;
}

interface DependencyManagerProps {
  tasks: Task[];
  dependencies: Dependency[];
  onAddDependency: (taskId: string, dependsOnId: string) => Promise<void>;
  onRemoveDependency: (from: string, to: string) => Promise<void>;
}

export function DependencyManager({
  tasks,
  dependencies,
  onAddDependency,
  onRemoveDependency,
}: DependencyManagerProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [dependsOn, setDependsOn] = useState<string | null>(null);

  const handleAddDependency = async () => {
    if (!selectedTask || !dependsOn) return;

    await onAddDependency(selectedTask, dependsOn);
    setSelectedTask(null);
    setDependsOn(null);
  };

  const getBlockedTasks = (taskId: string): string[] => {
    return dependencies.filter(d => d.from === taskId).map(d => d.to);
  };

  const getBlockingTasks = (taskId: string): string[] => {
    return dependencies.filter(d => d.to === taskId).map(d => d.from);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Zavisnosti Zadataka
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Dependency */}
        <div className="space-y-2">
          <Label>Dodaj Zavisnost</Label>
          <div className="flex gap-2">
            <select
              className="flex-1 border rounded-md p-2 text-sm"
              value={selectedTask || ""}
              onChange={(e) => setSelectedTask(e.target.value)}
            >
              <option value="">Odaberi zadatak...</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>

            <span className="flex items-center text-sm text-gray-500">zavisi od</span>

            <select
              className="flex-1 border rounded-md p-2 text-sm"
              value={dependsOn || ""}
              onChange={(e) => setDependsOn(e.target.value)}
            >
              <option value="">Odaberi zadatak...</option>
              {tasks.filter(t => t.id !== selectedTask).map(task => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>

            <Button onClick={handleAddDependency} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dependency List */}
        <div className="space-y-3">
          {tasks.map(task => {
            const blocking = getBlockingTasks(task.id);
            const blocked = getBlockedTasks(task.id);

            if (blocking.length === 0 && blocked.length === 0) return null;

            return (
              <div key={task.id} className="border rounded-lg p-3 space-y-2">
                <p className="font-medium text-sm">{task.title}</p>
                
                {blocking.length > 0 && (
                  <div className="text-xs text-gray-600 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Blokiran sa:</span>
                      <ul className="mt-1 space-y-1">
                        {blocking.map(blockingId => {
                          const blockingTask = tasks.find(t => t.id === blockingId);
                          return blockingTask ? (
                            <li key={blockingId} className="flex items-center justify-between">
                              <span>• {blockingTask.title}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveDependency(blockingId, task.id)}
                                className="h-6 px-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  </div>
                )}

                {blocked.length > 0 && (
                  <div className="text-xs text-gray-600 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Blokira:</span>
                      <ul className="mt-1 space-y-1">
                        {blocked.map(blockedId => {
                          const blockedTask = tasks.find(t => t.id === blockedId);
                          return blockedTask ? (
                            <li key={blockedId}>• {blockedTask.title}</li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// BULK ACTIONS INTERFACE
// ============================================

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
          onChange={(e) => onUpdatePriority(e.target.value as "LOW" | "NORMAL" | "HIGH")}
          defaultValue=""
        >
          <option value="" disabled>Prioritet</option>
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
