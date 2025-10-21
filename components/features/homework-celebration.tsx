"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap } from "lucide-react";

interface HomeworkCelebrationProps {
  /** Show celebration */
  show: boolean;
  /** Callback when celebration completes */
  onComplete?: () => void;
  /** Custom celebration message */
  message?: string;
  /** Duration in milliseconds (default: 3000) */
  duration?: number;
}

/**
 * Celebration component for homework completion
 * Shows confetti animation with trophy icon
 */
export function HomeworkCelebration({
  show,
  onComplete,
  message = "🎉 Odličan posao!",
  duration = 3000,
}: HomeworkCelebrationProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Get window size for confetti
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!show || !onComplete) return;

    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [show, onComplete, duration]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Confetti effect */}
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
            colors={[
              "#FFD700", // Gold
              "#FFA500", // Orange
              "#FF6347", // Tomato
              "#4169E1", // Royal Blue
              "#32CD32", // Lime Green
              "#FF1493", // Deep Pink
            ]}
          />

          {/* Celebration message with icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm mx-4 border-4 border-yellow-400">
              {/* Trophy icon with animation */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 0.5,
                }}
                className="flex justify-center mb-4"
              >
                <Trophy className="w-20 h-20 text-yellow-500" />
              </motion.div>

              {/* Stars decoration */}
              <div className="flex justify-center gap-2 mb-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2"
              >
                {message}
              </motion.p>

              {/* Subtitle with XP hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400"
              >
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Osvojio/la si XP poene!
                </span>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
