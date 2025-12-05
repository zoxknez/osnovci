"use client";

import { motion } from "framer-motion";
import { Fingerprint, Key, Lock, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { staggerItem } from "@/lib/animations/variants";

interface SecuritySectionProps {
  biometricEnabled: boolean;
  isTogglingBiometric?: boolean;
  onPasswordChange: () => void;
  onToggleBiometric: () => Promise<void>;
}

export function SecuritySection({
  biometricEnabled,
  isTogglingBiometric = false,
  onPasswordChange,
  onToggleBiometric,
}: SecuritySectionProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState(false);

  useEffect(() => {
    const fetchTwoFactorStatus = async () => {
      try {
        setTwoFactorError(false);
        const response = await fetch("/api/auth/2fa/status");
        const data = await response.json();
        if (response.ok) {
          setTwoFactorEnabled(data.enabled);
        } else {
          setTwoFactorError(true);
        }
      } catch {
        setTwoFactorError(true);
      }
    };

    fetchTwoFactorStatus();
  }, []);
  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 text-lg">
              🛡️
            </span>
            Sigurnost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.button
            type="button"
            onClick={onPasswordChange}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border-2 border-gray-200 hover:border-blue-300 touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">
                  Promeni lozinku
                </div>
                <div className="text-xs text-gray-600">
                  Poslednja promena: Pre 30 dana
                </div>
              </div>
            </div>
            <Key className="h-5 w-5 text-gray-400" />
          </motion.button>

          <SecurityToggle
            title="Biometrija"
            description={
              biometricEnabled ? "Aktivan otisak prsta" : "Neaktivno"
            }
            enabled={biometricEnabled}
            isLoading={isTogglingBiometric}
            icon={<Fingerprint className="h-5 w-5" />}
            activeColor="green"
            onToggle={onToggleBiometric}
          />

          <motion.a
            href="/dashboard/podesavanja/2fa"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="block w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border-2 border-gray-200 hover:border-purple-300 touch-manipulation"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    twoFactorEnabled ? "bg-purple-100" : "bg-gray-200"
                  }`}
                >
                  <Shield
                    className={`h-5 w-5 transition-colors ${
                      twoFactorEnabled ? "text-purple-600" : "text-gray-500"
                    }`}
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    2FA Verifikacija
                  </div>
                  <div className="text-xs text-gray-600">
                    {twoFactorError
                      ? "Greška pri učitavanju statusa"
                      : twoFactorEnabled
                        ? "Dodatna zaštita aktivna"
                        : "Neaktivno"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {twoFactorEnabled && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                    Omogućeno
                  </span>
                )}
                <Key className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </motion.a>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SecurityToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  isLoading?: boolean;
  icon: React.ReactNode;
  activeColor: "green" | "purple";
  onToggle: () => Promise<void>;
}

function SecurityToggle({
  title,
  description,
  enabled,
  isLoading = false,
  icon,
  activeColor,
  onToggle,
}: SecurityToggleProps) {
  const colors =
    activeColor === "green"
      ? {
          container: enabled ? "bg-green-100" : "bg-gray-200",
          icon: enabled ? "text-green-700" : "text-gray-500",
          track: enabled ? "bg-green-500" : "bg-gray-300",
        }
      : {
          container: enabled ? "bg-purple-100" : "bg-gray-200",
          icon: enabled ? "text-purple-600" : "text-gray-500",
          track: enabled ? "bg-purple-500" : "bg-gray-300",
        };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${colors.container}`}
        >
          <span className={`transition-colors ${colors.icon}`}>{icon}</span>
        </div>
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-600">{description}</div>
        </div>
      </div>
      <motion.button
        type="button"
        onClick={() => onToggle()}
        disabled={isLoading}
        aria-pressed={enabled}
        aria-label={`${title}: ${enabled ? "Uključeno" : "Isključeno"}`}
        whileTap={{ scale: 0.95 }}
        className={`relative w-14 h-8 rounded-full transition-all duration-200 ${colors.track} hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <motion.div
          className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center"
          animate={{ x: enabled ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {isLoading && (
            <motion.div
              className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}
