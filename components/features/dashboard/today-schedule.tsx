import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2 } from "lucide-react";

interface TodayScheduleProps {
  todayClasses: any[];
  now: Date | null;
}

export function TodaySchedule({ todayClasses, now }: TodayScheduleProps) {
    // Helper function to determine class status
  const getClassStatus = (startTime: string, endTime: string) => {
    if (!now) return "upcoming"; // Default for SSR/Initial render
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startParts = startTime.split(":").map(Number);
    const endParts = endTime.split(":").map(Number);
    const startHour = startParts[0] ?? 0;
    const startMin = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 0;
    const endMin = endParts[1] ?? 0;
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    if (currentTime >= start && currentTime <= end) return "current";
    if (currentTime > end) return "done";
    return "upcoming";
  };

  return (
    <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock
                      className="h-5 w-5 text-blue-600"
                      aria-hidden="true"
                    />
                    Raspored danas
                  </CardTitle>
                  <CardDescription>Tvoji časovi za danas</CardDescription>
                </div>
                <Link href="/dashboard/raspored">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Idi na pun raspored"
                  >
                    Vidi sve →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {todayClasses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nema časova danas 🎉
                </p>
              ) : (
                <ul className="space-y-3" aria-label="Današnji časovi">
                  {todayClasses.map((classItem) => {
                    const status = getClassStatus(
                      classItem.startTime,
                      classItem.endTime,
                    );
                    return (
                      <li
                        key={classItem.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          status === "current"
                            ? "bg-blue-50 border-2 border-blue-500 shadow-md"
                            : status === "done"
                              ? "bg-gray-50 opacity-60"
                              : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${
                            status === "current"
                              ? "bg-blue-600 text-white"
                              : status === "done"
                                ? "bg-gray-300 text-gray-600"
                                : "bg-gray-100 text-gray-700"
                          }`}
                          role="img"
                          aria-label={`Čas u ${classItem.startTime}`}
                        >
                          {classItem.startTime}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {(classItem as any).subject.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {(classItem as any).classroom || "Nema učionice"}
                          </p>
                        </div>

                        {status === "current" && (
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <span>🔴</span>
                            Trenutno
                          </span>
                        )}
                        {status === "done" && (
                          <CheckCircle2
                            className="h-5 w-5 text-green-700"
                            aria-label="Završeno"
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
  );
}
