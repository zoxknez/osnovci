import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Bot, Users, Calendar, BookOpen, CheckCircle2, Zap } from "lucide-react";

interface QuickStatsProps {
  todayClassesCount: number;
  activeHomeworkCount: number;
  completedHomeworkCount: number;
}

export function QuickStats({ todayClassesCount, activeHomeworkCount, completedHomeworkCount }: QuickStatsProps) {
  return (
    <>
    <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Link href="/dashboard/fokus">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Fokusiraj se
                    </p>
                    <p className="text-lg font-bold text-blue-900 mt-1">
                      Započni sesiju
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    <Clock
                      className="h-7 w-7 text-white"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <Link href="/dashboard/ai-tutor">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      AI Nastavnik
                    </p>
                    <p className="text-lg font-bold text-purple-900 mt-1">
                      Pitaj bilo šta
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                    <Bot
                      className="h-7 w-7 text-white"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <Link href="/dashboard/drustvo">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      Društvo
                    </p>
                    <p className="text-lg font-bold text-green-900 mt-1">
                      Pošalji stiker
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-green-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users
                      className="h-7 w-7 text-white"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Link href="/dashboard/raspored">
            <Card className="bg-white border-gray-200 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Današnjih časova
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                      {todayClassesCount}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <Calendar
                      className="h-6 w-6 text-gray-600"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <Link href="/dashboard/domaci">
            <Card className="bg-white border-gray-200 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Aktivnih zadataka
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                      {activeHomeworkCount}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <BookOpen
                      className="h-6 w-6 text-gray-600"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <Card className="bg-white border-gray-200 hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Završeno danas
                  </p>
                  <p className="text-4xl font-bold text-gray-900">
                    {completedHomeworkCount}
                  </p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    +10 XP zarada danas
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <CheckCircle2
                    className="h-6 w-6 text-gray-600"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
  );
}
