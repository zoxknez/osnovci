/**
 * Homework Card Compact Component
 * Compact card for kanban view
 */

"use client";

import { Camera, CheckCircle2, MoreVertical, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getDaysUntil } from "./homework-utils";

interface HomeworkCardCompactProps {
  task: {
    id: string;
    title: string;
    subject?: string | undefined;
    dueDate: Date;
    status: string;
    priority?: string | undefined;
    color?: string | undefined;
    attachments?: number | undefined;
  };
  isDone?: boolean;
  onComplete: () => void;
  onCamera: () => void;
}

export function HomeworkCardCompact({ 
  task, 
  isDone = false,
  onComplete, 
  onCamera 
}: HomeworkCardCompactProps) {
  const isOverdue =
    task.dueDate < new Date() &&
    task.status !== "done" &&
    task.status !== "submitted";
  
  const isUrgent = task.priority === "urgent";

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all hover:shadow-md border-l-4",
      isDone ? "border-l-green-500 opacity-75 hover:opacity-100" :
      isOverdue ? "border-l-red-500 bg-red-50/30" : 
      isUrgent ? "border-l-red-500" : "border-l-blue-500"
    )}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="text-[10px] px-1.5 h-5" style={{ 
            backgroundColor: task.color ? `${task.color}20` : '#eff6ff',
            color: task.color || '#1d4ed8',
            borderColor: task.color ? `${task.color}40` : '#dbeafe'
          }}>
            {task.subject || "Predmet"}
          </Badge>
          {!isDone && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-gray-400">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCamera}>
                  <Camera className="h-3 w-3 mr-2" />
                  Prilog
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onComplete}>
                  <CheckCircle2 className="h-3 w-3 mr-2" />
                  Završi
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <h4 className={cn("font-bold text-sm mb-1 line-clamp-2", isDone && "line-through text-gray-500")}>
          {task.title}
        </h4>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span className={cn("flex items-center gap-1", isOverdue && !isDone && "text-red-600 font-bold")}>
            <CalendarIcon className="h-3 w-3" />
            {getDaysUntil(task.dueDate)}
          </span>
          {task.attachments && task.attachments > 0 && (
            <span className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {task.attachments}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

