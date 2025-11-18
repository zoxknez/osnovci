// Inactivity Warning Component - Shows countdown before logout

"use client";

import { Button } from "@/components/ui/button";

interface InactivityWarningProps {
  /**
   * Remaining seconds before logout
   */
  seconds: number;
  
  /**
   * Whether dialog is open
   */
  open: boolean;
  
  /**
   * Callback when user extends session
   */
  onExtend: () => void;
  
  /**
   * Callback when user chooses to logout
   */
  onLogout: () => void;
}

/**
 * Warning modal shown before automatic logout due to inactivity
 */
export function InactivityWarning({
  seconds,
  open,
  onExtend,
  onLogout,
}: InactivityWarningProps) {
  // Format seconds to MM:SS
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl mx-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">⏰</span>
            Nisi aktivan/na
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Nisi bio/bila aktivan/na već duže vreme. 
            <br />
            <strong className="text-lg text-red-600 dark:text-red-400">
              Automatsko odjavljivanje za {timeString}
            </strong>
          </p>
        </div>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200">
              Zašto se ovo dešava?
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Ovo je sigurnosna mera koja te štiti ako zaboraviš da se odjaviš 
              ili ostaviš uređaj bez nadzora.
            </p>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Klikni na dugme "Ostani prijavljen/a" da nastaviš sa radom, 
            ili "Odjavi me" da se odmah odjaviš.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full sm:w-auto"
          >
            Odjavi me
          </Button>
          <Button
            onClick={onExtend}
            className="w-full sm:w-auto flex-1"
          >
            ✅ Ostani prijavljen/a
          </Button>
        </div>
      </div>
    </div>
  );
}
