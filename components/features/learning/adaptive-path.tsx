/**
 * Adaptive Learning Path Component
 * Prikazuje personalizovane preporuke za učenje
 */

"use client";

import {
  BookOpen,
  Clock,
  Lightbulb,
  Loader,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface AdaptivePathProps {
  studentId: string;
}

export function AdaptivePath({ studentId }: AdaptivePathProps) {
  const [recommendations, setRecommendations] = useState<
    LearningRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{
    strengths: string[];
    weaknesses: string[];
    learningStyle: string;
    optimalStudyTime: string;
  } | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [studentId]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/learning/recommendations?studentId=${studentId}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to load recommendations");
      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setProfile(data.profile || null);
    } catch (error) {
      console.error("Error loading recommendations", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "homework":
        return <BookOpen className="h-4 w-4" />;
      case "study_material":
        return <Target className="h-4 w-4" />;
      case "practice":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Learning Profile Summary */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tvoj Learning Profil
            </CardTitle>
            <CardDescription>
              AI je analizirao tvoje performanse i prilagodio preporuke
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.strengths.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-2">
                  💪 Tvoje snage:
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.strengths.map((subject) => (
                    <Badge
                      key={subject}
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.weaknesses.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-700 mb-2">
                  📚 Gde treba više vežbe:
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.weaknesses.map((subject) => (
                    <Badge
                      key={subject}
                      variant="outline"
                      className="bg-orange-50 text-orange-700"
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="text-sm text-gray-600">
              <p>
                <strong>Najbolje vreme za učenje:</strong>{" "}
                {profile.optimalStudyTime}
              </p>
              <p>
                <strong>Način učenja:</strong>{" "}
                {profile.learningStyle === "visual"
                  ? "Vizuelno"
                  : profile.learningStyle === "auditory"
                    ? "Auditivno"
                    : "Kinestetički"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Preporučeni Redosled za Danas
          </CardTitle>
          <CardDescription>
            AI je analizirao tvoje zadatke i predložio optimalan redosled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nema preporuka trenutno.</p>
              <p className="text-sm mt-2">Svi zadaci su završeni! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    "border-l-4",
                    rec.priority === "high" && "border-l-red-500",
                    rec.priority === "medium" && "border-l-yellow-500",
                    rec.priority === "low" && "border-l-blue-500",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeIcon(rec.type)}
                            <h4 className="font-semibold truncate">
                              {rec.title}
                            </h4>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority === "high"
                                ? "Visok"
                                : rec.priority === "medium"
                                  ? "Srednji"
                                  : "Nizak"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rec.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />~{rec.estimatedTime}{" "}
                              min
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {rec.subject}
                            </Badge>
                          </div>
                          <p className="text-xs text-blue-600 mt-2 italic">
                            💡 {rec.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
