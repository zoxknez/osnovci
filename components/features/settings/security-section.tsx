"use client";

import { motion } from "framer-motion";
import { Fingerprint, Key, Lock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { staggerItem } from "@/lib/animations/variants";

interface SecuritySectionProps {
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  onPasswordChange: () => void;
  onToggleBiometric: () => Promise<void>;
  onToggleTwoFactor: () => Promise<void>;
}

export function SecuritySection({
  biometricEnabled,
  twoFactorEnabled,
  onPasswordChange,
  onToggleBiometric,
  onToggleTwoFactor,
}: SecuritySectionProps) {
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
            icon={<Fingerprint className="h-5 w-5" />}
            activeColor="green"
            onToggle={onToggleBiometric}
          />

          <SecurityToggle
            title="2FA Verifikacija"
            description={
              twoFactorEnabled ? "Dodatna zaštita aktivna" : "Neaktivno"
            }
            enabled={twoFactorEnabled}
            icon={<Shield className="h-5 w-5" />}
            activeColor="purple"
            onToggle={onToggleTwoFactor}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SecurityToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  activeColor: "green" | "purple";
  onToggle: () => Promise<void>;
}

function SecurityToggle({
  title,
  description,
  enabled,
  icon,
  activeColor,
  onToggle,
}: SecurityToggleProps) {
  const colors =
    activeColor === "green"
      ? {
          container: enabled ? "bg-green-100" : "bg-gray-200",
          icon: enabled ? "text-green-600" : "text-gray-500",
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
        whileTap={{ scale: 0.95 }}
        className={`relative w-14 h-8 rounded-full transition-all duration-200 ${colors.track} hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none touch-manipulation`}
      >
        <motion.div
          className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"
          animate={{ x: enabled ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}
