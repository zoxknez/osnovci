// 2FA Verification Modal Component
// Shows after successful password login, before dashboard redirect

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Key, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TwoFactorModalProps {
  open: boolean;
  onVerify: (token: string) => Promise<boolean>;
  onCancel: () => void;
  email: string;
}

export function TwoFactorModal({
  open,
  onVerify,
  onCancel,
  email,
}: TwoFactorModalProps) {
  const [token, setToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  const handleVerify = async () => {
    const code = useBackupCode ? backupCode : token;
    
    if (!code) {
      toast.error("Unesi kod");
      return;
    }

    setIsVerifying(true);

    try {
      const success = await onVerify(code);
      
      if (!success) {
        toast.error(
          useBackupCode 
            ? "Nevažeći backup kod. Proveri da li je već iskorišćen." 
            : "Nevažeći kod. Proveri Authenticator aplikaciju."
        );
      }
    } catch (error) {
      toast.error("Greška pri verifikaciji. Pokušaj ponovo.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md mx-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
            
            <div className="p-6 sm:p-8">
              {/* Icon and Title */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                >
                  <Shield className="h-8 w-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Dvofaktorska Autentifikacija
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {email}
                </p>
              </div>

              {/* Info Alert */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-semibold mb-1">
                      {useBackupCode ? "Unesi backup kod" : "Unesi 6-cifreni kod"}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      {useBackupCode 
                        ? "Backup kod je 8-karakterni kod koji si dobio/la pri podešavanju 2FA." 
                        : "Otvori svoju Authenticator aplikaciju (Google Authenticator, Authy, itd.) i unesi prikazani kod."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Form */}
              <div className="space-y-4 mb-6">
                {!useBackupCode ? (
                  <Input
                    label="6-cifreni kod"
                    type="text"
                    placeholder="123456"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    disabled={isVerifying}
                    autoFocus
                    helperText="Unesi kod iz Authenticator aplikacije"
                  />
                ) : (
                  <Input
                    label="Backup kod"
                    type="text"
                    placeholder="AB12-CD34"
                    value={backupCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
                      // Auto-format as AB12-CD34
                      if (value.length <= 8) {
                        setBackupCode(
                          value.length > 4 
                            ? `${value.slice(0, 4)}-${value.slice(4)}` 
                            : value
                        );
                      }
                    }}
                    maxLength={9} // 8 chars + 1 dash
                    disabled={isVerifying}
                    autoFocus
                    helperText="Unesi 8-karakterni backup kod"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleVerify}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                  loading={isVerifying}
                  disabled={useBackupCode ? backupCode.length < 8 : token.length !== 6}
                >
                  {!isVerifying && (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Verifikuj
                    </>
                  )}
                </Button>

                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled={isVerifying}
                >
                  Otkaži
                </Button>
              </div>

              {/* Toggle backup code */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setToken("");
                    setBackupCode("");
                  }}
                  disabled={isVerifying}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline disabled:opacity-50"
                >
                  {useBackupCode 
                    ? "← Koristi Authenticator kod" 
                    : "Koristi backup kod →"}
                </button>
              </div>

              {/* Help Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Problem sa prijavljivanjem?
                </h3>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Proveri da li je vreme na telefonu tačno (TOTP zavisi od vremena)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Ako ne možeš pristupiti telefonu, koristi backup kod</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Backup kodovi se mogu koristiti samo jednom</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Kontaktiraj podršku ako si izgubio/la pristup</span>
                  </li>
                </ul>
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <p className="text-xs text-green-800 dark:text-green-200 font-medium">
                  🔒 Tvoj nalog je zaštićen dvofaktorskom autentifikacijom
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
