/**
 * Performance Metrics Dashboard
 * 
 * Displays real-time performance metrics:
 * - Web Vitals scores
 * - API response times
 * - Database query stats
 * - Cache hit rates
 * - Error rates
 */

"use client";

import { useEffect, useState } from "react";
import { getApiStats } from "@/lib/performance/monitor";
import { getMetrics } from "@/lib/monitoring/rum";
import { Activity, Database, Gauge, TrendingUp, Zap } from "lucide-react";

interface MetricCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: "up" | "down" | "neutral";
}

export function PerformanceMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const apiStats = getApiStats();
      const rumMetrics = getMetrics();

      // Web Vitals
      const lcp = rumMetrics.find((m) => m.name === "web_vital_lcp");
      const fid = rumMetrics.find((m) => m.name === "web_vital_fid");
      const cls = rumMetrics.find((m) => m.name === "web_vital_cls");

      const newMetrics: MetricCard[] = [
        {
          title: "Avg API Response",
          value: `${apiStats.averageDuration}ms`,
          icon: <Zap className="h-5 w-5" />,
          color: apiStats.averageDuration < 500 ? "text-green-600" : "text-yellow-600",
          trend: "neutral",
        },
        {
          title: "Total API Calls",
          value: apiStats.totalCalls,
          icon: <Activity className="h-5 w-5" />,
          color: "text-blue-600",
          trend: "up",
        },
        {
          title: "LCP Score",
          value: lcp ? `${Math.round(Number(lcp.value))}ms` : "N/A",
          icon: <Gauge className="h-5 w-5" />,
          color: "text-purple-600",
          trend: "neutral",
        },
        {
          title: "FID Score",
          value: fid ? `${Math.round(Number(fid.value))}ms` : "N/A",
          icon: <TrendingUp className="h-5 w-5" />,
          color: "text-indigo-600",
          trend: "neutral",
        },
        {
          title: "CLS Score",
          value: cls ? Number(cls.value).toFixed(3) : "N/A",
          icon: <Database className="h-5 w-5" />,
          color: "text-pink-600",
          trend: "neutral",
        },
      ];

      setMetrics(newMetrics);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load metrics:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between">
            <div className={`${metric.color}`}>{metric.icon}</div>
            {metric.trend && (
              <span
                className={`text-xs ${
                  metric.trend === "up"
                    ? "text-green-600"
                    : metric.trend === "down"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→"}
              </span>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {metric.title}
            </h3>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metric.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
