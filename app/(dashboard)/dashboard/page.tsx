// Dashboard "Danas" ekran - glavni pregled
"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/features/page-header";
import { staggerContainer, staggerItem } from "@/lib/animations/variants";

export default function DashboardPage() {
  // Mock data - ovo će kasnije biti real data iz baze

  // Gamification data
  const studentName = "Marko"; // TODO: Get from session
  const currentStreak = 5; // Uzastopni dani sa urađenim domaćim
  const xp = 450; // Experience points
  const level = 3; // Level (based on XP)
  const nextLevelXP = 500; // XP needed for next level
  const xpProgress = (xp / nextLevelXP) * 100;

  const todayClasses = [
    {
      time: "08:00 - 08:45",
      subject: "Matematika",
      room: "Učionica 12",
      status: "done",
    },
    {
      time: "08:50 - 09:35",
      subject: "Srpski",
      room: "Učionica 8",
      status: "done",
    },
    {
      time: "09:55 - 10:40",
      subject: "Engleski",
      room: "Učionica 15",
      status: "current",
    },
    {
      time: "10:45 - 11:30",
      subject: "Fizičko",
      room: "Sala",
      status: "upcoming",
    },
    {
      time: "11:35 - 12:20",
      subject: "Istorija",
      room: "Učionica 8",
      status: "upcoming",
    },
  ];

  const homework = [
    {
      id: 1,
      subject: "Matematika",
      title: "Zadaci sa strane 45",
      dueDate: "Danas",
      status: "done",
      priority: "normal",
    },
    {
      id: 2,
      subject: "Srpski",
      title: "Sastav: Moj omiljeni pisac",
      dueDate: "Sutra",
      status: "in_progress",
      priority: "important",
    },
    {
      id: 3,
      subject: "Engleski",
      title: "Unit 3 - vežbe",
      dueDate: "Za 2 dana",
      status: "assigned",
      priority: "urgent",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Header sa gamification */}
      <PageHeader
        title={`Dobar dan, ${studentName}! 👋`}
        variant="gradient"
        badge="Današnjih napredaka"
        action={
          /* Level & XP Card */
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl p-6 shadow-lg min-w-[240px] self-start"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                <span className="font-bold text-lg">Level {level}</span>
              </div>
              <span className="text-sm opacity-90 font-semibold">{xp} XP</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden mb-2">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            <p className="text-xs opacity-90">
              {nextLevelXP - xp} XP do Level {level + 1}
            </p>
          </motion.div>
        }
      />

      {/* Streak & Motivation Banner */}
      {currentStreak >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              className="text-5xl"
            >
              🔥
            </motion.div>
            <div className="flex-1">
              <div className="font-bold text-2xl mb-1">
                {currentStreak} dana u nizu!
              </div>
              <p className="text-white/90">
                Super ti ide! Nastavi ovako i otključaj "Nepokolebljivi" bedž!
                🏆
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{currentStreak}</div>
              <div className="text-sm opacity-90">Streak</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Stats sa animacijama */}
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <Link href="/dashboard/raspored">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Današnjih časova
                    </p>
                    <motion.p
                      className="text-4xl font-bold text-blue-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                    >
                      5
                    </motion.p>
                  </div>
                  <motion.div
                    className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Calendar
                      className="h-7 w-7 text-white"
                      aria-hidden="true"
                    />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Link href="/dashboard/domaci">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Aktivnih zadataka
                    </p>
                    <motion.p
                      className="text-4xl font-bold text-purple-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.3 }}
                    >
                      3
                    </motion.p>
                  </div>
                  <motion.div
                    className="h-14 w-14 rounded-full bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: -360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <BookOpen
                      className="h-7 w-7 text-white"
                      aria-hidden="true"
                    />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Završeno danas
                  </p>
                  <motion.p
                    className="text-4xl font-bold text-green-900"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.4 }}
                  >
                    1
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-xs text-green-700 mt-1 flex items-center gap-1"
                  >
                    <Zap className="h-3 w-3" />
                    +10 XP zarada danas
                  </motion.p>
                </div>
                <motion.div
                  className="h-14 w-14 rounded-full bg-green-600 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle2
                    className="h-7 w-7 text-white"
                    aria-hidden="true"
                  />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid gap-8 lg:grid-cols-2"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Raspored danas */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock
                      className="h-5 w-5 text-blue-600"
                      aria-hidden="true"
                    />
                    Raspored danas
                  </CardTitle>
                  <CardDescription>Tvoji časovi za danas</CardDescription>
                </div>
                <Link href="/dashboard/raspored">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Idi na pun raspored"
                  >
                    Vidi sve →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3" aria-label="Današnji časovi">
                {todayClasses.map((classItem, index) => (
                  <motion.li
                    key={`class-${classItem.subject}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      classItem.status === "current"
                        ? "bg-blue-50 border-2 border-blue-500 shadow-md"
                        : classItem.status === "done"
                          ? "bg-gray-50 opacity-60"
                          : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${
                        classItem.status === "current"
                          ? "bg-blue-600 text-white"
                          : classItem.status === "done"
                            ? "bg-gray-300 text-gray-600"
                            : "bg-gray-100 text-gray-700"
                      }`}
                      role="img"
                      aria-label={`Čas u ${classItem.time.split(" - ")[0]}`}
                    >
                      {classItem.time.split(" - ")[0]}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {classItem.subject}
                      </h4>
                      <p className="text-sm text-gray-600">{classItem.room}</p>
                    </div>

                    {classItem.status === "current" && (
                      <motion.span
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1"
                      >
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          🔴
                        </motion.span>
                        Trenutno
                      </motion.span>
                    )}
                    {classItem.status === "done" && (
                      <CheckCircle2
                        className="h-5 w-5 text-green-600"
                        aria-label="Završeno"
                      />
                    )}
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Domaći zadaci */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen
                      className="h-5 w-5 text-purple-600"
                      aria-hidden="true"
                    />
                    Domaći zadaci
                  </CardTitle>
                  <CardDescription>Aktivni zadaci i rokovi</CardDescription>
                </div>
                <Link href="/dashboard/domaci">
                  <Button
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    aria-label="Dodaj novi domaći zadatak"
                  >
                    Dodaj
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3" aria-label="Skoriji domaći zadaci">
                {homework.map((task, idx) => (
                  <li key={task.id}>
                    <Link href="/dashboard/domaci">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer group"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center text-xl ${
                            task.priority === "urgent"
                              ? "bg-red-100"
                              : task.priority === "important"
                                ? "bg-orange-100"
                                : "bg-blue-100"
                          }`}
                          aria-hidden="true"
                        >
                          {task.status === "done" ? "✅" : "📝"}
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1 gap-2">
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {task.title}
                            </h4>
                            {task.priority === "urgent" && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <AlertCircle
                                  className="h-5 w-5 text-red-600"
                                  aria-label="Hitno"
                                />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {task.subject}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                task.status === "done"
                                  ? "bg-green-100 text-green-700"
                                  : task.status === "in_progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {task.status === "done"
                                ? "Urađeno"
                                : task.status === "in_progress"
                                  ? "Radim"
                                  : "Novo"}
                            </span>
                            <span className="text-xs text-gray-500">
                              • {task.dueDate}
                            </span>
                            {task.status === "done" && (
                              <span className="text-xs text-green-600 font-medium">
                                +10 XP
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
