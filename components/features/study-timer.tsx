/**
 * Study Timer - Pomodoro Timer za Učenje
 *
 * Pomoć za fokusirano učenje:
 * - Pomodoro tehnika (25/5 minuta)
 * - Praćenje vremena učenja
 * - XP nagrade za završene sesije
 * - Vizualni feedback
 */

"use client";

import {
  Book,
  Clock,
  Coffee,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StudyTimerProps {
  subjectName?: string;
  subjectColor?: string;
  onSessionComplete?: (duration: number, xpEarned: number) => void;
  className?: string;
}

type TimerMode = "study" | "shortBreak" | "longBreak";

interface TimerSettings {
  studyDuration: number; // u minutima
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  studyDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

// XP nagrade
const XP_REWARDS = {
  SESSION_COMPLETE: 15,
  LONG_BREAK_BONUS: 25,
  STREAK_BONUS: 5, // za svaku uzastopnu sesiju
};

// Zvučne notifikacije
function playNotification(type: "complete" | "break") {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;

  try {
    const audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === "complete") {
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
    } else {
      oscillator.frequency.value = 600;
      oscillator.type = "triangle";
    }

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.5,
    );

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch {
    // Ignore audio errors
  }
}

export function StudyTimer({
  subjectName,
  subjectColor = "#3b82f6",
  onSessionComplete,
  className,
}: StudyTimerProps) {
  const [settings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<TimerMode>("study");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.studyDuration * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todayXP, setTodayXP] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Izračunaj ukupno trajanje za trenutni mod
  const getTotalDuration = useCallback(() => {
    switch (mode) {
      case "study":
        return settings.studyDuration * 60;
      case "shortBreak":
        return settings.shortBreakDuration * 60;
      case "longBreak":
        return settings.longBreakDuration * 60;
    }
  }, [mode, settings]);

  // Formatiraj vrijeme
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress postotak
  const progress = ((getTotalDuration() - timeLeft) / getTotalDuration()) * 100;

  // Obradi završetak sesije
  const handleSessionComplete = useCallback(() => {
    if (soundEnabled) playNotification(mode === "study" ? "complete" : "break");

    if (mode === "study") {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      setTodayMinutes((prev) => prev + settings.studyDuration);

      // XP nagrada
      let xp = XP_REWARDS.SESSION_COMPLETE;
      if (newSessionsCompleted % settings.sessionsUntilLongBreak === 0) {
        xp += XP_REWARDS.LONG_BREAK_BONUS;
      }
      xp += Math.min(sessionsCompleted, 5) * XP_REWARDS.STREAK_BONUS;

      setTodayXP((prev) => prev + xp);
      onSessionComplete?.(settings.studyDuration, xp);

      // Prebaci na pauzu
      const isLongBreak =
        newSessionsCompleted % settings.sessionsUntilLongBreak === 0;
      setMode(isLongBreak ? "longBreak" : "shortBreak");
      setTimeLeft(
        isLongBreak
          ? settings.longBreakDuration * 60
          : settings.shortBreakDuration * 60,
      );
    } else {
      // Završena pauza - nazad na učenje
      setMode("study");
      setTimeLeft(settings.studyDuration * 60);
    }

    setIsRunning(false);
  }, [mode, sessionsCompleted, settings, soundEnabled, onSessionComplete]);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleSessionComplete]);

  // Toggle play/pause
  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getTotalDuration());
  };

  // Promijeni mod
  const changeMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    switch (newMode) {
      case "study":
        setTimeLeft(settings.studyDuration * 60);
        break;
      case "shortBreak":
        setTimeLeft(settings.shortBreakDuration * 60);
        break;
      case "longBreak":
        setTimeLeft(settings.longBreakDuration * 60);
        break;
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case "study":
        return subjectColor;
      case "shortBreak":
        return "#22c55e";
      case "longBreak":
        return "#8b5cf6";
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case "study":
        return subjectName || "Vrijeme za učenje";
      case "shortBreak":
        return "Kratka pauza";
      case "longBreak":
        return "Duga pauza";
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "study":
        return <Book className="w-5 h-5" />;
      case "shortBreak":
        return <Coffee className="w-5 h-5" />;
      case "longBreak":
        return <Coffee className="w-5 h-5" />;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3" style={{ backgroundColor: getModeColor() }}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">{getModeIcon()}</div>
            <div>
              <CardTitle className="text-base font-semibold">
                Study Timer
              </CardTitle>
              <p className="text-xs text-white/80">{getModeLabel()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-6">
          {[
            { mode: "study" as const, label: "Učenje", icon: Book },
            { mode: "shortBreak" as const, label: "Kratka", icon: Coffee },
            { mode: "longBreak" as const, label: "Duga", icon: Coffee },
          ].map(({ mode: m, label, icon: Icon }) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              className={cn("flex-1", mode === m && "ring-2 ring-offset-2")}
              style={mode === m ? { backgroundColor: getModeColor() } : {}}
              onClick={() => changeMode(m)}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="relative flex flex-col items-center mb-6">
          {/* Circular Progress */}
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke={getModeColor()}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 553} 553`}
                className="transition-all duration-1000"
              />
            </svg>

            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-gray-800 tabular-nums">
                {formatTime(timeLeft)}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                {isRunning ? "U toku..." : "Pauzirano"}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mb-6">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={resetTimer}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            className="h-16 w-16 rounded-full"
            style={{ backgroundColor: getModeColor() }}
            onClick={toggleTimer}
          >
            {isRunning ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full opacity-0 pointer-events-none"
          >
            {/* Placeholder for symmetry */}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <span className="block text-2xl font-bold text-gray-800">
              {sessionsCompleted}
            </span>
            <span className="text-xs text-gray-500">Sesija</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <span className="block text-2xl font-bold text-gray-800">
              {todayMinutes}
            </span>
            <span className="text-xs text-gray-500">Minuta</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="block text-2xl font-bold text-gray-800">
              {todayXP}
            </span>
            <span className="text-xs text-gray-500">XP</span>
          </div>
        </div>

        {/* Sessions Progress */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Do duge pauze</span>
            <span>
              {sessionsCompleted % settings.sessionsUntilLongBreak}/
              {settings.sessionsUntilLongBreak}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: settings.sessionsUntilLongBreak }).map(
              (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-2 rounded-full transition-colors",
                    i < sessionsCompleted % settings.sessionsUntilLongBreak
                      ? "bg-green-500"
                      : "bg-gray-200",
                  )}
                />
              ),
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
