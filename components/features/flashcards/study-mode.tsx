"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw, Shuffle, RotateCcw, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
// @ts-ignore
import confetti from "canvas-confetti";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface StudyModeProps {
  cards: Flashcard[];
  onClose: () => void;
}

export function StudyMode({ cards: initialCards, onClose }: StudyModeProps) {
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  if (!cards || cards.length === 0) {
    return null;
  }

  const currentCard = cards[currentIndex];
  
  if (!currentCard) {
    return null;
  }
  
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = () => {
    setIsFinished(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
    });
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setDirection(0);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setDirection(0);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      rotateY: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      rotateY: isFlipped ? 180 : 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Čestitamo!</h2>
            <p className="text-muted-foreground">
              Uspešno si prešao/la ceo špil od {cards.length} kartica.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleRestart} size="lg" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Ponovi isto
            </Button>
            <Button onClick={handleShuffle} variant="outline" size="lg" className="w-full">
              <Shuffle className="mr-2 h-4 w-4" />
              Promešaj i ponovi
            </Button>
            <Button onClick={onClose} variant="ghost" size="lg" className="w-full">
              Zatvori
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between text-muted-foreground">
          <Button variant="ghost" onClick={onClose} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nazad
          </Button>
          
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={handleShuffle} title="Promešaj">
              <Shuffle className="h-4 w-4" />
            </Button>
            <span className="font-medium tabular-nums">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Card Container */}
        <div className="relative h-[400px] w-full perspective-1000">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex} // Key change triggers animation
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                rotateY: { duration: 0.6 },
              }}
              className="absolute inset-0 w-full h-full cursor-pointer preserve-3d"
              onClick={handleFlip}
            >
              {/* Front */}
              <Card className="absolute inset-0 w-full h-full flex items-center justify-center p-8 text-center backface-hidden shadow-xl border-2 border-primary/10 bg-card">
                <div className="space-y-4 select-none">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Pitanje
                  </span>
                  <h2 className="text-3xl font-bold text-foreground">
                    {currentCard.front}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-4 animate-pulse">
                    Klikni da okreneš
                  </p>
                </div>
              </Card>

              {/* Back */}
              <Card
                className="absolute inset-0 w-full h-full flex items-center justify-center p-8 text-center backface-hidden shadow-xl border-2 border-primary/10 bg-primary/5"
                style={{ transform: "rotateY(180deg)" }}
              >
                <div className="space-y-4 select-none">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Odgovor
                  </span>
                  <h2 className="text-3xl font-bold text-primary">
                    {currentCard.back}
                  </h2>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Prethodna
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleFlip}
            className="min-w-[120px]"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Okreni
          </Button>

          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
          >
            {currentIndex === cards.length - 1 ? "Završi" : "Sledeća"}
            {currentIndex < cards.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
