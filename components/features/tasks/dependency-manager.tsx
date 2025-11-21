"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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
