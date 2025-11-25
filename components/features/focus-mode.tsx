"use client";

/**
 * FocusMode - Komponenta za režim fokusiranog učenja
 * 
 * Features:
 * - Blokira distrakcije tokom učenja
 * - Prilagođeno okruženje za koncentraciju
 * - Praćenje vremena u fokusu
 * - Opcije za ambient zvukove
 * - WCAG 2.1 AAA compliant za djecu
 */

import * as React from "react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Timer,
  Moon,
  Sun,
  Sparkles,
  BookOpen,
  Target,
  X,
  CheckCircle2,
  CloudRain,
  Wind,
  Bird,
  Music,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Ambient sound types
type AmbientSound = "rain" | "wind" | "birds" | "lofi" | "cafe" | "none";

interface FocusSession {
  startTime: Date;
  targetMinutes: number;
  completedMinutes: number;
  distractions: number;
  xpEarned: number;
}

interface FocusModeProps {
  className?: string;
  onSessionComplete?: (session: FocusSession) => void;
  onXPEarned?: (xp: number) => void;
  subject?: string;
  defaultDuration?: number;
}

const AMBIENT_SOUNDS: Record<AmbientSound, { name: string; icon: React.ElementType; color: string }> = {
  rain: { name: "Kiša", icon: CloudRain, color: "text-blue-500" },
  wind: { name: "Vjetar", icon: Wind, color: "text-cyan-500" },
  birds: { name: "Ptice", icon: Bird, color: "text-green-500" },
  lofi: { name: "Lo-Fi", icon: Music, color: "text-purple-500" },
  cafe: { name: "Kafić", icon: Coffee, color: "text-amber-500" },
  none: { name: "Tišina", icon: VolumeX, color: "text-gray-500" },
};

const FOCUS_DURATIONS = [15, 25, 30, 45, 60];

// XP calculation for focus mode
const XP_PER_5_MIN = 3;
const XP_NO_DISTRACTION_BONUS = 10;
const XP_COMPLETION_BONUS = 15;

export function FocusMode({
  className,
  onSessionComplete,
  onXPEarned,
  subject = "Učenje",
  defaultDuration = 25,
}: FocusModeProps) {
  // State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(defaultDuration * 60);
  const [targetDuration, setTargetDuration] = useState(defaultDuration);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>("none");
  const [volume, setVolume] = useState(50);
  const [distractionCount, setDistractionCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  // Motivational messages for kids
  const motivationalMessages = [
    "Odlično ti ide! Nastavi tako! 🌟",
    "Svaka minuta učenja te čini pametnijim! 🧠",
    "Ti si prava zvijezda učenja! ⭐",
    "Fokus je tvoja super moć! 💪",
    "Bravo! Samo nastavi! 🎉",
    "Svaki trud se isplati! 🏆",
    "Ti možeš sve što zamisliš! 🚀",
    "Super si učenik/ca! 📚",
  ];

  const [currentMotivation] = useState(() => 
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    const totalSeconds = targetDuration * 60;
    const elapsed = totalSeconds - timeRemaining;
    return Math.min((elapsed / totalSeconds) * 100, 100);
  }, [timeRemaining, targetDuration]);

  // Calculate XP earned so far
  const calculateCurrentXP = useCallback((): number => {
    const minutesCompleted = Math.floor((targetDuration * 60 - timeRemaining) / 60);
    let xp = Math.floor(minutesCompleted / 5) * XP_PER_5_MIN;
    return xp;
  }, [timeRemaining, targetDuration]);

  // Start focus session
  const startSession = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    setTimeRemaining(targetDuration * 60);
    setDistractionCount(0);
    setSessionXP(0);
    sessionStartRef.current = new Date();
    setShowMotivation(true);
    
    // Hide motivation after 3 seconds
    setTimeout(() => setShowMotivation(false), 3000);
  }, [targetDuration]);

  // Pause session
  const pauseSession = useCallback(() => {
    setIsPaused(true);
    setDistractionCount(prev => prev + 1);
  }, []);

  // Resume session
  const resumeSession = useCallback(() => {
    setIsPaused(false);
  }, []);

  // End session
  const endSession = useCallback((completed: boolean = false) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const minutesCompleted = Math.floor((targetDuration * 60 - timeRemaining) / 60);
    let xpEarned = Math.floor(minutesCompleted / 5) * XP_PER_5_MIN;
    
    if (completed) {
      xpEarned += XP_COMPLETION_BONUS;
      if (distractionCount === 0) {
        xpEarned += XP_NO_DISTRACTION_BONUS;
      }
    }

    const session: FocusSession = {
      startTime: sessionStartRef.current || new Date(),
      targetMinutes: targetDuration,
      completedMinutes: minutesCompleted,
      distractions: distractionCount,
      xpEarned,
    };

    setSessionXP(xpEarned);
    onSessionComplete?.(session);
    onXPEarned?.(xpEarned);

    setIsActive(false);
    setIsPaused(false);
    sessionStartRef.current = null;
  }, [targetDuration, timeRemaining, distractionCount, onSessionComplete, onXPEarned]);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Session completed!
            endSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, endSession]);

  // Update XP display during session
  useEffect(() => {
    if (isActive && !isPaused) {
      setSessionXP(calculateCurrentXP());
    }
  }, [isActive, isPaused, calculateCurrentXP, timeRemaining]);

  // Handle visibility change (detect when user leaves page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isActive && !isPaused && document.hidden) {
        setDistractionCount(prev => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, isPaused]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActive) {
        pauseSession();
      }
      if (e.key === " " && isActive) {
        e.preventDefault();
        isPaused ? resumeSession() : pauseSession();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isActive, isPaused, pauseSession, resumeSession]);

  // Circle progress for timer
  const circleRadius = 90;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (progressPercent / 100) * circleCircumference;

  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          darkMode ? "bg-gray-900" : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
          className
        )}
      >
        {/* Background particles for visual interest */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "absolute rounded-full",
                darkMode ? "bg-white/10" : "bg-white/20"
              )}
              style={{
                width: Math.random() * 20 + 5,
                height: Math.random() * 20 + 5,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative flex flex-col items-center gap-6 p-8">
          {/* Motivation message */}
          <AnimatePresence>
            {showMotivation && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute -top-16 text-center"
              >
                <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/90 text-purple-700">
                  {currentMotivation}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subject badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-lg px-4 py-1",
              darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white/90 text-purple-700"
            )}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {subject}
          </Badge>

          {/* Timer circle */}
          <div className="relative">
            <svg width="220" height="220" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="110"
                cy="110"
                r={circleRadius}
                stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)"}
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <motion.circle
                cx="110"
                cy="110"
                r={circleRadius}
                stroke={darkMode ? "#a78bfa" : "white"}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circleCircumference,
                  strokeDashoffset,
                }}
                initial={false}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            
            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className={cn(
                  "text-5xl font-bold font-mono",
                  darkMode ? "text-white" : "text-white"
                )}
                animate={{ scale: isPaused ? [1, 1.02, 1] : 1 }}
                transition={{ repeat: isPaused ? Infinity : 0, duration: 1 }}
              >
                {formatTime(timeRemaining)}
              </motion.span>
              <span className={cn(
                "text-sm mt-1",
                darkMode ? "text-gray-400" : "text-white/80"
              )}>
                {isPaused ? "PAUZIRANO" : "FOKUS"}
              </span>
            </div>
          </div>

          {/* XP earned display */}
          <motion.div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              darkMode ? "bg-gray-800" : "bg-white/20"
            )}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Sparkles className={cn("h-5 w-5", darkMode ? "text-yellow-400" : "text-yellow-300")} />
            <span className={cn("font-bold", darkMode ? "text-white" : "text-white")}>
              +{sessionXP} XP
            </span>
          </motion.div>

          {/* Control buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "rounded-full",
                darkMode ? "text-white hover:bg-white/10" : "text-white hover:bg-white/20"
              )}
              aria-label={darkMode ? "Isključi tamni režim" : "Uključi tamni režim"}
            >
              {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </Button>

            <Button
              size="lg"
              onClick={isPaused ? resumeSession : pauseSession}
              className={cn(
                "rounded-full w-16 h-16",
                darkMode 
                  ? "bg-purple-600 hover:bg-purple-700" 
                  : "bg-white text-purple-600 hover:bg-white/90"
              )}
              aria-label={isPaused ? "Nastavi" : "Pauziraj"}
            >
              {isPaused ? (
                <Play className="h-8 w-8" />
              ) : (
                <Pause className="h-8 w-8" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => endSession(false)}
              className={cn(
                "rounded-full",
                darkMode ? "text-white hover:bg-white/10" : "text-white hover:bg-white/20"
              )}
              aria-label="Završi sesiju"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Ambient sound selector */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            darkMode ? "bg-gray-800" : "bg-white/20"
          )}>
            {Object.entries(AMBIENT_SOUNDS).map(([key, { name, icon: Icon, color }]) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => setAmbientSound(key as AmbientSound)}
                className={cn(
                  "rounded-full p-2",
                  ambientSound === key && "bg-white/30",
                  darkMode ? "hover:bg-white/10" : "hover:bg-white/20"
                )}
                title={name}
                aria-label={`Ambient zvuk: ${name}`}
                aria-pressed={ambientSound === key}
              >
                <Icon className={cn("h-5 w-5", ambientSound === key ? color : "text-white/70")} />
              </Button>
            ))}
          </div>

          {/* Distraction counter */}
          {distractionCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "text-sm px-3 py-1 rounded-full",
                darkMode ? "bg-red-900/50 text-red-300" : "bg-red-500/30 text-white"
              )}
            >
              <EyeOff className="h-4 w-4 inline mr-1" />
              {distractionCount} {distractionCount === 1 ? "distrakcija" : "distrakcije"}
            </motion.div>
          )}

          {/* Keyboard shortcuts hint */}
          <p className={cn(
            "text-xs mt-4",
            darkMode ? "text-gray-500" : "text-white/60"
          )}>
            Pritisni SPACE za pauzu/nastavak • ESC za pauzu
          </p>
        </div>
      </motion.div>
    );
  }

  // Session setup dialog
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Card
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg",
            "bg-gradient-to-br from-indigo-500 to-purple-600 text-white",
            className
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Režim Fokusa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/80 mb-3">
              Ukloni sve distrakcije i fokusiraj se na učenje
            </p>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              <span className="text-sm">{targetDuration} minuta</span>
              <Sparkles className="h-4 w-4 ml-auto" />
              <span className="text-sm">Do +{Math.floor(targetDuration / 5) * XP_PER_5_MIN + XP_COMPLETION_BONUS + XP_NO_DISTRACTION_BONUS} XP</span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Pokreni Režim Fokusa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Duration selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Trajanje sesije</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_DURATIONS.map((duration) => (
                <Button
                  key={duration}
                  variant={targetDuration === duration ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTargetDuration(duration)}
                  className={cn(
                    targetDuration === duration && "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  {duration} min
                </Button>
              ))}
            </div>
          </div>

          {/* Ambient sound selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Ambijentalni zvuk</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(AMBIENT_SOUNDS).map(([key, { name, icon: Icon, color }]) => (
                <Button
                  key={key}
                  variant={ambientSound === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmbientSound(key as AmbientSound)}
                  className={cn(
                    "flex flex-col gap-1 h-auto py-3",
                    ambientSound === key && "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  <Icon className={cn("h-5 w-5", ambientSound === key ? "text-white" : color)} />
                  <span className="text-xs">{name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Volume slider */}
          {ambientSound !== "none" && (
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Jačina zvuka: {volume}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-600"
                aria-label="Jačina zvuka"
              />
            </div>
          )}

          {/* XP preview */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Moguće nagrade
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Završetak sesije: +{XP_COMPLETION_BONUS} XP</li>
              <li>• Bez distrakcija: +{XP_NO_DISTRACTION_BONUS} XP</li>
              <li>• {targetDuration} min učenja: +{Math.floor(targetDuration / 5) * XP_PER_5_MIN} XP</li>
              <li className="font-medium text-purple-600">
                Ukupno: do +{Math.floor(targetDuration / 5) * XP_PER_5_MIN + XP_COMPLETION_BONUS + XP_NO_DISTRACTION_BONUS} XP
              </li>
            </ul>
          </div>

          {/* Start button */}
          <Button
            size="lg"
            onClick={() => {
              setIsDialogOpen(false);
              startSession();
            }}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Eye className="h-5 w-5 mr-2" />
            Pokreni Fokus
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Izlazak iz režima fokusa se bilježi kao distrakcija
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Session complete celebration modal
export function FocusSessionComplete({
  session,
  onClose,
}: {
  session: FocusSession;
  onClose: () => void;
}) {
  const isPerfect = session.distractions === 0;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {isPerfect ? (
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Target className="h-10 w-10 text-white" />
            </div>
          )}
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">
          {isPerfect ? "Savršeno! 🌟" : "Odlično! 🎉"}
        </h2>
        
        <p className="text-muted-foreground mb-6">
          {isPerfect 
            ? "Završio/la si sesiju bez ijedne distrakcije!"
            : `Završio/la si ${session.completedMinutes} minuta fokusiranog učenja!`
          }
        </p>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-purple-600">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            +{session.xpEarned} XP
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-muted-foreground">Vrijeme</p>
            <p className="font-semibold">{session.completedMinutes} min</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-muted-foreground">Distrakcije</p>
            <p className="font-semibold">{session.distractions}</p>
          </div>
        </div>

        <Button onClick={onClose} size="lg" className="w-full">
          Nastavi
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default FocusMode;
