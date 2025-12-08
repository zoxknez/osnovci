"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";

interface CelebrationProps {
  trigger: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function Celebration({
  trigger,
  duration = 5000,
  onComplete,
}: CelebrationProps) {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    setIsActive(true);
    const timer = setTimeout(() => {
      setIsActive(false);
      onComplete?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [trigger, duration, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.2}
      />
    </div>
  );
}
