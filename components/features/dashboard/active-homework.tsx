import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, AlertCircle } from "lucide-react";
import type { HomeworkPriority, HomeworkStatus } from "@/lib/api/schemas/homework";

// Tip za homework item
interface HomeworkItem {
  id: string;
  title: string;
  description?: string | null | undefined;
  dueDate: string | Date;
  priority: HomeworkPriority;
  status: HomeworkStatus;
  subject: {
    id?: string;
    name: string;
    color?: string | undefined;
  };
  isOffline?: boolean;
}

interface ActiveHomeworkProps {
  homework: HomeworkItem[];
  now: Date | null;
}

export function ActiveHomework({ homework, now }: ActiveHomeworkProps) {
    // Helper function to format due date
  const getDaysUntil = (dueDate: string | Date) => {
    const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    // Use now if available, otherwise new Date() (client only) or just handle it
    const referenceTime = now ? now.getTime() : Date.now();
    const diff = Math.ceil(
      (date.getTime() - referenceTime) / (1000 * 60 * 60 * 24),
    );
    if (diff < 0) return "Rok prošao";
    if (diff === 0) return "Danas";
    if (diff === 1) return "Sutra";
    return `Za ${diff} dana`;
  };

  return (
    <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen
                      className="h-5 w-5 text-purple-600"
                      aria-hidden="true"
                    />
                    Domaći zadaci
                  </CardTitle>
                  <CardDescription>Aktivni zadaci i rokovi</CardDescription>
                </div>
                <Link href="/dashboard/domaci">
                  <Button
                    size="sm"
                    aria-label="Dodaj novi domaći zadatak"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {homework.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nema aktivnih zadataka! 🎉
                </p>
              ) : (
                <ul className="space-y-3" aria-label="Skoriji domaći zadaci">
                  {homework.map((task) => (
                    <li key={task.id}>
                      <Link href="/dashboard/domaci">
                        <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer group">
                          <div
                            className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center text-xl group-hover:scale-110 group-hover:rotate-6 transition-transform ${
                              task.priority === "URGENT"
                                ? "bg-red-100"
                                : task.priority === "IMPORTANT"
                                  ? "bg-orange-100"
                                  : "bg-blue-100"
                            }`}
                            aria-hidden="true"
                          >
                            {task.status === "DONE" ? "✅" : "📝"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1 gap-2">
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {task.title}
                              </h4>
                              {task.priority === "URGENT" && (
                                <AlertCircle
                                  className="h-5 w-5 text-red-600"
                                  aria-label="Hitno"
                                />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {task.subject.name}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  task.status === "DONE"
                                    ? "bg-green-100 text-green-700"
                                    : task.status === "IN_PROGRESS"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {task.status === "DONE"
                                  ? "Urađeno"
                                  : task.status === "IN_PROGRESS"
                                    ? "Radim"
                                    : "Novo"}
                              </span>
                              <span className="text-xs text-gray-500">
                                • {getDaysUntil(task.dueDate)}
                              </span>
                              {task.status === "DONE" && (
                                <span className="text-xs text-green-700 font-medium">
                                  +10 XP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
  );
}
