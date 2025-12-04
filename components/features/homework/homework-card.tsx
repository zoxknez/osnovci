/**
 * Homework Card Component
 * Full-size card for displaying homework in list view
 */

"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, Camera, CheckCircle2, MoreVertical, Play, Calendar as CalendarIcon, WifiOff, Lightbulb } from "lucide-react";
import { toast } from "sonner";
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

interface HomeworkCardProps {
  task: {
    id: string;
    title: string;
    subject?: string | undefined;
    subjectId?: string | undefined;
    dueDate: Date;
    description?: string | undefined;
    status: string;
    priority?: string | undefined;
    color?: string | undefined;
    attachments?: number | undefined;
    isOffline?: boolean | undefined;
    synced?: boolean | undefined;
  };
  onComplete: () => void;
  onCamera: () => void;
  onGetHelp?: () => void;
}

export function HomeworkCard({ task, onComplete, onCamera, onGetHelp }: HomeworkCardProps) {
  const router = useRouter();
  const isOverdue =
    task.dueDate < new Date() &&
    task.status !== "done" &&
    task.status !== "submitted";
  
  const isUrgent = task.priority === "urgent";

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md group relative overflow-hidden border-l-4",
        isOverdue ? "border-l-red-500 bg-red-50/10" : 
        isUrgent ? "border-l-red-500" : 
        task.priority === "medium" ? "border-l-amber-500" : "border-l-blue-500"
      )}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4 flex-1">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: task.color || "#3b82f6" }}
            >
              <span className="text-lg font-bold">
                {(task.subject || "P").charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {task.title}
                    </h3>
                    {task.isOffline && !task.synced && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    {task.subject || "Predmet"}
                    <span className="text-gray-300">•</span>
                    <span className={cn("flex items-center gap-1", isOverdue ? "text-red-600 font-bold" : "")}>
                      <CalendarIcon className="h-3 w-3" />
                      {getDaysUntil(task.dueDate)}
                    </span>
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onGetHelp && (
                      <DropdownMenuItem onClick={onGetHelp}>
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Pomozite mi da rešim
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={onCamera}>
                      <Camera className="h-4 w-4 mr-2" />
                      Dodaj prilog
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (task.subjectId) {
                        router.push(`/dashboard/fokus?subjectId=${task.subjectId}`);
                      } else {
                        toast.error("Predmet nije definisan za ovaj zadatak");
                      }
                    }}>
                      <Play className="h-4 w-4 mr-2" />
                      Pokreni tajmer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {task.description && (
                <div className="mt-2 mb-3 text-sm text-gray-600 bg-gray-50/50 p-2 rounded-md border border-gray-100">
                  <p className="line-clamp-2">{task.description}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3">
                {(() => {
                  switch (task.status) {
                    case "done":
                    case "submitted":
                      return <Badge variant="secondary" className="bg-green-100 text-green-700">Urađeno</Badge>;
                    case "in_progress":
                      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Radim</Badge>;
                    default:
                      return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Novo</Badge>;
                  }
                })()}

                {task.priority === "urgent" && (
                  <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Hitno
                  </Badge>
                )}

                {task.attachments && task.attachments > 0 && (
                  <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                    <Camera className="h-3 w-3 mr-1" />
                    {task.attachments}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-2 mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
            {task.status !== "done" && task.status !== "submitted" ? (
              <>
                <Button
                  size="sm"
                  className="flex-1 sm:w-32 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
                  onClick={onComplete}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Završi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:w-32"
                  onClick={onCamera}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Uslikaj
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[80px] w-full sm:w-32 bg-green-50 rounded-lg border border-green-100">
                <span className="text-2xl">🎉</span>
                <span className="text-xs font-bold text-green-700 mt-1">Bravo!</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

