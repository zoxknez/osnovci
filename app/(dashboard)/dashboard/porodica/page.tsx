// Porodica - Family Linking with QR Codes
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Eye,
  Link as LinkIcon,
  Loader,
  QrCode,
  Shield,
  Trash2,
  UserPlus,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCodeSVG from "react-qr-code";
import { toast } from "sonner";
import {
  approveLinkAction,
  generateStudentQRAction,
  removeFamilyMemberAction,
} from "@/app/actions/family";
import { PageHeader } from "@/components/features/page-header";
import { SectionErrorBoundary } from "@/components/features/section-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOfflineFamily } from "@/hooks/use-offline-family";
import { staggerContainer, staggerItem } from "@/lib/animations/variants";
import { log } from "@/lib/logger";

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  relation: string;
  permissions: string[];
  linkedAt: Date;
}

const PERMISSION_OPTIONS = [
  { key: "view_grades", label: "Pregled ocena", icon: "📊" },
  { key: "view_homework", label: "Pregled domaćih", icon: "📚" },
  { key: "view_schedule", label: "Pregled rasporeda", icon: "📅" },
  { key: "view_attendance", label: "Pregled prisustva", icon: "✅" },
  { key: "notifications", label: "Notifikacije", icon: "🔔" },
  { key: "comments", label: "Komentari", icon: "💬" },
];

export default function PorodicaPage() {
  const {
    familyMembers: storedMembers,
    loading,
    isOnline,
    refresh,
  } = useOfflineFamily();
  const [showQR, setShowQR] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [qrData, setQrData] = useState("");
  const [copied, setCopied] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const toastShownRef = useRef(false);

  const familyMembers: FamilyMember[] = storedMembers.map((m) => ({
    ...m,
    linkedAt: new Date(m.linkedAt),
  }));

  // Generate link code via API
  const generateCode = useCallback(async () => {
    if (!isOnline) {
      toast.error("Potrebna je internet konekcija za generisanje koda");
      setStatusMessage("Potrebna je internet konekcija");
      return;
    }

    setIsGenerating(true);
    setStatusMessage("Generisanje koda u toku...");

    try {
      const result = await generateStudentQRAction();

      if (result.success && result.data) {
        setLinkCode(result.data.linkCode);
        setQrData(result.data.qrData);
        setStatusMessage("Kod uspešno generisan");
        toastShownRef.current = false;
      } else {
        throw new Error(result.error || "Greška pri generisanju koda");
      }
    } catch (error) {
      log.error("Failed to generate link code", error);
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        toast.error("Greška pri generisanju koda");
      }
      setStatusMessage("Greška pri generisanju koda");
    } finally {
      setIsGenerating(false);
    }
  }, [isOnline]);

  // Auto-generate code when QR is shown
  useEffect(() => {
    if (showQR && !linkCode && isOnline) {
      generateCode();
    }
  }, [showQR, linkCode, generateCode, isOnline]);

  const copyCode = () => {
    navigator.clipboard.writeText(linkCode);
    setCopied(true);
    toast.success("📋 Kod kopiran!");
    setStatusMessage("Kod kopiran u clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualLink = async () => {
    if (!isOnline) {
      toast.error("Potrebna je internet konekcija za povezivanje");
      setStatusMessage("Potrebna je internet konekcija");
      return;
    }

    if (manualCode.length !== 6) {
      toast.error("Kod mora imati 6 karaktera");
      setStatusMessage("Kod mora imati 6 karaktera");
      return;
    }

    setIsLinking(true);
    setStatusMessage("Povezivanje u toku...");

    try {
      const result = await approveLinkAction({
        linkCode: manualCode,
        approved: true,
      });
      if (result.success) {
        toast.success("✅ Povezano!");
        setStatusMessage("Uspešno povezano sa roditeljem");
        setManualCode("");
        refresh();
      } else {
        toast.error(result.error || "Greška pri povezivanju");
        setStatusMessage(result.error || "Greška pri povezivanju");
      }
    } catch (error) {
      log.error("Failed to link child", error, { linkCode: manualCode });
      setStatusMessage("Greška pri povezivanju");
    } finally {
      setIsLinking(false);
    }
  };

  const handleRemoveLink = async (id: string, name: string) => {
    if (!isOnline) {
      toast.error("Potrebna je internet konekcija za uklanjanje člana");
      setStatusMessage("Potrebna je internet konekcija");
      return;
    }

    setIsRemoving(id);
    setStatusMessage(`Uklanjanje ${name}...`);

    try {
      const result = await removeFamilyMemberAction(id);
      if (result.success) {
        toast.success(`🗑️ ${name} je uklonjen/a iz porodice`);
        setStatusMessage(`${name} je uklonjen/a iz porodice`);
        refresh();
      } else {
        toast.error(result.error || "Greška pri uklanjanju člana");
        setStatusMessage(result.error || "Greška pri uklanjanju člana");
      }
    } catch (error) {
      log.error("Failed to remove family link", error, { linkId: id, name });
      setStatusMessage("Greška pri uklanjanju člana");
    } finally {
      setIsRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="👨‍👩‍👧 Porodica"
          description="Poveži se sa roditeljima i starateljima"
          variant="pink"
        />
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-pink-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Header */}
      <PageHeader
        title="👨‍👩‍👧 Porodica"
        description="Poveži se sa roditeljima i starateljima"
        variant="pink"
        action={
          <div className="flex gap-2 items-center">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>
            <Button
              size="lg"
              leftIcon={<QrCode className="h-5 w-5" />}
              onClick={() => setShowQR(!showQR)}
              disabled={!isOnline}
              aria-label={
                showQR
                  ? "Sakrij QR kod za povezivanje"
                  : "Prikaži QR kod za povezivanje sa roditeljima"
              }
              aria-expanded={showQR}
            >
              {showQR ? "Sakrij QR" : "Pokaži QR kod"}
            </Button>
          </div>
        }
      />

      {/* Aria-live region for screen readers */}
      <output aria-live="polite" className="sr-only">
        {statusMessage}
      </output>

      {/* QR Code Section */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SectionErrorBoundary sectionName="QR Kod">
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <div className="grid gap-8 lg:grid-cols-2">
                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center gap-6">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="bg-white p-6 rounded-xl shadow-lg"
                      >
                        {isGenerating ? (
                          <div className="w-64 h-64 flex items-center justify-center">
                            <Loader className="h-8 w-8 animate-spin text-blue-600" />
                          </div>
                        ) : linkCode ? (
                          <div
                            role="img"
                            aria-label={`QR kod za povezivanje sa kodom ${linkCode}`}
                          >
                            <QRCodeSVG
                              value={qrData || `OSNOVCI_LINK:${linkCode}`}
                              size={256}
                              level="H"
                            />
                          </div>
                        ) : (
                          <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                            <p>Kliknite "Generiši kod" da dobijete QR</p>
                          </div>
                        )}
                      </motion.div>

                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <code className="text-3xl font-bold text-blue-600 bg-blue-50 px-6 py-3 rounded-lg">
                            {linkCode}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyCode}
                            aria-label={
                              copied
                                ? "Kod kopiran u clipboard"
                                : "Kopiraj kod u clipboard"
                            }
                          >
                            {copied ? (
                              <Check
                                className="h-4 w-4 text-green-700"
                                aria-hidden="true"
                              />
                            ) : (
                              <Copy className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">
                          Kod važi 24 sata
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        onClick={generateCode}
                        disabled={isGenerating}
                        leftIcon={
                          isGenerating ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <LinkIcon className="h-4 w-4" />
                          )
                        }
                        aria-label="Generiši novi 6-cifreni kod za povezivanje"
                      >
                        {isGenerating ? "Generisanje..." : "Generiši novi kod"}
                      </Button>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          📱 Kako povezati?
                        </h3>
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              1
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                Skeniraj QR kod
                              </div>
                              <div className="text-sm text-gray-600">
                                Roditelj skenira ovaj kod kroz svoju aplikaciju
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              2
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                Ili unesi kod ručno
                              </div>
                              <div className="text-sm text-gray-600">
                                Upiši 6-cifreni kod u roditeljevoj aplikaciji
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              3
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                Potvrda
                              </div>
                              <div className="text-sm text-gray-600">
                                Roditelj će biti odmah povezan sa tvojim nalogom
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Security Note */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex gap-3">
                          <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-amber-900 mb-1">
                              Sigurnosna napomena
                            </div>
                            <div className="text-sm text-amber-700">
                              Kod deli samo sa roditeljima/starateljima. Kada se
                              povežu, moći će da vide tvoje ocene, domaće i
                              raspored.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SectionErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Link Section */}
      <SectionErrorBoundary sectionName="Ručno Povezivanje">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              Povežite se ručno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Unesi 6-cifreni kod..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                maxLength={6}
                showCharCount
                helperText="Unesi kod koji ti je dao roditelj"
                className="flex-1"
                aria-label="Kod za povezivanje sa roditeljima"
                disabled={isLinking}
              />
              <Button
                onClick={handleManualLink}
                leftIcon={
                  isLinking ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )
                }
                aria-label="Poveži se sa roditeljima koristeći kod"
                disabled={manualCode.length !== 6 || isLinking}
              >
                {isLinking ? "Povezivanje..." : "Poveži"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </SectionErrorBoundary>

      {/* Family Members List */}
      <SectionErrorBoundary sectionName="Članovi Porodice">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Povezani članovi ({familyMembers.length})
          </h2>

          {familyMembers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">
                  Još nema povezanih članova porodice
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              className="grid gap-4 sm:grid-cols-2"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {familyMembers.map((member) => (
                <motion.div key={member.id} variants={staggerItem}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                          {member.name.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {member.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {member.relation}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                handleRemoveLink(member.id, member.name)
                              }
                              disabled={isRemoving === member.id}
                              aria-label={`Ukloni ${member.name} iz porodične grupe`}
                            >
                              {isRemoving === member.id ? (
                                <Loader
                                  className="h-4 w-4 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Trash2
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              )}
                            </Button>
                          </div>

                          {/* Permissions */}
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-700">
                              Dozvole:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {member.permissions.map((perm) => {
                                const option = PERMISSION_OPTIONS.find(
                                  (p) => p.key === perm,
                                );
                                return (
                                  <span
                                    key={perm}
                                    className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                                  >
                                    <span>{option?.icon}</span>
                                    <span>{option?.label}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Linked Date */}
                          <div className="mt-3 text-xs text-gray-500">
                            Povezano:{" "}
                            {new Date(member.linkedAt).toLocaleDateString(
                              "sr-RS",
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </SectionErrorBoundary>

      {/* Permissions Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Upravljanje dozvolama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Podesi koje informacije roditelji mogu da vide
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {PERMISSION_OPTIONS.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{option.icon}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {option.label}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Zašto povezati roditelje?
              </h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ Roditelji mogu pratiti tvoj napredak</li>
                <li>✅ Automatska notifikacija za nove ocene</li>
                <li>✅ Lakša komunikacija sa školom</li>
                <li>✅ Podrška i pomoć oko domaćih</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
