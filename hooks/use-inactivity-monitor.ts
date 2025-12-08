// Inactivity Monitor Hook - Automatic logout after 30 minutes of inactivity
// Security feature to prevent unauthorized access if user leaves device unattended

"use client";

import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { log } from "@/lib/logger";

interface InactivityConfig {
  /**
   * Timeout in milliseconds (default: 30 minutes)
   */
  timeout?: number;

  /**
   * Warning before logout in milliseconds (default: 2 minutes)
   */
  warningTime?: number;

  /**
   * Callback when user is about to be logged out
   */
  onWarning?: (remainingSeconds: number) => void;

  /**
   * Callback when user is logged out
   */
  onLogout?: () => void;

  /**
   * Disable inactivity monitoring
   */
  disabled?: boolean;
}

const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARNING_TIME = 2 * 60 * 1000; // 2 minutes

/**
 * Hook for monitoring user inactivity and automatic logout
 *
 * Tracks mouse movement, keyboard input, touch events, and scrolling.
 * Shows warning before logout, allowing user to extend session.
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     remainingTime,
 *     showWarning,
 *     resetInactivity
 *   } = useInactivityMonitor({
 *     timeout: 30 * 60 * 1000, // 30 minutes
 *     onWarning: (seconds) => {
 *       showToast(`Bićeš odjavljen za ${seconds} sekundi`);
 *     },
 *   });
 *
 *   return (
 *     <>
 *       {showWarning && (
 *         <InactivityWarning
 *           seconds={remainingTime}
 *           onExtend={resetInactivity}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useInactivityMonitor(config: InactivityConfig = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    warningTime = DEFAULT_WARNING_TIME,
    onWarning,
    onLogout,
    disabled = false,
  } = config;

  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const warningShownRef = useRef(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Reset inactivity timer (called on user interaction)
   */
  const resetInactivity = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
    warningShownRef.current = false;

    // Clear existing timers
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
  };

  /**
   * Force logout
   */
  const forceLogout = async () => {
    log.info("Automatic logout due to inactivity");

    if (onLogout) {
      onLogout();
    }

    // Sign out with redirect to login
    await signOut({
      callbackUrl: "/prijava?reason=inactivity",
      redirect: true,
    });
  };

  // Monitor user activity
  useEffect(() => {
    if (disabled) return;

    const handleActivity = () => {
      if (!showWarning) {
        setLastActivity(Date.now());
      }
    };

    // Events to track
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [disabled, showWarning]);

  // Check for inactivity
  useEffect(() => {
    if (disabled) return;

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const timeUntilWarning = timeout - warningTime;

      // Show warning
      if (
        timeSinceLastActivity >= timeUntilWarning &&
        !warningShownRef.current
      ) {
        setShowWarning(true);
        warningShownRef.current = true;

        // Calculate remaining seconds
        const remaining = Math.floor((timeout - timeSinceLastActivity) / 1000);
        setRemainingTime(remaining);

        if (onWarning) {
          onWarning(remaining);
        }

        // Start countdown
        countdownTimerRef.current = setInterval(() => {
          const newRemaining = Math.floor(
            (timeout - (Date.now() - lastActivity)) / 1000,
          );

          if (newRemaining <= 0) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
            }
            forceLogout();
          } else {
            setRemainingTime(newRemaining);
          }
        }, 1000);
      }

      // Force logout
      if (timeSinceLastActivity >= timeout) {
        forceLogout();
      }
    };

    // Check every second
    const intervalId = setInterval(checkInactivity, 1000);

    return () => {
      clearInterval(intervalId);
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [disabled, lastActivity, timeout, warningTime, onWarning]);

  return {
    /**
     * Time remaining before logout (in seconds)
     */
    remainingTime,

    /**
     * Whether warning is currently shown
     */
    showWarning,

    /**
     * Reset inactivity timer (extends session)
     */
    resetInactivity,

    /**
     * Force logout immediately
     */
    forceLogout,
  };
}
