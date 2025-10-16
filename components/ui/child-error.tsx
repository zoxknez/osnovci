// Child-Friendly Error Component - Mobile Optimized
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getChildFriendlyError } from "@/lib/utils/child-friendly-errors";

interface ChildErrorProps {
  errorCode: string | number;
  customMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const colorMap = {
  blue: "from-blue-50 to-blue-100 border-blue-300",
  red: "from-red-50 to-red-100 border-red-300",
  yellow: "from-yellow-50 to-yellow-100 border-yellow-300",
  green: "from-green-50 to-green-100 border-green-300",
  orange: "from-orange-50 to-orange-100 border-orange-300",
  purple: "from-purple-50 to-purple-100 border-purple-300",
  gray: "from-gray-50 to-gray-100 border-gray-300",
};

const buttonColorMap = {
  blue: "from-blue-600 to-blue-700",
  red: "from-red-600 to-red-700",
  yellow: "from-yellow-600 to-yellow-700",
  green: "from-green-600 to-green-700",
  orange: "from-orange-600 to-orange-700",
  purple: "from-purple-600 to-purple-700",
  gray: "from-gray-600 to-gray-700",
};

export function ChildError({
  errorCode,
  customMessage,
  onRetry,
  onDismiss,
}: ChildErrorProps) {
  const error = getChildFriendlyError(errorCode, customMessage);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      {/* Mobile-optimized card */}
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className={`w-full max-w-md bg-gradient-to-br ${colorMap[error.color as keyof typeof colorMap] || colorMap.blue} border-3 rounded-3xl p-6 sm:p-8 shadow-2xl`}
      >
        {/* Giant emoji - attracts attention! */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: 2,
          }}
          className="text-8xl sm:text-9xl text-center mb-4"
        >
          {error.emoji}
        </motion.div>

        {/* Large, clear title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-3">
          {error.title}
        </h2>

        {/* Simple, large message text */}
        <p className="text-base sm:text-lg text-gray-700 text-center leading-relaxed mb-6">
          {error.message}
        </p>

        {/* Large touch-friendly buttons */}
        <div className="flex flex-col gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              size="lg"
              className={`w-full text-lg font-bold bg-gradient-to-r ${buttonColorMap[error.color as keyof typeof buttonColorMap] || buttonColorMap.blue} hover:shadow-xl touch-manipulation min-h-[56px]`}
            >
              {error.action}
            </Button>
          )}

          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="outline"
              size="lg"
              className="w-full text-lg font-bold min-h-[56px] touch-manipulation"
            >
              Zatvori
            </Button>
          )}
        </div>

        {/* Helper text */}
        <p className="mt-4 text-xs sm:text-sm text-gray-600 text-center">
          💡 Tip: Ako ne znaš šta da radiš, pitaj roditelja za pomoć!
        </p>
      </motion.div>
    </motion.div>
  );
}

/**
 * Success Component - Positive reinforcement!
 */
interface ChildSuccessProps {
  emoji: string;
  title: string;
  message: string;
  onClose: () => void;
}

export function ChildSuccess({
  emoji,
  title,
  message,
  onClose,
}: ChildSuccessProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div className="w-full max-w-md bg-gradient-to-br from-green-50 to-emerald-100 border-3 border-green-300 rounded-3xl p-8 shadow-2xl">
        {/* Animated success emoji */}
        <motion.div
          animate={{
            scale: [0, 1.2, 1],
            rotate: [0, 360, 360],
          }}
          transition={{
            duration: 0.6,
            times: [0, 0.6, 1],
          }}
          className="text-9xl text-center mb-4"
        >
          {emoji}
        </motion.div>

        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">
          {title}
        </h2>

        <p className="text-lg text-gray-700 text-center leading-relaxed mb-6">
          {message}
        </p>

        <Button
          onClick={onClose}
          size="lg"
          className="w-full text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl min-h-[56px] touch-manipulation"
        >
          Super! Nastavi dalje! 🚀
        </Button>
      </motion.div>
    </motion.div>
  );
}
