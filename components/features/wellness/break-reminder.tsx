/**
 * Study Break Reminder Component
 * Podsećanje na pauze za zdravlje i wellness
 */

"use client";

import { useState, useEffect } from "react";
import { Clock, Coffee, Eye, Activity, Droplet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { showSuccessToast } from "@/components/features/error-toast";

interface BreakActivity {
  type: "stretch" | "walk" | "eye_rest" | "water" | "full_break";
  title: string;
  description: string;
  duration: number; // seconds
  icon: React.ReactNode;
  instructions: string[];
}

const BREAK_ACTIVITIES: BreakActivity[] = [
  {
    type: "eye_rest",
    title: "Odmor za oči",
    description: "20-20-20 pravilo",
    duration: 20,
    icon: <Eye className="h-6 w-6" />,
    instructions: [
      "Pogledaj u daljinu 20 sekundi",
      "Fokusiraj se na objekat najmanje 6 metara daleko",
      "Treptaj normalno",
    ],
  },
  {
    type: "stretch",
    title: "Istezanje",
    description: "5 minuta vežbi",
    duration: 300,
    icon: <Activity className="h-6 w-6" />,
    instructions: [
      "Ispruži ruke iznad glave",
      "Zakreni vrat lagano levo-desno",
      "Ispruži noge i savij se u pasu",
      "Uradi 10 čučnjeva",
    ],
  },
  {
    type: "walk",
    title: "Kratka šetnja",
    description: "5 minuta hoda",
    duration: 300,
    icon: <Activity className="h-6 w-6" />,
    instructions: [
      "Ustani i prošetaj po sobi",
      "Izađi napolje ako je moguće",
      "Duboko diši",
      "Razmisli o nečem prijatnom",
    ],
  },
  {
    type: "water",
    title: "Hidracija",
    description: "Popij vode",
    duration: 60,
    icon: <Droplet className="h-6 w-6" />,
    instructions: [
      "Popij čašu vode",
      "Hidracija je važna za fokus",
      "Voda pomaže mozgu da bolje radi",
    ],
  },
  {
    type: "full_break",
    title: "Potpuna pauza",
    description: "15 minuta odmora",
    duration: 900,
    icon: <Coffee className="h-6 w-6" />,
    instructions: [
      "Napravi potpunu pauzu od učenja",
      "Uradi nešto što te opušta",
      "Ne gledaj ekran",
      "Vrati se osvežen/na",
    ],
  },
];

interface BreakReminderProps {
  studyStartTime: Date;
  onBreakComplete?: () => void;
}

export function BreakReminder({
  studyStartTime,
  onBreakComplete,
}: BreakReminderProps) {
  const [studyTime, setStudyTime] = useState(0); // seconds
  const [showBreak, setShowBreak] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<BreakActivity | null>(null);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [breakActive, setBreakActive] = useState(false);

  const BREAK_INTERVAL = 45 * 60; // 45 minutes in seconds
  const FULL_BREAK_INTERVAL = 90 * 60; // 90 minutes for full break

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - studyStartTime.getTime()) / 1000);
      setStudyTime(elapsed);

      // Check if it's time for a break
      if (elapsed >= FULL_BREAK_INTERVAL && elapsed % FULL_BREAK_INTERVAL < 60) {
        // Full break every 90 minutes
        setCurrentActivity(BREAK_ACTIVITIES.find((a) => a.type === "full_break") || null);
        setShowBreak(true);
      } else if (elapsed >= BREAK_INTERVAL && elapsed % BREAK_INTERVAL < 60) {
        // Regular break every 45 minutes
        const activities = BREAK_ACTIVITIES.filter((a) => a.type !== "full_break");
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        setCurrentActivity(randomActivity ?? null);
        setShowBreak(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [studyStartTime]);

  useEffect(() => {
    if (!breakActive || !currentActivity) {
      return;
    }
    
    const interval = setInterval(() => {
      setBreakTimeRemaining((prev) => {
        if (prev <= 1) {
          setBreakActive(false);
          setShowBreak(false);
          setCurrentActivity(null);
          onBreakComplete?.();
          showSuccessToast("Pauza završena! Vrati se na učenje osvežen/na! 💪");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breakActive, currentActivity, onBreakComplete]);

  const handleStartBreak = () => {
    if (currentActivity) {
      setBreakTimeRemaining(currentActivity.duration);
      setBreakActive(true);
    }
  };

  const handleSkipBreak = () => {
    setShowBreak(false);
    setCurrentActivity(null);
    setBreakActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Study Time Display */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Vreme učenja</p>
                <p className="text-2xl font-bold">{formatTime(studyTime)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Do sledeće pauze</p>
              <p className="text-lg font-semibold">
                {formatTime(BREAK_INTERVAL - (studyTime % BREAK_INTERVAL))}
              </p>
            </div>
          </div>
          <Progress
            value={((studyTime % BREAK_INTERVAL) / BREAK_INTERVAL) * 100}
            className="mt-4"
          />
        </CardContent>
      </Card>

      {/* Break Reminder Modal */}
      <AnimatePresence>
        {showBreak && currentActivity && !breakActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBreak(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {currentActivity.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{currentActivity.title}</h3>
                  <p className="text-sm text-gray-600">{currentActivity.description}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <p className="font-medium">Uputstva:</p>
                <ul className="space-y-1">
                  {currentActivity.instructions.map((instruction, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSkipBreak}
                  className="flex-1"
                >
                  Preskoči
                </Button>
                <Button onClick={handleStartBreak} className="flex-1">
                  Započni pauzu
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Break Timer */}
      {breakActive && currentActivity && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentActivity.icon}
              {currentActivity.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-4xl font-mono font-bold text-green-600">
                {formatTime(breakTimeRemaining)}
              </div>
              <Progress
                value={
                  ((currentActivity.duration - breakTimeRemaining) /
                    currentActivity.duration) *
                  100
                }
                className="w-full"
              />
              <p className="text-sm text-gray-600">
                {currentActivity.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

