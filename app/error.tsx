// Global Error Boundary - Za sve neočekivane greške
// Child-friendly error page

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry)
    console.error("Global error:", error);

    // TODO: Send to Sentry
    // Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="sr">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center space-y-6"
          >
            {/* Emoji animacija */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className="text-8xl"
            >
              😢
            </motion.div>

            {/* Naslov */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Ups! Nešto nije u redu
              </h1>
              <p className="text-lg text-gray-600">
                Ne brini, naš tim već rešava problem! 🛠️
              </p>
            </div>

            {/* Error details (samo za development) */}
            {process.env.NODE_ENV === "development" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                <p className="text-sm font-mono text-red-800 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={reset}
                size="lg"
                className="w-full gap-2 text-lg"
              >
                🔄 Pokušaj ponovo
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => (window.location.href = "/")}
              >
                🏠 Nazad na početnu
              </Button>
            </div>

            {/* Support */}
            <p className="text-sm text-gray-500">
              Problem se ponavlja?{" "}
              <a
                href="mailto:podrska@osnovci.rs"
                className="text-blue-600 hover:underline font-medium"
              >
                Kontaktiraj podršku
              </a>
            </p>

            {/* Illustration */}
            <div className="flex items-center justify-center gap-4 text-gray-400 text-sm pt-4">
              <div>🛠️ Popravka u toku</div>
              <div>•</div>
              <div>⏱️ Uskoro gotovo</div>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
