"use client";

/**
 * Conflict Resolver Component
 *
 * Visual diff viewer and conflict resolution UI for optimistic locking.
 * Shows field-level differences between client and server data.
 * Allows user to choose which version to keep or manually merge.
 *
 * Features:
 * - Side-by-side diff view
 * - Conflict highlighting
 * - Quick resolution strategies (client wins, server wins, smart merge)
 * - Manual field selection
 * - Change preview before applying
 *
 * @module components/features/conflicts/conflict-resolver
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  User,
  Server,
  Zap,
  FileText,
} from "lucide-react";
import {
  type VersionConflictError,
  type ConflictStrategy,
  type ConflictResolution,
  generateConflictReport,
  getConflictSummary,
  resolveConflict,
} from "@/lib/conflicts/optimistic-locking";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ConflictResolverProps {
  conflict: VersionConflictError;
  clientData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  onResolve: (resolution: ConflictResolution) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConflictResolver({
  conflict,
  clientData,
  serverData,
  onResolve,
  onCancel,
  isLoading = false,
}: ConflictResolverProps) {
  const [selectedStrategy, setSelectedStrategy] =
    useState<ConflictStrategy | null>(null);
  const [manualSelections, setManualSelections] = useState<
    Record<string, "client" | "server">
  >({});

  const summary = getConflictSummary(conflict);

  // Get severity color
  const severityColor = {
    low: "text-blue-600 bg-blue-50",
    medium: "text-yellow-600 bg-yellow-50",
    high: "text-red-600 bg-red-50",
  }[summary.severity];

  // Handle strategy selection
  const handleStrategySelect = (strategy: ConflictStrategy) => {
    setSelectedStrategy(strategy);
  };

  // Handle manual field selection
  const handleFieldSelect = (field: string, source: "client" | "server") => {
    setManualSelections((prev) => ({
      ...prev,
      [field]: source,
    }));
  };

  // Generate manual resolution
  const generateManualResolution = (): ConflictResolution => {
    const resolvedData: Record<string, unknown> = { ...serverData };
    const mergedFields: string[] = [];
    const conflictedFields: string[] = [];

    for (const diff of conflict.diff) {
      const selection = manualSelections[diff.field];

      if (selection === "client") {
        resolvedData[diff.field] = diff.clientValue;
        mergedFields.push(diff.field);
      } else if (selection === "server") {
        // Already in resolvedData
        mergedFields.push(diff.field);
      } else if (diff.isConflict) {
        // Unresolved conflict
        conflictedFields.push(diff.field);
      }
    }

    return {
      strategy: "MANUAL",
      resolvedData,
      newVersion: conflict.serverVersion + 1,
      mergedFields,
      conflictedFields,
    };
  };

  // Handle apply resolution
  const handleApply = async () => {
    let resolution: ConflictResolution;

    if (selectedStrategy === "MANUAL") {
      resolution = generateManualResolution();

      // Check if all conflicts are resolved
      if (resolution.conflictedFields.length > 0) {
        alert(
          `Molimo odaberite vrednost za sva polja sa konfliktom (${resolution.conflictedFields.length})`
        );
        return;
      }
    } else if (selectedStrategy) {
      resolution = await resolveConflict(
        selectedStrategy,
        clientData,
        serverData,
        conflict.diff
      );
    } else {
      return;
    }

    onResolve(resolution);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${severityColor}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Detektovan Konflikt Promena</CardTitle>
              <CardDescription className="mt-2">
                Dok ste Vi radili offline, neko drugi je takođe promenio iste podatke.
                Odaberite kako želite da rešite konflikt.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Conflict Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-sm text-muted-foreground">Ukupno Polja</div>
              <div className="mt-1 text-2xl font-bold">{summary.totalFields}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-sm text-muted-foreground">Polja sa Konfliktom</div>
              <div className="mt-1 text-2xl font-bold text-red-600">
                {summary.conflictedFields}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-sm text-muted-foreground">Druge Promene</div>
              <div className="mt-1 text-2xl font-bold text-blue-600">
                {summary.changedFields}
              </div>
            </div>
          </div>

          {/* Version Info */}
          <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex-1">
              <div className="text-sm font-medium">Vaša Verzija</div>
              <Badge variant="outline" className="mt-1">
                v{conflict.clientVersion}
              </Badge>
            </div>
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Verzija na Serveru</div>
              <Badge variant="outline" className="mt-1">
                v{conflict.serverVersion}
              </Badge>
            </div>
          </div>

          {/* Resolution Strategies */}
          <div className="space-y-3">
            <h3 className="font-semibold">Strategija Rešavanja</h3>

            <div className="grid gap-3">
              {/* Client Wins */}
              <button
                onClick={() => handleStrategySelect("CLIENT_WINS")}
                disabled={isLoading}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors hover:bg-muted/50 ${
                  selectedStrategy === "CLIENT_WINS"
                    ? "border-blue-500 bg-blue-50"
                    : "border-border"
                }`}
              >
                <User className="h-5 w-5 shrink-0 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium">Moje Promene Pobeduju</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Zadržava sve Vaše promene i odbacuje promene sa servera.
                  </div>
                </div>
                {selectedStrategy === "CLIENT_WINS" && (
                  <Check className="h-5 w-5 shrink-0 text-blue-600" />
                )}
              </button>

              {/* Server Wins */}
              <button
                onClick={() => handleStrategySelect("SERVER_WINS")}
                disabled={isLoading}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors hover:bg-muted/50 ${
                  selectedStrategy === "SERVER_WINS"
                    ? "border-purple-500 bg-purple-50"
                    : "border-border"
                }`}
              >
                <Server className="h-5 w-5 shrink-0 text-purple-600" />
                <div className="flex-1">
                  <div className="font-medium">Promene sa Servera Pobeduju</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Odbacuje Vaše promene i zadržava promene sa servera.
                  </div>
                </div>
                {selectedStrategy === "SERVER_WINS" && (
                  <Check className="h-5 w-5 shrink-0 text-purple-600" />
                )}
              </button>

              {/* Smart Merge */}
              <button
                onClick={() => handleStrategySelect("SMART_MERGE")}
                disabled={isLoading}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors hover:bg-muted/50 ${
                  selectedStrategy === "SMART_MERGE"
                    ? "border-green-500 bg-green-50"
                    : "border-border"
                }`}
              >
                <Zap className="h-5 w-5 shrink-0 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium">Pametno Spajanje</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Automatski spaja promene koje se ne sukobljavaju. Za konflikte koristi
                    promene sa servera.
                  </div>
                </div>
                {selectedStrategy === "SMART_MERGE" && (
                  <Check className="h-5 w-5 shrink-0 text-green-600" />
                )}
              </button>

              {/* Manual */}
              <button
                onClick={() => handleStrategySelect("MANUAL")}
                disabled={isLoading}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors hover:bg-muted/50 ${
                  selectedStrategy === "MANUAL"
                    ? "border-orange-500 bg-orange-50"
                    : "border-border"
                }`}
              >
                <FileText className="h-5 w-5 shrink-0 text-orange-600" />
                <div className="flex-1">
                  <div className="font-medium">Ručno Rešavanje</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Ručno odaberite vrednost za svako polje sa konfliktom.
                  </div>
                </div>
                {selectedStrategy === "MANUAL" && (
                  <Check className="h-5 w-5 shrink-0 text-orange-600" />
                )}
              </button>
            </div>
          </div>

          {/* Manual Selection */}
          <AnimatePresence>
            {selectedStrategy === "MANUAL" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <h3 className="font-semibold">Odaberite Vrednost za Svako Polje</h3>

                <div className="space-y-2">
                  {conflict.diff.map((diff) => (
                    <div
                      key={diff.field}
                      className={`rounded-lg border p-4 ${
                        diff.isConflict ? "border-red-300 bg-red-50" : "border-border"
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {diff.field}
                            {diff.isConflict && (
                              <Badge variant="destructive" className="ml-2">
                                Konflikt
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {diff.description}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {/* Client Value */}
                        <button
                          onClick={() => handleFieldSelect(diff.field, "client")}
                          className={`rounded-lg border-2 p-3 text-left transition-colors ${
                            manualSelections[diff.field] === "client"
                              ? "border-blue-500 bg-blue-50"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                            <User className="h-4 w-4" />
                            <span>Moja Vrednost</span>
                          </div>
                          <div className="text-sm">
                            {String(diff.clientValue ?? "prazno")}
                          </div>
                          {manualSelections[diff.field] === "client" && (
                            <Check className="mt-2 h-4 w-4 text-blue-600" />
                          )}
                        </button>

                        {/* Server Value */}
                        <button
                          onClick={() => handleFieldSelect(diff.field, "server")}
                          className={`rounded-lg border-2 p-3 text-left transition-colors ${
                            manualSelections[diff.field] === "server"
                              ? "border-purple-500 bg-purple-50"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                            <Server className="h-4 w-4" />
                            <span>Vrednost sa Servera</span>
                          </div>
                          <div className="text-sm">
                            {String(diff.serverValue ?? "prazno")}
                          </div>
                          {manualSelections[diff.field] === "server" && (
                            <Check className="mt-2 h-4 w-4 text-purple-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detailed Diff (Accordion) */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger className="text-sm font-medium">
                Detaljan Pregled Promena
              </AccordionTrigger>
              <AccordionContent>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">
                  {generateConflictReport(conflict)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Actions */}
          <div className="flex gap-3 border-t pt-6">
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Otkaži
            </Button>
            <Button
              onClick={handleApply}
              disabled={isLoading || !selectedStrategy}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Primenjujem...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Primeni Rešenje
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
