/**
 * Homework Kanban View Component
 * Kanban board view for homework tasks
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HomeworkCardCompact } from "./homework-card-compact";

interface HomeworkKanbanViewProps {
  todo: Array<{
    id: string;
    title: string;
    subject?: string;
    dueDate: Date;
    status: string;
    priority?: string;
    color?: string;
    attachments?: number;
  }>;
  done: Array<{
    id: string;
    title: string;
    subject?: string;
    dueDate: Date;
    status: string;
    priority?: string;
    color?: string;
    attachments?: number;
  }>;
  onComplete: (id: string) => void;
  onCamera: (id: string) => void;
}

export function HomeworkKanbanView({ 
  todo, 
  done, 
  onComplete, 
  onCamera 
}: HomeworkKanbanViewProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 h-full min-h-[500px]">
      {/* To Do Column */}
      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Za uraditi
            <Badge variant="secondary" className="ml-2 bg-white">{todo.length}</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          {todo.map(task => (
            <HomeworkCardCompact 
              key={task.id} 
              task={task} 
              compact 
              onComplete={() => onComplete(task.id)}
              onCamera={() => onCamera(task.id)}
            />
          ))}
          {todo.length === 0 && (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <p>Nema aktivnih zadataka 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* Done Column */}
      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Završeno
            <Badge variant="secondary" className="ml-2 bg-white">{done.length}</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          {done.map(task => (
            <HomeworkCardCompact 
              key={task.id} 
              task={task} 
              compact 
              isDone
              onComplete={() => {}}
              onCamera={() => onCamera(task.id)}
            />
          ))}
          {done.length === 0 && (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <p>Još ništa nije završeno</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

