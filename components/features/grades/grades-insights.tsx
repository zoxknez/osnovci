/**
 * Grades Insights Component
 * AI-powered insights and suggestions for improving grades
 */

"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Insight {
  subject: string;
  currentAvg: number;
  suggestion: string;
}

interface GradesInsightsProps {
  insights: Insight[];
}

export function GradesInsights({ insights }: GradesInsightsProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 mb-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="h-6 w-6 text-indigo-600" />
        <h3 className="text-lg font-bold text-indigo-900">Pametni Saveti</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {insights.map((insight, i) => (
          <Card key={i} className="bg-white/80 backdrop-blur border-indigo-100">
            <CardContent className="p-4">
              <h4 className="font-bold text-gray-900 mb-1">
                {insight.subject}
              </h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Trenutno:</span>
                <span className="font-bold text-indigo-600">
                  {insight.currentAvg}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-snug font-medium">
                {insight.suggestion}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
