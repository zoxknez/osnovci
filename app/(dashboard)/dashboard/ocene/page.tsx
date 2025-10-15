// Ocene & Analytics - Ultra-Modern Dashboard
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Star,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations/variants";

// Mock data - TODO: Replace with real API
const MOCK_GRADES = [
  {
    subject: "Matematika",
    color: "#3b82f6",
    icon: "📐",
    grades: [5, 4, 5, 5, 4],
    average: 4.6,
    trend: "up",
    lastGrade: 5,
    totalGrades: 5,
  },
  {
    subject: "Srpski jezik",
    color: "#ef4444",
    icon: "📖",
    grades: [5, 5, 4, 5, 5],
    average: 4.8,
    trend: "up",
    lastGrade: 5,
    totalGrades: 5,
  },
  {
    subject: "Engleski jezik",
    color: "#10b981",
    icon: "🇬🇧",
    grades: [5, 5, 5, 4, 5],
    average: 4.8,
    trend: "down",
    lastGrade: 4,
    totalGrades: 5,
  },
  {
    subject: "Fizika",
    color: "#6366f1",
    icon: "⚛️",
    grades: [4, 4, 5, 4, 5],
    average: 4.4,
    trend: "up",
    lastGrade: 5,
    totalGrades: 5,
  },
  {
    subject: "Hemija",
    color: "#ec4899",
    icon: "🧪",
    grades: [5, 4, 4, 5, 5],
    average: 4.6,
    trend: "stable",
    lastGrade: 5,
    totalGrades: 5,
  },
  {
    subject: "Istorija",
    color: "#8b5cf6",
    icon: "🏛️",
    grades: [5, 5, 5, 5, 4],
    average: 4.8,
    trend: "down",
    lastGrade: 4,
    totalGrades: 5,
  },
];

// Data for trend chart
const trendData = [
  { month: "Sep", average: 4.2 },
  { month: "Okt", average: 4.4 },
  { month: "Nov", average: 4.5 },
  { month: "Dec", average: 4.6 },
  { month: "Jan", average: 4.7 },
];

// Data for radar chart (skills)
const radarData = MOCK_GRADES.map((g) => ({
  subject: g.subject.split(" ")[0],
  score: g.average,
  fullMark: 5,
}));

// Data for bar chart (grade distribution)
const gradeDistribution = [
  { grade: "5", count: 18 },
  { grade: "4", count: 10 },
  { grade: "3", count: 2 },
  { grade: "2", count: 0 },
  { grade: "1", count: 0 },
];

export default function OcenePage() {
  type Period = "month" | "semester" | "year";
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("semester");

  // Calculate overall stats
  const totalAverage = (
    MOCK_GRADES.reduce((acc, g) => acc + g.average, 0) / MOCK_GRADES.length
  ).toFixed(2);
  const excellentCount = MOCK_GRADES.filter((g) => g.average >= 4.5).length;
  const totalGradesCount = MOCK_GRADES.reduce(
    (acc, g) => acc + g.totalGrades,
    0,
  );
  const fiveCount = gradeDistribution.find((g) => g.grade === "5")?.count || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            📊 Ocene & Analitika
          </h1>
          <p className="text-gray-600 mt-1">Prati svoj napredak i postignuća</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            aria-label="Filtriraj ocene po predmetu ili periodu"
          >
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            aria-label="Preuzmi izveštaj o ocenama u PDF formatu"
          >
            Izvoz
          </Button>
        </div>
      </motion.div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {["month", "semester", "year"].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod(period as Period)}
            aria-label={`Prikaži ocene za ${period === "month" ? "ovaj mesec" : period === "semester" ? "ovo polugodiște" : "ovu godinu"}`}
            aria-pressed={selectedPeriod === period}
          >
            {period === "month"
              ? "Mesec"
              : period === "semester"
                ? "Polugodiște"
                : "Godina"}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Prosek</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {totalAverage}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+0.3 od prošlog meseca</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Odličnih</p>
                  <p className="text-3xl font-bold text-green-600">
                    {excellentCount}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                od {MOCK_GRADES.length} predmeta
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Petica</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {fiveCount}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                {((fiveCount / totalGradesCount) * 100).toFixed(0)}% svih ocena
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ukupno ocena</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {totalGradesCount}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">U ovom periodu</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Trend proseka
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[3, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Prosek"
                    dot={{ fill: "#3b82f6", r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Skills Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Profil znanja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 5]} />
                  <Radar
                    name="Ocene"
                    dataKey="score"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grade Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Distribucija ocena
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  name="Broj ocena"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subject Cards */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {MOCK_GRADES.map((subject, idx) => (
          <motion.div key={subject.subject} variants={staggerItem}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2" style={{ backgroundColor: subject.color }} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{subject.icon}</span>
                      <h3 className="font-semibold text-gray-900">
                        {subject.subject}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {subject.totalGrades} ocena
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: subject.color }}
                    >
                      {subject.average.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {subject.trend === "up" && (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Raste</span>
                        </>
                      )}
                      {subject.trend === "down" && (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          <span className="text-red-600">Pada</span>
                        </>
                      )}
                      {subject.trend === "stable" && (
                        <span className="text-gray-600">Stabilno</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grades */}
                <div className="flex gap-2 flex-wrap">
                  {subject.grades.map((grade, gIdx) => (
                    <motion.div
                      key={gIdx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.1 + gIdx * 0.05 }}
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        font-bold text-white text-lg
                        ${grade === 5 ? "bg-green-500" : grade === 4 ? "bg-blue-500" : "bg-gray-500"}
                      `}
                    >
                      {grade}
                    </motion.div>
                  ))}
                </div>

                {/* Last Grade Highlight */}
                {subject.lastGrade === 5 && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                    <Star className="h-4 w-4" />
                    Poslednja ocena: odlična!
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Dostignuća
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <div className="text-4xl">🥇</div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Odličan učenik
                  </div>
                  <div className="text-sm text-gray-600">Prosek preko 4.5</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="text-4xl">📚</div>
                <div>
                  <div className="font-semibold text-gray-900">Vredan</div>
                  <div className="text-sm text-gray-600">30+ ocena</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="text-4xl">⚡</div>
                <div>
                  <div className="font-semibold text-gray-900">Trend</div>
                  <div className="text-sm text-gray-600">
                    Konstantan napredak
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
