// Interactive Onboarding Tutorial - First-time User Experience
"use client";

import { useEffect, useState, useCallback, useRef, useId } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon?: ReactNode;     // sad je opciono i zaista se koristi
  emoji?: string;       // fallback ako nema ikone
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
    tip: "Radi i offline! Sinhronizuje se kada se povežeš na internet.",
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
  const prefersReducedMotion = useReducedMotion();
  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  // a11y (modal)
  const dialogTitleId = useId();
  const dialogDescId = useId();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // focus trap
  useEffect(() => {
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;

    const focusable = () => {
      if (!overlayRef.current) return [] as HTMLElement[];
      return Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
    };

    // init focus
    const items = focusable();
    if (items[0]) items[0].focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = focusable();
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused.current) previouslyFocused.current.focus();
    };
  }, []);

  // Keyboard navigation (samo unutar modala)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight" && !isLastStep) {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "Enter" && isLastStep) {
        e.preventDefault();
        onComplete();
      }
    },
    [currentStep, isLastStep, onComplete]
  );

  // Swipe gestures (mobile)
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const THRESHOLD = 60;
    if (dx > THRESHOLD) {
      handlePrev();
    } else if (dx < -THRESHOLD) {
      handleNext();
    }
    touchStartX.current = null;
  };

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev > 0) {
        setDirection(-1);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleSkip = useCallback(() => {
    if (onSkip) onSkip();
    else onComplete();
  }, [onSkip, onComplete]);

  const variants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      aria-describedby={dialogDescId}
      onKeyDown={handleKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative max-w-lg w-full">
        {/* Skip button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkip}
          className="absolute -top-12 right-0 text-white hover:bg-white/10"
          aria-label="Preskoči tutorijal"
        >
          <X className="h-6 w-6" />
        </Button>

        <Card className="shadow-2xl">
          <CardContent className="p-8">
            {/* Progress bar */}
            <div className="mb-6" aria-live="polite">
              <div className="flex gap-1 mb-2" aria-hidden="true">
                {tutorialSteps.map((_, index) => (
                  <motion.div
                    key={`step-${index}`}
                    className={`h-1.5 flex-1 rounded-full ${
                      index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: index <= currentStep ? 1 : 1, // izbegni “skokove” na unmount
                    }}
                    style={{ transformOrigin: "left" }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 text-center" id={dialogDescId}>
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
                    x: prefersReducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: prefersReducedMotion ? 0 : 0.2 },
                  }}
                  className="absolute inset-0 flex flex-col items-center text-center"
                >
                  {/* Icon / Emoji */}
                  <motion.div
                    initial={{ scale: prefersReducedMotion ? 1 : 0, rotate: prefersReducedMotion ? 0 : -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.2, type: "spring" }}
                    className="mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-lg"
                    aria-hidden="true"
                  >
                    {step.icon ? (
                      step.icon
                    ) : (
                      <span className="text-6xl">{step.emoji ?? "✨"}</span>
                    )}
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    id={dialogTitleId}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
                    className="text-2xl font-bold text-gray-900 mb-3"
                  >
                    {step.title}
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.4 }}
                    className="text-gray-600 text-lg leading-relaxed mb-4 max-w-md"
                  >
                    {step.description}
                  </motion.p>

                  {/* Tip */}
                  {step.tip && (
                    <motion.div
                      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.5 }}
                      className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md"
                    >
                      <p className="text-sm text-blue-800 font-medium">💡 {step.tip}</p>
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
                aria-label="Nazad"
              >
                Nazad
              </Button>

              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
                aria-label={isLastStep ? "Završi i počni" : "Sledeće"}
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
              Koristi tastere ← → za navigaciju, Esc za preskok. Prevuci levo/desno na mobilnom.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Hook za managing onboarding state (stabilno, default = false)
export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // init + guard za private mode
  useEffect(() => {
    try {
      const completed = localStorage.getItem("onboarding_completed");
      setHasCompletedOnboarding(completed === "true");
    } catch {
      setHasCompletedOnboarding(false);
    }
  }, []);

  // sync kroz tabove/prozore
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "onboarding_completed") {
        setHasCompletedOnboarding(e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const completeOnboarding = () => {
    try {
      localStorage.setItem("onboarding_completed", "true");
    } catch {}
    setHasCompletedOnboarding(true);
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem("onboarding_completed");
    } catch {}
    setHasCompletedOnboarding(false);
  };

  return {
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}
