/**
 * AI Homework Helper Component
 * Pomaže učeniku da SAM reši zadatak kroz step-by-step guidance
 * NIKAD ne daje direktne odgovore
 */

"use client";

import { useState, useCallback } from "react";
import { Camera, Loader, Lightbulb, CheckCircle2, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { showErrorToast, showSuccessToast } from "@/components/features/error-toast";
import { ModernCamera } from "@/components/features/modern-camera";

interface Step {
  number: number;
  instruction: string;
  hint?: string;
  explanation: string;
  checkPoint?: string;
}

interface HomeworkHelpData {
  steps: Step[];
  encouragement: string;
  similarProblems?: Array<{
    problem: string;
    solutionSteps: string[];
  }>;
  learningTips: string[];
}

interface HomeworkHelperProps {
  homeworkId?: string;
  subject: string;
  grade: number;
  onClose?: () => void;
}

export function HomeworkHelper({
  homeworkId,
  subject,
  grade,
  onClose,
}: HomeworkHelperProps) {
  const [mode, setMode] = useState<"input" | "helping" | "complete">("input");
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [helpData, setHelpData] = useState<HomeworkHelpData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhotoCapture = async (file: File) => {
    try {
      // Upload photo
      const formData = new FormData();
      formData.append("file", file);
      formData.append("homeworkId", homeworkId || "");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setPhotoUrl(data.url);
      setCameraOpen(false);
      showSuccessToast("Fotografija je uspešno učitana!");
    } catch (error) {
      showErrorToast({
        error: error instanceof Error ? error : new Error("Greška pri upload-u"),
      });
    }
  };

  const handleGetHelp = useCallback(async () => {
    if (!text && !photoUrl) {
      showErrorToast({
        error: new Error("Unesi tekst zadatka ili slikaj zadatak"),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/homework-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          photoUrl,
          subject,
          grade,
          homeworkId,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get help");
      }

      const result = await response.json();
      setHelpData(result.data);
      setMode("helping");
      setCurrentStep(0);
      showSuccessToast("Evo koraka za rešavanje zadatka!");
    } catch (error) {
      showErrorToast({
        error: error instanceof Error ? error : new Error("Greška pri dobijanju pomoći"),
      });
    } finally {
      setIsLoading(false);
    }
  }, [text, photoUrl, subject, grade, homeworkId]);

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepNumber]));
    if (stepNumber < (helpData?.steps.length || 0) - 1) {
      setCurrentStep(stepNumber + 1);
    } else {
      setMode("complete");
    }
  };

  const currentStepData = helpData?.steps[currentStep];

  if (mode === "input") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Pomoćnik za Domaći
          </CardTitle>
          <CardDescription>
            Slikaj ili unesi zadatak, a ja ću te voditi kroz korake rešavanja. Neću ti dati direktan odgovor, već ću te naučiti kako da ga sam/la nađeš! 🎓
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tekst zadatka (ili slikaj ispod)</label>
            <Textarea
              placeholder="Unesi tekst zadatka ovde..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCameraOpen(true)}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Slikaj zadatak
            </Button>
          </div>

          {photoUrl && (
            <div className="relative">
              <img
                src={photoUrl}
                alt="Uploaded homework"
                className="w-full rounded-lg border"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2"
              >
                ✕
              </Button>
            </div>
          )}

          <Button
            onClick={handleGetHelp}
            disabled={isLoading || (!text && !photoUrl)}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Analiziram zadatak...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Pomozite mi da rešim zadatak
              </>
            )}
          </Button>

          {cameraOpen && (
            <ModernCamera
              onClose={() => setCameraOpen(false)}
              onCapture={handlePhotoCapture}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  if (mode === "helping" && helpData && currentStepData) {
    const progress = ((currentStep + 1) / helpData.steps.length) * 100;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Korak {currentStep + 1} od {helpData.steps.length}
            </CardTitle>
            <Badge variant="outline">{subject}</Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Encouragement */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium">
              {helpData.encouragement}
            </p>
          </div>

          {/* Current Step */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {currentStepData.number}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">
                  {currentStepData.instruction}
                </h3>
                <p className="text-gray-600">
                  {currentStepData.explanation}
                </p>
              </div>
            </div>

            {/* Hint */}
            {currentStepData.hint && (
              <div className="ml-14">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                  className="mb-2"
                >
                  💡 {showHint ? "Sakrij" : "Pokaži"} hint
                </Button>
                {showHint && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-900 whitespace-pre-line">
                      {currentStepData.hint}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Checkpoint */}
            {currentStepData.checkPoint && (
              <div className="ml-14 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-900 font-medium">
                  ✓ {currentStepData.checkPoint}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(currentStep - 1);
                  setShowHint(false);
                }}
              >
                ← Nazad
              </Button>
            )}
            <Button
              onClick={() => handleStepComplete(currentStep)}
              className="flex-1"
              disabled={completedSteps.has(currentStep)}
            >
              {completedSteps.has(currentStep) ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Završeno
                </>
              ) : (
                <>
                  Završio/la sam ovaj korak
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Learning Tips */}
          {helpData.learningTips.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Saveti za učenje
              </h4>
              <ul className="space-y-1">
                {helpData.learningTips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (mode === "complete" && helpData) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Čestitamo! Završio/la si sve korake! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Odlično! Prošao/la si kroz sve korake. Sada pokušaj da sam/la rešiš zadatak koristeći ove korake.
          </p>

          {/* Similar Problems */}
          {helpData.similarProblems && helpData.similarProblems.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Slični zadaci za vežbanje:</h4>
              {helpData.similarProblems.map((problem, idx) => (
                <Card key={idx} className="bg-white">
                  <CardContent className="p-4">
                    <p className="font-medium mb-2">{problem.problem}</p>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">Koraci za rešavanje:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {problem.solutionSteps.map((step, stepIdx) => (
                          <li key={stepIdx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMode("helping");
                setCurrentStep(0);
                setCompletedSteps(new Set());
              }}
            >
              Pregledaj korake ponovo
            </Button>
            <Button onClick={onClose} className="flex-1">
              Zatvori
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

