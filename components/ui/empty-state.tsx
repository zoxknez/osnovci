// Empty State Component - Beautiful & Child-Friendly
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  /** Emoji ili ikona (veliki) */
  icon: string | React.ReactNode;
  /** Glavni naslov */
  title: string;
  /** Opis (optional) */
  description?: string;
  /** Akcioni button (optional) */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Secondary action (optional) */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * EmptyState - Za prazne liste, missing content, itd.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="📚"
 *   title="Nema domaćih zadataka!"
 *   description="Uživaj u slobodnom vremenu 🎉"
 *   action={{
 *     label: "Dodaj novi zadatak",
 *     onClick: () => openCreateModal(),
 *     icon: <Plus />
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "p-8",
      icon: "text-6xl mb-3",
      title: "text-lg",
      description: "text-sm",
    },
    md: {
      container: "p-12",
      icon: "text-8xl mb-4",
      title: "text-2xl",
      description: "text-base",
    },
    lg: {
      container: "p-16",
      icon: "text-9xl mb-6",
      title: "text-3xl",
      description: "text-lg",
    },
  };

  const classes = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        classes.container,
        className,
      )}
    >
      {/* Icon/Emoji */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          damping: 12,
          stiffness: 100,
          delay: 0.1,
        }}
        className={cn(classes.icon, "select-none")}
        role="img"
        aria-label={typeof icon === "string" ? "decorative emoji" : ""}
      >
        {icon}
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn("font-bold text-gray-900 mb-2", classes.title)}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn("text-gray-600 max-w-md mb-6", classes.description)}
        >
          {description}
        </motion.p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {action && (
            <Button
              onClick={action.onClick}
              size="lg"
              leftIcon={action.icon}
              className="min-w-[160px]"
            >
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size="lg"
              className="min-w-[160px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500 rounded-full blur-3xl"
        />
      </div>
    </motion.div>
  );
}

/**
 * Preset Empty States - Za brzo korišćenje
 */
export const EmptyStatePresets = {
  NoHomework: () => (
    <EmptyState
      icon="📚"
      title="Nema domaćih zadataka!"
      description="Uživaj u slobodnom vremenu ili dodaj novi zadatak 🎉"
    />
  ),

  NoSchedule: () => (
    <EmptyState
      icon="📅"
      title="Nema časova danas"
      description="Uživaj u slobodnom danu! Možda dodaš raspored za sledeću nedelju?"
    />
  ),

  NoGrades: () => (
    <EmptyState
      icon="📊"
      title="Još nema ocena"
      description="Ocene će se pojaviti ovde kada ih unesete"
    />
  ),

  NoFamily: () => (
    <EmptyState
      icon="👨‍👩‍👧"
      title="Nema povezanih roditelja"
      description="Pozovi roditelje da se povežu sa tvojim nalogom pomoću QR koda"
    />
  ),

  NoResults: () => (
    <EmptyState
      icon="🔍"
      title="Nema rezultata"
      description="Pokušaj sa drugačijom pretragom"
      size="sm"
    />
  ),

  Error: () => (
    <EmptyState
      icon="😢"
      title="Ups! Nešto nije u redu"
      description="Ne brini, pokušaj ponovo za nekoliko trenutaka"
      size="sm"
    />
  ),
};
