// Parental PIN Dialog - Mobile-Optimized
"use client";

import { motion } from "framer-motion";
import { Lock, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyParentPIN } from "@/lib/auth/parental-lock";

interface ParentalPINDialogProps {
  action: string;
  description: string;
  guardianId: string; // Changed from studentId to guardianId
  onVerified: () => void;
  onCancel: () => void;
}

export function ParentalPINDialog({
  action,
  description,
  guardianId,
  onVerified,
  onCancel,
}: ParentalPINDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputId = useId();

  const handleVerify = async () => {
    if (pin.length !== 4) return;

    setIsVerifying(true);
    setError(false);

    try {
      const isValid = await verifyParentPIN(pin, guardianId);

      if (isValid) {
        onVerified();
      } else {
        setError(true);
        setPin("");
        setTimeout(() => setError(false), 2000);
      }
    } catch (_err) {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 2000);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="Zatvori"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
            <Lock className="h-10 w-10 text-purple-600" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Pozovi roditelja! 👨‍👩‍👧
          </h2>

          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1">
            {action}
          </p>

          <p className="text-base sm:text-lg text-gray-700">{description}</p>
        </div>

        {/* PIN Input - Mobile optimized! */}
        <div className="mb-6">
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-700 mb-3 text-center"
          >
            Roditelj treba da unese PIN kod:
          </label>
          <motion.div
            animate={error ? { x: [-10, 10, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <Input
              id={inputId}
              type="password"
              inputMode="numeric" // Mobile numeric keyboard
              pattern="[0-9]*" // iOS optimization
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className={`text-center text-3xl tracking-widest font-bold ${error ? "border-red-500" : ""}`}
              autoFocus
              aria-label="PIN kod (4 cifre)"
            />
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600 text-center font-semibold"
            >
              ❌ Pogrešan PIN! Pokušaj ponovo.
            </motion.p>
          )}
        </div>

        {/* Buttons - Large touch targets! */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleVerify}
            disabled={pin.length !== 4 || isVerifying}
            size="lg"
            className="w-full text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 min-h-[56px] touch-manipulation"
          >
            {isVerifying ? "Proveravam..." : "Potvrdi PIN"}
          </Button>

          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            className="w-full text-lg font-bold min-h-[56px] touch-manipulation"
          >
            Otkaži
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-4 text-xs sm:text-sm text-gray-500 text-center">
          💡 Roditelj postavlja PIN u podešavanjima profila
        </p>
      </motion.div>
    </motion.div>
  );
}
