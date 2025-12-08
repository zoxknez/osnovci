// 2FA Settings Page - Enable/Disable Two-Factor Authentication
// Complete UI with QR code, backup codes, and management

"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Key,
  QrCode,
  Shield,
  ShieldAlert,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Setup2FAData {
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export default function TwoFactorSettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  // Setup flow states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [password, setPassword] = useState("");
  const [setupData, setSetupData] = useState<Setup2FAData | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  const [setupStep, setSetupStep] = useState<
    "password" | "scan" | "verify" | "backup"
  >("password");

  // Check 2FA status on mount
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await fetch("/api/auth/2fa/status");
      const data = await response.json();

      if (response.ok) {
        setTwoFactorEnabled(data.enabled);
      }
    } catch (error) {
      toast.error("Greška pri učitavanju 2FA statusa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSetup = () => {
    setShowSetupModal(true);
    setSetupStep("password");
    setPassword("");
    setSetupData(null);
    setVerificationToken("");
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast.error("Unesi lozinku");
      return;
    }

    setIsEnabling(true);

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Pogrešna lozinka");
        setIsEnabling(false);
        return;
      }

      setSetupData({
        qrCodeDataUrl: data.qrCodeDataUrl,
        backupCodes: data.backupCodes,
      });
      setSetupStep("scan");
    } catch (error) {
      toast.error("Greška pri generisanju QR koda");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerifyToken = async () => {
    if (verificationToken.length !== 6) {
      toast.error("Kod mora imati 6 cifara");
      return;
    }

    setIsEnabling(true);

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Nevažeći kod");
        setIsEnabling(false);
        return;
      }

      toast.success("2FA uspešno omogućen! 🎉");
      setSetupStep("backup");
      setTwoFactorEnabled(true);
    } catch (error) {
      toast.error("Greška pri verifikaciji koda");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password) {
      toast.error("Unesi lozinku za potvrdu");
      return;
    }

    setIsDisabling(true);

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Pogrešna lozinka");
        setIsDisabling(false);
        return;
      }

      toast.success("2FA je onemogućen");
      setTwoFactorEnabled(false);
      setShowSetupModal(false);
      setPassword("");
    } catch (error) {
      toast.error("Greška pri onemogućavanju 2FA");
    } finally {
      setIsDisabling(false);
    }
  };

  const copyBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const text = setupData.backupCodes
      .map((code, i) => `${i + 1}. ${code}`)
      .join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Backup kodovi kopirani u clipboard!");
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const text = [
      "OSNOVCI - 2FA BACKUP KODOVI",
      "=".repeat(50),
      "",
      "⚠️ VAŽNO: Čuvaj ove kodove na sigurnom mestu!",
      "- Svaki kod se može koristiti samo jednom",
      "- Potrebni su ako izgubiš pristup Authenticator aplikaciji",
      "- NIKADA ih ne deli sa drugima",
      "",
      "BACKUP KODOVI:",
      "",
      ...setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`),
      "",
      "=".repeat(50),
      `Generisano: ${new Date().toLocaleString("sr-Latn")}`,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `osnovci-2fa-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Backup kodovi preuzeti!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dvofaktorska Autentifikacija (2FA)
          </h1>
          <p className="text-gray-600">Dodatni sloj zaštite za tvoj nalog</p>
        </motion.div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {twoFactorEnabled ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-orange-600" />
                  )}
                  Status 2FA
                </CardTitle>
                <CardDescription>
                  {twoFactorEnabled
                    ? "Tvoj nalog je zaštićen sa 2FA"
                    : "Tvoj nalog nije zaštićen sa 2FA"}
                </CardDescription>
              </div>
              <div
                className={`px-4 py-2 rounded-full font-semibold ${
                  twoFactorEnabled
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {twoFactorEnabled ? "Omogućeno" : "Onemogućeno"}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!twoFactorEnabled ? (
              <Button
                onClick={handleStartSetup}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                size="lg"
              >
                <Shield className="mr-2 h-5 w-5" />
                Omogući 2FA
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Pri svakoj prijavi će biti potreban 6-cifreni kod iz
                    Authenticator aplikacije
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowSetupModal(true);
                    setSetupStep("password");
                  }}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <X className="mr-2 h-5 w-5" />
                  Onemogući 2FA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                Šta je 2FA?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                Dvofaktorska autentifikacija (2FA) dodaje dodatni sloj
                sigurnosti za tvoj nalog.
              </p>
              <p>
                Pored lozinke, potreban ti je i 6-cifreni kod iz mobilne
                aplikacije.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-600" />
                Kako funkcioniše?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>1. Instaliraj Google Authenticator ili Authy</p>
              <p>2. Skeniraj QR kod</p>
              <p>3. Unesi 6-cifreni kod pri svakoj prijavi</p>
            </CardContent>
          </Card>
        </div>

        {/* Setup Modal */}
        {showSetupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

              <div className="p-6">
                {/* Step: Password Verification */}
                {setupStep === "password" && !twoFactorEnabled && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <Key className="h-8 w-8 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Omogući 2FA</h2>
                      <p className="text-gray-600">
                        Potvrdi svoju lozinku za nastavak
                      </p>
                    </div>

                    <Input
                      label="Lozinka"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isEnabling}
                      autoFocus
                    />

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowSetupModal(false)}
                        variant="outline"
                        className="flex-1"
                        disabled={isEnabling}
                      >
                        Otkaži
                      </Button>
                      <Button
                        onClick={handlePasswordSubmit}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                        loading={isEnabling}
                        disabled={!password}
                      >
                        Nastavi
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step: Password for Disable */}
                {setupStep === "password" && twoFactorEnabled && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Onemogući 2FA</h2>
                      <p className="text-gray-600">
                        Potvrdi svoju lozinku za nastavak
                      </p>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-semibold mb-1">Upozorenje</p>
                          <p>Tvoj nalog će biti manje siguran bez 2FA.</p>
                        </div>
                      </div>
                    </div>

                    <Input
                      label="Lozinka"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isDisabling}
                      autoFocus
                    />

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowSetupModal(false)}
                        variant="outline"
                        className="flex-1"
                        disabled={isDisabling}
                      >
                        Otkaži
                      </Button>
                      <Button
                        onClick={handleDisable2FA}
                        variant="destructive"
                        className="flex-1"
                        loading={isDisabling}
                        disabled={!password}
                      >
                        Onemogući 2FA
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step: Scan QR Code */}
                {setupStep === "scan" && setupData && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                        <QrCode className="h-8 w-8 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">
                        Skeniraj QR Kod
                      </h2>
                      <p className="text-gray-600">
                        Koristi Google Authenticator ili Authy
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                      <img
                        src={setupData.qrCodeDataUrl}
                        alt="2FA QR Code"
                        className="w-full max-w-sm mx-auto"
                      />
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium mb-2">
                        📱 Koraci:
                      </p>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Instaliraj Google Authenticator ili Authy</li>
                        <li>Otvori aplikaciju i dodaj novi nalog</li>
                        <li>Skeniraj ovaj QR kod</li>
                        <li>Unesi 6-cifreni kod u sledećem koraku</li>
                      </ol>
                    </div>

                    <Button
                      onClick={() => setSetupStep("verify")}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                      size="lg"
                    >
                      Nastavi →
                    </Button>
                  </div>
                )}

                {/* Step: Verify Token */}
                {setupStep === "verify" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Verifikuj Kod</h2>
                      <p className="text-gray-600">
                        Unesi 6-cifreni kod iz aplikacije
                      </p>
                    </div>

                    <Input
                      label="6-cifreni kod"
                      type="text"
                      value={verificationToken}
                      onChange={(e) =>
                        setVerificationToken(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      placeholder="123456"
                      maxLength={6}
                      disabled={isEnabling}
                      autoFocus
                    />

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setSetupStep("scan")}
                        variant="outline"
                        className="flex-1"
                        disabled={isEnabling}
                      >
                        ← Nazad
                      </Button>
                      <Button
                        onClick={handleVerifyToken}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                        loading={isEnabling}
                        disabled={verificationToken.length !== 6}
                      >
                        Verifikuj
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step: Backup Codes */}
                {setupStep === "backup" && setupData && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Key className="h-8 w-8 text-yellow-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">
                        Sačuvaj Backup Kodove
                      </h2>
                      <p className="text-gray-600">
                        Potrebni su ako izgubiš pristup telefonu
                      </p>
                    </div>

                    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-900">
                          <p className="font-semibold mb-1">⚠️ VAŽNO!</p>
                          <p>
                            Svaki kod se može koristiti samo jednom. Čuvaj ih na
                            sigurnom mestu!
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-yellow-200 font-mono text-sm">
                        {setupData.backupCodes.map((code, i) => (
                          <div key={i} className="py-1">
                            {i + 1}. {code}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={copyBackupCodes}
                        variant="outline"
                        className="flex-1"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Kopiraj
                      </Button>
                      <Button
                        onClick={downloadBackupCodes}
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Preuzmi
                      </Button>
                    </div>

                    <Button
                      onClick={() => {
                        setShowSetupModal(false);
                        toast.success("2FA je sada aktivan! 🎉");
                      }}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                      size="lg"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Završi
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
