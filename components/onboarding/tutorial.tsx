// Interactive Onboarding Tutorial - First-time User Experience
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
  tip?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Dobrodošao u Osnovci! 🎉",
    description:
      "Ova aplikacija će ti pomoći da organizuješ sve svoje školske obaveze na jednom mestu.",
    icon: <Sparkles className="h-12 w-12 text-purple-600" />,
    emoji: "👋",
  },
  {
    id: 2,
    title: "Domaći zadaci",
    description:
      "Dodaj svoje domaće zadatke i fotografiši ih kada ih uradiš. AI će automatski poboljšati kvalitet slike!",
    icon: <BookOpen className="h-12 w-12 text-blue-600" />,
    emoji: "📚",
    tip: "Savršeno za slanje roditeljima kao dokaz! 📸",
  },
  {
    id: 3,
    title: "Fotografiši dokaze",
    description:
      "Koristi kameru da uslikaš urađeni zadatak. Slika će biti automatski kompresovana i spremna za slanje.",
    icon: <Camera className="h-12 w-12 text-green-600" />,
    emoji: "📸",
    tip: "Radi i offline! Sinhronizuje se kada se povezeš na internet.",
  },
  {
    id: 4,
    title: "Raspored časova",
    description:
      "Unesi svoj nedeljni raspored i dobij podsetke za sve časove i kontrolne!",
    icon: <Calendar className="h-12 w-12 text-orange-600" />,
    emoji: "📅",
    tip: "Nikad više propuštenih časova! ⏰",
  },
  {
    id: 5,
    title: "Skupljaj XP i levele! 🎮",
    description:
      "Za svaki urađeni zadatak dobijaš XP. Skupljaj levele, bedževe i otključavaj nagrade!",
    icon: <CheckCircle2 className="h-12 w-12 text-yellow-600" />,
    emoji: "🏆",
    tip: "Održavaj streak da dobiješ bonus XP! 🔥",
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function OnboardingTutorial({
  onComplete,
  onSkip,
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && !isLastStep) {
        handleNext();
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        handlePrev();
      } else if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "Enter" && isLastStep) {
        onComplete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, isLastStep, handleNext, handlePrev, handleSkip, onComplete]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative max-w-lg w-full">
        {/* Skip button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkip}
          className="absolute -top-12 right-0 text-white hover:bg-white/10"
          aria-label="Preskoči tutorial"
        >
          <X className="h-6 w-6" />
        </Button>

        <Card className="shadow-2xl">
          <CardContent className="p-8">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex gap-1 mb-2">
                {tutorialSteps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${
                      index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: index <= currentStep ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 text-center">
                Korak {currentStep + 1} od {tutorialSteps.length}
              </p>
            </div>

            {/* Animated step content */}
            <div className="relative overflow-hidden min-h-[400px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute inset-0 flex flex-col items-center text-center"
                >
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-lg"
                  >
                    <span className="text-6xl">{step.emoji}</span>
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 mb-3"
                  >
                    {step.title}
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 text-lg leading-relaxed mb-4 max-w-md"
                  >
                    {step.description}
                  </motion.p>

                  {/* Tip */}
                  {step.tip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md"
                    >
                      <p className="text-sm text-blue-800 font-medium">
                        💡 {step.tip}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={currentStep === 0 ? "invisible" : ""}
              >
                Nazad
              </Button>

              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Počni!
                  </>
                ) : (
                  <>
                    Sledeće
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>

            {/* Keyboard hints */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Koristi tastere ← → za navigaciju, Esc za preskok
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Hook za managing onboarding state
export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem("onboarding_completed");
    setHasCompletedOnboarding(completed === "true");
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setHasCompletedOnboarding(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("onboarding_completed");
    setHasCompletedOnboarding(false);
  };

  return {
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}
