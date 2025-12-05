"use client";

import {
  Clock,
  CloudRain,
  Coffee,
  Play,
  Square,
  Trophy,
  Wind,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import {
  endFocusSessionAction,
  startFocusSessionAction,
} from "@/app/actions/focus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Celebration } from "@/components/ui/celebration";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type TimerMode = "countdown" | "stopwatch";

interface Subject {
  id: string;
  name: string;
  icon?: string | null;
}

interface FocusTimerProps {
  subjects: Subject[];
}

export function FocusTimer({ subjects }: FocusTimerProps) {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get("subjectId");

  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [targetDuration, setTargetDuration] = useState<number>(25 * 60); // Default 25 min
  const [mode, setMode] = useState<TimerMode>("countdown");
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubjectId || "",
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [sound, setSound] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const toastShownRef = useRef(false);
  const router = useRouter();

  // IDs for accessibility
  const subjectSelectId = useId();
  const modeSelectId = useId();

  // Update selected subject if URL param changes
  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubject(initialSubjectId);
    }
  }, [initialSubjectId]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ...existing code...

  const startSession = async () => {
    if (!selectedSubject) {
      if (!toastShownRef.current) {
        toast.error("Molim te izaberi predmet pre početka!");
        toastShownRef.current = true;
        setTimeout(() => {
          toastShownRef.current = false;
        }, 3000);
      }
      return;
    }

    try {
      const result = await startFocusSessionAction(selectedSubject);

      if (result.error) throw new Error(result.error);

      const sessionData = result.data as { id: string } | undefined;
      if (!sessionData) throw new Error("No session data returned");

      setSessionId(sessionData.id);
      setIsActive(true);

      // If countdown, set seconds to target
      if (mode === "countdown") {
        setSeconds(targetDuration);
      } else {
        setSeconds(0);
      }

      toast.success("Fokus sesija započeta! Srećno! 🚀");
    } catch (error) {
      if (!toastShownRef.current) {
        toast.error("Greška pri pokretanju sesije");
        toastShownRef.current = true;
        setTimeout(() => {
          toastShownRef.current = false;
        }, 3000);
      }
      console.error(error);
    }
  };

  const endSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      const result = await endFocusSessionAction(sessionId, "COMPLETED");

      if (result.error) throw new Error(result.error);

      const resultData = result.data as { xpEarned?: number } | undefined;

      toast.success(
        `Sesija završena! Osvojio si ${resultData?.xpEarned ?? 0} XP! 🎉`,
      );
      setIsActive(false);
      setSessionId(null);
      setShowCelebration(true);
      router.refresh(); // Refresh to update XP in header
    } catch (error) {
      if (!toastShownRef.current) {
        toast.error("Greška pri završetku sesije");
        toastShownRef.current = true;
        setTimeout(() => {
          toastShownRef.current = false;
        }, 3000);
      }
      console.error(error);
    }
  }, [sessionId, router]);

  const toggleSound = (newSound: string) => {
    if (sound === newSound) {
      setSound(null);
      toast.info("Zvuk isključen");
    } else {
      setSound(newSound);
      toast.success(
        `Zvuk ${newSound === "rain" ? "kiše" : newSound === "cafe" ? "kafića" : "vetra"} aktiviran (Demo)`,
      );
    }
  };

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (mode === "countdown") {
            if (prev <= 1) {
              // Timer finished
              endSession(); // Auto end or just stop? Let's auto end for now
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, mode, endSession]); // Calculate progress
  const progress =
    mode === "countdown"
      ? ((targetDuration - seconds) / targetDuration) * 100
      : Math.min((seconds / targetDuration) * 100, 100);

  return (
    <>
      <Celebration
        trigger={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
      <Card className="w-full max-w-md mx-auto border-2 border-blue-100 shadow-lg overflow-hidden">
        <CardHeader className="text-center pb-2 bg-blue-50/50">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl text-blue-600">
            <Clock className="w-8 h-8" />
            Fokus Tajmer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {!isActive && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor={subjectSelectId}
                  className="text-sm font-medium text-gray-600"
                >
                  Izaberi predmet:
                </label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger id={subjectSelectId}>
                    <SelectValue placeholder="Šta učimo danas?" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span
                  id={modeSelectId}
                  className="text-sm font-medium text-gray-600"
                >
                  Režim rada:
                </span>
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as TimerMode)}
                  className="w-full"
                  aria-labelledby={modeSelectId}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="countdown">Odbrojavanje</TabsTrigger>
                    <TabsTrigger value="stopwatch">Štoperica</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {mode === "countdown" && (
                <div className="grid grid-cols-3 gap-2">
                  {[15, 25, 45].map((mins) => (
                    <Button
                      key={mins}
                      variant={
                        targetDuration === mins * 60 ? "default" : "outline"
                      }
                      onClick={() => setTargetDuration(mins * 60)}
                      className="w-full"
                    >
                      {mins} min
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ambient Sounds */}
          {/* biome-ignore lint/a11y/useSemanticElements: fieldset doesn't fit visual design */}
          <div
            role="group"
            aria-label="Ambijentalni zvukovi"
            className="flex justify-center gap-4 py-2"
          >
            <Button
              variant={sound === "rain" ? "default" : "outline"}
              size="icon"
              onClick={() => toggleSound("rain")}
              className="rounded-full w-10 h-10"
              title="Zvuk kiše"
              aria-pressed={sound === "rain"}
              aria-label="Zvuk kiše"
            >
              <CloudRain className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              variant={sound === "cafe" ? "default" : "outline"}
              size="icon"
              onClick={() => toggleSound("cafe")}
              className="rounded-full w-10 h-10"
              title="Zvuk kafića"
              aria-pressed={sound === "cafe"}
              aria-label="Zvuk kafića"
            >
              <Coffee className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              variant={sound === "wind" ? "default" : "outline"}
              size="icon"
              onClick={() => toggleSound("wind")}
              className="rounded-full w-10 h-10"
              title="Zvuk vetra"
              aria-pressed={sound === "wind"}
              aria-label="Zvuk vetra"
            >
              <Wind className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="text-center py-8 relative">
            {/* Timer Display with aria-live for screen readers */}
            <output
              aria-live="polite"
              aria-atomic="true"
              className={cn(
                "block text-7xl font-bold font-mono tracking-wider transition-colors",
                isActive ? "text-blue-600" : "text-gray-300",
              )}
            >
              {formatTime(seconds)}
            </output>
            <p
              className="text-sm text-gray-500 mt-2 animate-pulse"
              aria-live="polite"
            >
              {isActive
                ? mode === "countdown"
                  ? "Ostani fokusiran!"
                  : "Vreme teče..."
                : "Spremi se za učenje!"}
            </p>
          </div>

          {isActive && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Napredak</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          <div className="flex justify-center gap-4">
            {!isActive ? (
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-14 shadow-lg shadow-blue-200 transition-all hover:scale-105"
                onClick={startSession}
                disabled={!selectedSubject}
              >
                <Play className="w-6 h-6 mr-2 fill-current" />
                Započni Fokus
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                className="w-full text-lg h-14 shadow-lg shadow-red-200 transition-all hover:scale-105"
                onClick={endSession}
              >
                <Square className="w-6 h-6 mr-2 fill-current" />
                Završi Sesiju
              </Button>
            )}
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg flex items-center gap-3 text-sm text-yellow-800 border border-yellow-100">
            <Trophy className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p>
              Osvoji <strong>1 XP</strong> za svaki minut učenja! Bonus poeni za
              završene ciljeve.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
