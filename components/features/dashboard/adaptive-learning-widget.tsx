/**
 * Adaptive Learning Widget
 * Kompaktan widget za glavni dashboard sa preporukama
 */

"use client";

import { useState, useEffect } from "react";
import { BookOpen, TrendingUp, Clock, ArrowRight, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LearningRecommendation {
  type: "homework" | "study_material" | "practice" | "break";
  priority: "high" | "medium" | "low";
  subject: string;
  title: string;
  description: string;
  estimatedTime: number;
  reason: string;
}

interface AdaptiveLearningWidgetProps {
  studentId: string;
  compact?: boolean;
}

export function AdaptiveLearningWidget({
  studentId,
  compact = false,
}: AdaptiveLearningWidgetProps) {
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{
    strengths: string[];
    weaknesses: string[];
  } | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [studentId]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/learning/recommendations?studentId=${studentId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load recommendations");
      const data = await response.json();
      setRecommendations((data.recommendations || []).slice(0, compact ? 3 : 5));
      setProfile(data.profile || null);
    } catch (error) {
      console.error("Error loading recommendations", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Preporuke za učenje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-2">🎉 Odličan posao!</p>
            <p className="text-sm">Svi zadaci su završeni. Nema preporuka trenutno.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topRecommendation = recommendations[0]!;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            AI Preporuke za Danas
          </CardTitle>
          {!compact && (
            <Link href="/dashboard/learning">
              <Button variant="ghost" size="sm">
                Vidi sve
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Recommendation */}
        <div
          className={cn(
            "p-4 rounded-lg border-2",
            topRecommendation.priority === "high"
              ? "border-red-200 bg-red-50"
              : topRecommendation.priority === "medium"
                ? "border-yellow-200 bg-yellow-50"
                : "border-blue-200 bg-blue-50"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  className={cn(
                    topRecommendation.priority === "high"
                      ? "bg-red-500"
                      : topRecommendation.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                  )}
                >
                  {topRecommendation.priority === "high" ? "Visok prioritet" :
                   topRecommendation.priority === "medium" ? "Srednji prioritet" : "Nizak prioritet"}
                </Badge>
                <Badge variant="outline">{topRecommendation.subject}</Badge>
              </div>
              <h4 className="font-semibold mb-1">{topRecommendation.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{topRecommendation.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{topRecommendation.estimatedTime} min
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-2 italic">
                💡 {topRecommendation.reason}
              </p>
            </div>
          </div>
        </div>

        {/* Other Recommendations */}
        {!compact && recommendations.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Ostale preporuke:</p>
            {recommendations.slice(1).map((rec, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">
                        {idx + 2}.
                      </span>
                      <span className="font-medium text-sm">{rec.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {rec.subject}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{rec.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {rec.estimatedTime}min
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Summary */}
        {profile && !compact && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {profile.strengths.length > 0 && (
                <div>
                  <p className="font-medium text-green-700 mb-1">💪 Tvoje snage:</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.strengths.slice(0, 3).map((subject) => (
                      <Badge key={subject} variant="outline" className="bg-green-50 text-green-700 text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.weaknesses.length > 0 && (
                <div>
                  <p className="font-medium text-orange-700 mb-1">📚 Za vežbu:</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.weaknesses.slice(0, 3).map((subject) => (
                      <Badge key={subject} variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

