/**
 * Smart Parental Alerts Component
 * Prikazuje automatska upozorenja za roditelje
 */

"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "grade_drop" | "homework_backlog" | "study_time" | "behavior_change" | "achievement";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details: Record<string, any>;
  recommendations: string[];
  timestamp: Date;
}

interface SmartAlertsProps {
  studentId: string;
  guardianId: string;
}

export function SmartAlerts({ studentId, guardianId: _guardianId }: SmartAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [studentId]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/parental/alerts?studentId=${studentId}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to load alerts");
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Error loading alerts", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 border-red-300 text-red-900";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-900";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-900";
      case "low":
        return "bg-blue-100 border-blue-300 text-blue-900";
      default:
        return "bg-gray-100 border-gray-300 text-gray-900";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "grade_drop":
        return <TrendingDown className="h-5 w-5" />;
      case "homework_backlog":
        return <BookOpen className="h-5 w-5" />;
      case "study_time":
        return <Clock className="h-5 w-5" />;
      case "achievement":
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "grade_drop":
        return "Pad ocena";
      case "homework_backlog":
        return "Gomilanje zadataka";
      case "study_time":
        return "Vreme učenja";
      case "achievement":
        return "Postignuće";
      default:
        return "Obaveštenje";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            Učitavanje upozorenja...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Sve je u redu! ✅</p>
            <p className="text-sm text-gray-600 mt-2">
              Nema upozorenja trenutno. Dete ide odlično!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={cn("border-l-4", getSeverityColor(alert.severity))}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getTypeIcon(alert.type)}
                <div>
                  <CardTitle className="text-lg">{getTypeLabel(alert.type)}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(alert.timestamp).toLocaleDateString("sr-RS", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  alert.severity === "critical" && "bg-red-500",
                  alert.severity === "high" && "bg-orange-500",
                  alert.severity === "medium" && "bg-yellow-500",
                  alert.severity === "low" && "bg-blue-500"
                )}
              >
                {alert.severity === "critical" ? "Kritično" :
                 alert.severity === "high" ? "Visoko" :
                 alert.severity === "medium" ? "Srednje" : "Nisko"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium">{alert.message}</p>

            {/* Details */}
            {Object.keys(alert.details).length > 0 && (
              <div className="bg-white/50 rounded-lg p-3 text-sm">
                <p className="font-medium mb-2">Detalji:</p>
                <ul className="space-y-1">
                  {Object.entries(alert.details).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {alert.recommendations.length > 0 && (
              <div>
                <p className="font-medium mb-2">Preporuke:</p>
                <ul className="space-y-2">
                  {alert.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

