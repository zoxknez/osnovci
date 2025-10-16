// Porodica - Family Linking with QR Codes
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Eye,
  Link as LinkIcon,
  QrCode,
  Shield,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import QRCodeSVG from "react-qr-code";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/features/page-header";
import {
  staggerContainer,
  staggerItem,
} from "@/lib/animations/variants";

// Mock data - TODO: Replace with real API
const MOCK_FAMILY = [
  {
    id: "1",
    name: "Ana Marković",
    role: "GUARDIAN",
    relation: "Majka",
    avatar: null,
    permissions: [
      "view_grades",
      "view_homework",
      "view_schedule",
      "notifications",
    ],
    linkedAt: new Date("2024-09-01"),
  },
  {
    id: "2",
    name: "Petar Marković",
    role: "GUARDIAN",
    relation: "Otac",
    avatar: null,
    permissions: ["view_grades", "view_homework", "view_schedule"],
    linkedAt: new Date("2024-09-01"),
  },
];

const PERMISSION_OPTIONS = [
  { key: "view_grades", label: "Pregled ocena", icon: "📊" },
  { key: "view_homework", label: "Pregled domaćih", icon: "📚" },
  { key: "view_schedule", label: "Pregled rasporeda", icon: "📅" },
  { key: "view_attendance", label: "Pregled prisustva", icon: "✅" },
  { key: "notifications", label: "Notifikacije", icon: "🔔" },
  { key: "comments", label: "Komentari", icon: "💬" },
];

export default function PorodicaPage() {
  const [showQR, setShowQR] = useState(false);
  const [linkCode, setLinkCode] = useState("DEMO123");
  const [copied, setCopied] = useState(false);
  const [manualCode, setManualCode] = useState("");

  // Generate random 6-digit code
  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setLinkCode(code);
    toast.success("🎉 Novi kod generisan!");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(linkCode);
    setCopied(true);
    toast.success("📋 Kod kopiran!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualLink = () => {
    if (manualCode.length !== 6) {
      toast.error("Kod mora imati 6 karaktera");
      return;
    }
    toast.success("✅ Povezano!");
    setManualCode("");
  };

  const handleRemoveLink = (_id: string, name: string) => {
    // TODO: Implement real removal
    toast.success(`🗑️ ${name} je uklonjen/a iz porodice`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Header */}
      <PageHeader
        title="👨‍👩‍👧 Porodica"
        description="Poveži se sa roditeljima i starateljima"
        variant="pink"
        action={
          <Button
            size="lg"
            leftIcon={<QrCode className="h-5 w-5" />}
            onClick={() => setShowQR(!showQR)}
            aria-label={
              showQR
                ? "Sakrij QR kod za povezivanje"
                : "Prikaži QR kod za povezivanje sa roditeljima"
            }
            aria-expanded={showQR}
          >
            {showQR ? "Sakrij QR" : "Pokaži QR kod"}
          </Button>
        }
      />

      {/* QR Code Section */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
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
                      <QRCodeSVG
                        value={`OSNOVCI_LINK:${linkCode}`}
                        size={256}
                        level="H"
                      />
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
                              className="h-4 w-4 text-green-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">Kod važi 24 sata</p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={generateCode}
                      leftIcon={<LinkIcon className="h-4 w-4" />}
                      aria-label="Generiši novi 6-cifreni kod za povezivanje"
                    >
                      Generiši novi kod
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
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
            />
            <Button
              onClick={handleManualLink}
              leftIcon={<LinkIcon className="h-4 w-4" />}
              aria-label="Poveži se sa roditeljima koristeći kod"
              disabled={manualCode.length !== 6}
            >
              Poveži
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Family Members List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Povezani članovi ({MOCK_FAMILY.length})
        </h2>

        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {MOCK_FAMILY.map((member) => (
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
                          aria-label={`Ukloni ${member.name} iz porodične grupe`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
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
                        Povezano: {member.linkedAt.toLocaleDateString("sr-RS")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

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
