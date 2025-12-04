/**
 * Grades List Component
 * List view of all grades
 */

"use client";

import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Grade {
  id: string;
  grade: string | number;
  subject: {
    name: string;
    color?: string | undefined;
  };
  category: string;
  date: string | Date;
  description?: string | undefined;
}

interface GradesListProps {
  grades: Grade[];
  limit?: number;
}

export function GradesList({ grades, limit = 10 }: GradesListProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle>Sve ocene</CardTitle>
          <Button variant="ghost" size="sm" className="text-gray-500">
            Vidi sve <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {grades.slice(0, limit).map((grade) => (
            <div
              key={grade.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: grade.subject.color }}
                >
                  {grade.grade}
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {grade.subject.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                      {grade.category}
                    </Badge>
                    <span>•</span>
                    <span>{new Date(grade.date).toLocaleDateString("sr-RS")}</span>
                  </div>
                </div>
              </div>
              
              {grade.description && (
                <p className="text-sm text-gray-400 italic hidden sm:block max-w-[200px] truncate">
                  "{grade.description}"
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

