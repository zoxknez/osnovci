/**
 * Subject Grade Card Component
 * Individual card displaying grades for a specific subject
 */

"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SubjectGrade {
  subject: string;
  color: string;
  icon: string;
  average?: number;
  trend?: "up" | "down" | "stable";
  lastGrade?: number;
  totalGrades?: number;
  grades: number[];
}

interface SubjectGradeCardProps {
  subjectGrade: SubjectGrade;
}

export function SubjectGradeCard({ subjectGrade: sg }: SubjectGradeCardProps) {
  // Calculate goal progress
  const currentAvg = sg.average || 0;
  const nextGrade = Math.floor(currentAvg) + 1;
  const progressToNext = Math.max(0, Math.min(100, ((currentAvg - Math.floor(currentAvg)) * 100)));

  return (
    <Card
      className="border-0 hover:shadow-xl transition-all h-full group overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: sg.color }} />
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gray-50 group-hover:bg-gray-100 transition-colors">
              {sg.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {sg.subject}
              </h3>
              <p className="text-xs text-gray-500">{sg.totalGrades} ocena</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            sg.trend === 'up' ? 'bg-green-100 text-green-700' : 
            sg.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {sg.trend === "up" && <TrendingUp className="h-3 w-3" />}
            {sg.trend === "down" && <TrendingDown className="h-3 w-3" />}
            {sg.trend === "stable" && <span className="text-lg leading-3">−</span>}
            <span className="capitalize">{sg.trend === 'stable' ? 'Stabilno' : sg.trend === 'up' ? 'Raste' : 'Pada'}</span>
          </div>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Prosek</p>
            <p className="text-4xl font-bold text-gray-900 tracking-tight">
              {sg.average || 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Zadnja</p>
            <span className={`text-xl font-bold ${
              (sg.lastGrade || 0) >= 4 ? 'text-green-600' : (sg.lastGrade || 0) >= 3 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {sg.lastGrade || 0}
            </span>
          </div>
        </div>

        {/* Goal Progress */}
        {currentAvg < 5 && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Do ocene {nextGrade}</span>
              <span>{Math.round(progressToNext)}%</span>
            </div>
            <Progress value={progressToNext} className="h-1.5" />
          </div>
        )}

        {/* Grade bars */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Istorija ocena</span>
            <span>Novije &rarr;</span>
          </div>
          <div className="flex gap-1 h-8 items-end">
            {sg.grades.slice(-8).map((g: number, i: number) => (
              <div
                key={`${sg.subject}-grade-${i}`}
                className="flex-1 rounded-sm flex items-center justify-center text-[10px] font-bold text-white transition-all hover:opacity-100 hover:scale-110"
                style={{
                  backgroundColor: sg.color,
                  opacity: 0.6 + (g / 5) * 0.4,
                  height: `${(g / 5) * 100}%`,
                  minHeight: '20%'
                }}
                title={`Ocena: ${g}`}
              >
                {g}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

