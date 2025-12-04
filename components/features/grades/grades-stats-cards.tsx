/**
 * Grades Stats Cards Component
 * Key statistics display cards for grades
 */

"use client";

import { motion } from "framer-motion";
import { Award, Calendar, Star, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { staggerItem } from "@/lib/animations/variants";

interface GradesStatsCardsProps {
  stats: {
    average: number;
    total: number;
    byCategory: Record<string, number>;
  };
  grades: Array<{ grade: string | number }>;
  bestSubject: string;
}

export function GradesStatsCards({ stats, grades, bestSubject }: GradesStatsCardsProps) {
  return (
    <>
      {/* Overall Average */}
      <motion.div variants={staggerItem}>
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1 font-medium">Opšti prosek</p>
                <p className="text-4xl font-bold text-white">
                  {stats.average.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Star className="h-6 w-6 text-white" fill="currentColor" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={(stats.average / 5) * 100} className="h-2 bg-blue-800/30" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total Grades */}
      <motion.div variants={staggerItem}>
        <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1 font-medium">Ukupne ocene</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex gap-1">
              {/* Mini histogram visual */}
              {[5, 4, 3, 2, 1].map(g => {
                const count = grades.filter((x) => parseInt(String(x.grade)) === g).length;
                const height = Math.max(4, Math.min(24, count * 2));
                return (
                  <div key={g} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-gray-100 rounded-t-sm relative group">
                      <div 
                        className={`w-full rounded-t-sm ${
                          g === 5 ? 'bg-green-500' : g === 4 ? 'bg-blue-500' : g === 3 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                        style={{ height: `${height}px` }} 
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{g}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Best Subject */}
      <motion.div variants={staggerItem}>
        <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1 font-medium">
                  Najbolji predmet
                </p>
                <p className="text-xl font-bold text-purple-600 truncate max-w-[140px]">
                  {bestSubject || "N/A"}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full inline-block">
              Top rezultat! 🏆
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Categories Count */}
      <motion.div variants={staggerItem}>
        <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1 font-medium">Kategorije</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Object.keys(stats.byCategory).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Raznovrsnost ocena
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

