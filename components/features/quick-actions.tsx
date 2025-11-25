"use client";

/**
 * QuickActions - Brze akcije za učenike
 * 
 * Features:
 * - Floating action button (FAB) za mobilne
 * - Shortcuts za česte akcije
 * - Voice command support (todo)
 * - Customizable akcije
 * - Haptic feedback
 * - Child-friendly UI
 */

import * as React from "react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Camera,
  BookOpen,
  Clock,
  Calendar,
  StickyNote,
  X,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
  badge?: number | string;
  disabled?: boolean;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  className?: string;
  onAddHomework?: () => void;
  onOpenCamera?: () => void;
  onStartTimer?: () => void;
  onOpenCalendar?: () => void;
  onOpenFocusMode?: () => void;
  onAddNote?: () => void;
}

// Default actions for students
const DEFAULT_ACTIONS: Omit<QuickAction, "onClick">[] = [
  {
    id: "add-homework",
    label: "Nova zadaća",
    description: "Dodaj novu zadaću",
    icon: BookOpen,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    id: "camera",
    label: "Slikaj",
    description: "Slikaj zadaću",
    icon: Camera,
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    id: "timer",
    label: "Timer",
    description: "Pokreni timer za učenje",
    icon: Clock,
    color: "bg-amber-500 hover:bg-amber-600",
  },
  {
    id: "focus",
    label: "Fokus",
    description: "Uđi u režim fokusa",
    icon: Target,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    id: "calendar",
    label: "Kalendar",
    description: "Otvori kalendar",
    icon: Calendar,
    color: "bg-indigo-500 hover:bg-indigo-600",
  },
  {
    id: "note",
    label: "Bilješka",
    description: "Dodaj brzu bilješku",
    icon: StickyNote,
    color: "bg-pink-500 hover:bg-pink-600",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { 
    scale: 0, 
    opacity: 0,
    y: 20,
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const fabVariants = {
  closed: { 
    rotate: 0,
    scale: 1,
  },
  open: { 
    rotate: 45,
    scale: 1.1,
  },
};

export function QuickActions({
  actions,
  position = "bottom-right",
  className,
  onAddHomework,
  onOpenCamera,
  onStartTimer,
  onOpenCalendar,
  onOpenFocusMode,
  onAddNote,
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pressedAction, setPressedAction] = useState<string | null>(null);

  // Build actions with handlers
  const resolvedActions: QuickAction[] = actions || DEFAULT_ACTIONS.map((action) => {
    let onClick = () => {};
    
    switch (action.id) {
      case "add-homework":
        onClick = onAddHomework || (() => console.log("Add homework"));
        break;
      case "camera":
        onClick = onOpenCamera || (() => console.log("Open camera"));
        break;
      case "timer":
        onClick = onStartTimer || (() => console.log("Start timer"));
        break;
      case "focus":
        onClick = onOpenFocusMode || (() => console.log("Open focus mode"));
        break;
      case "calendar":
        onClick = onOpenCalendar || (() => console.log("Open calendar"));
        break;
      case "note":
        onClick = onAddNote || (() => console.log("Add note"));
        break;
    }
    
    return { ...action, onClick };
  });

  // Toggle menu
  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
    
    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Handle action click
  const handleActionClick = useCallback((action: QuickAction) => {
    setPressedAction(action.id);
    
    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
    
    // Delay for visual feedback
    setTimeout(() => {
      action.onClick();
      setIsOpen(false);
      setPressedAction(null);
    }, 100);
  }, []);

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  };

  // Items position based on FAB position
  const itemsPosition = {
    "bottom-right": "bottom-full mb-3 right-0",
    "bottom-left": "bottom-full mb-3 left-0",
    "bottom-center": "bottom-full mb-3 left-1/2 -translate-x-1/2",
  };

  return (
    <div 
      className={cn(
        "fixed z-50",
        positionClasses[position],
        className
      )}
    >
      {/* Action items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "absolute flex flex-col gap-3",
              itemsPosition[position]
            )}
          >
            {resolvedActions.map((action) => {
              const Icon = action.icon;
              const isPressed = pressedAction === action.id;
              
              return (
                <motion.div
                  key={action.id}
                  variants={itemVariants}
                  className="flex items-center gap-3"
                  style={{
                    flexDirection: position === "bottom-left" ? "row-reverse" : "row",
                  }}
                >
                  {/* Label */}
                  <motion.span
                    initial={{ opacity: 0, x: position === "bottom-left" ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: position === "bottom-left" ? 10 : -10 }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap",
                      "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
                      "shadow-lg"
                    )}
                  >
                    {action.label}
                    {action.badge && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </motion.span>

                  {/* Action button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      "shadow-lg transition-colors",
                      action.color,
                      action.disabled && "opacity-50 cursor-not-allowed",
                      isPressed && "ring-4 ring-white/50"
                    )}
                    aria-label={action.label}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] -z-10"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        variants={fabVariants}
        animate={isOpen ? "open" : "closed"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleMenu}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-primary to-primary/80",
          "shadow-xl shadow-primary/30",
          "focus:outline-none focus:ring-4 focus:ring-primary/50",
          "transition-all"
        )}
        aria-label={isOpen ? "Zatvori meni" : "Otvori brze akcije"}
        aria-expanded={isOpen}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </motion.div>
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.button>

      {/* Tip for first-time users */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "absolute bottom-full mb-2 px-2 py-1 rounded text-xs",
              "bg-gray-900 text-white whitespace-nowrap",
              position === "bottom-left" ? "left-0" : "right-0"
            )}
          >
            <Sparkles className="h-3 w-3 inline mr-1" />
            Brze akcije
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simplified inline FAB for specific actions
export function SingleActionButton({
  icon: Icon,
  label,
  onClick,
  color = "bg-primary",
  position = "bottom-right",
  className,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
  position?: "bottom-right" | "bottom-left";
  className?: string;
}) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  };

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
        onClick();
      }}
      className={cn(
        "fixed z-50 w-14 h-14 rounded-full flex items-center justify-center",
        "shadow-xl",
        "focus:outline-none focus:ring-4 focus:ring-offset-2",
        positionClasses[position],
        color,
        className
      )}
      aria-label={label}
    >
      <Icon className="h-6 w-6 text-white" />
    </motion.button>
  );
}

export default QuickActions;
