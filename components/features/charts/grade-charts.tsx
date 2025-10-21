/**
 * Lazy-loaded Grade Charts
 * Optimizovano za bundle size - recharts se učitava samo kada je potreban
 */

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface GradeDistributionChartProps {
  data: Array<{
    name: string;
    count: number;
  }>;
}

export function GradeDistributionChart({ data }: GradeDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            border: "none",
            borderRadius: "8px",
            color: "white",
          }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface SubjectRadarChartProps {
  data: Array<{
    subject: string;
    average: number;
  }>;
}

export function SubjectRadarChart({ data }: SubjectRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#64748b" opacity={0.3} />
        <PolarAngleAxis
          dataKey="subject"
          stroke="#64748b"
          fontSize={12}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          stroke="#64748b"
          fontSize={10}
        />
        <Radar
          name="Prosek"
          dataKey="average"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.5}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            border: "none",
            borderRadius: "8px",
            color: "white",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
