/**
 * Error Recovery Component
 * Omogućava korisniku da se oporavi od greške
 */

"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface ErrorRecoveryProps {
  error: Error;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function ErrorRecovery({
  error,
  onRetry,
  showHomeButton = true,
}: ErrorRecoveryProps) {
  const router = useRouter();

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          Nešto nije u redu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">
          {error.message || "Došlo je do neočekivane greške. Pokušaj ponovo."}
        </p>
        
        <div className="flex gap-2 flex-wrap">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Pokušaj ponovo
            </Button>
          )}
          
          {showHomeButton && (
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Nazad na početnu
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

