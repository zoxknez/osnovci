/**
 * Rate Limit Feedback Component
 * Shows user-friendly rate limit messages with countdown
 */

"use client";

import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getChildFriendlyError } from "@/lib/utils/child-friendly-errors";
import { showErrorToast } from "./error-toast";

interface RateLimitFeedbackProps {
  retryAfter?: number; // seconds until retry
  limit?: number;
  remaining?: number;
  violations?: number;
  blockedUntil?: number;
  onRetry?: () => void;
}

/**
 * Format seconds to human-readable time
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sekundi`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minut${minutes !== 1 ? "a" : ""}`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (minutes === 0) {
    return `${hours} sat${hours !== 1 ? "a" : ""}`;
  }
  return `${hours}h ${minutes}min`;
}

/**
 * Rate Limit Feedback Card
 */
export function RateLimitFeedback({
  retryAfter,
  limit,
  remaining,
  violations = 0,
  blockedUntil,
  onRetry,
}: RateLimitFeedbackProps) {
  const [timeRemaining, setTimeRemaining] = useState(retryAfter || 0);

  useEffect(() => {
    if (!retryAfter && !blockedUntil) return;

    const targetTime = blockedUntil
      ? Math.floor((blockedUntil - Date.now()) / 1000)
      : retryAfter || 0;

    setTimeRemaining(Math.max(0, targetTime));

    const interval = setInterval(() => {
      const remaining = blockedUntil
        ? Math.floor((blockedUntil - Date.now()) / 1000)
        : (retryAfter || 0) -
          Math.floor(
            (Date.now() - (Date.now() - (retryAfter || 0) * 1000)) / 1000,
          );

      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter, blockedUntil]);

  const isBlocked =
    violations >= 5 || (blockedUntil && Date.now() < blockedUntil);
  const friendlyError = getChildFriendlyError(
    isBlocked ? "account_locked" : "timeout",
    isBlocked
      ? `Previše pokušaja. Sačekaj ${formatTimeRemaining(timeRemaining)}.`
      : `Previše zahteva. Pokušaj ponovo za ${formatTimeRemaining(timeRemaining)}.`,
  );

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-orange-100 p-3">
            {isBlocked ? (
              <AlertCircle className="h-6 w-6 text-orange-600" />
            ) : (
              <Clock className="h-6 w-6 text-orange-600" />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {isBlocked ? "Previše pokušaja" : "Previše zahteva"}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {friendlyError.message}
            </p>
            {timeRemaining > 0 && (
              <p className="text-xs text-orange-600 font-medium">
                Sačekaj {formatTimeRemaining(timeRemaining)}
              </p>
            )}
            {limit && remaining !== undefined && (
              <p className="text-xs text-gray-500 mt-2">
                Limit: {limit} zahteva | Preostalo: {remaining}
              </p>
            )}
            {violations > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                Prekršaji: {violations}
              </p>
            )}
          </div>

          {timeRemaining === 0 && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Pokušaj ponovo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Show rate limit error toast
 */
export function showRateLimitToast(
  retryAfter?: number,
  violations?: number,
  blockedUntil?: number,
) {
  const isBlocked = violations !== undefined && violations >= 5;
  const timeRemaining = blockedUntil
    ? Math.floor((blockedUntil - Date.now()) / 1000)
    : retryAfter || 0;

  const friendlyError = getChildFriendlyError(
    isBlocked ? "account_locked" : "timeout",
    isBlocked
      ? `Previše pokušaja. Sačekaj ${formatTimeRemaining(timeRemaining)}.`
      : `Previše zahteva. Pokušaj ponovo za ${formatTimeRemaining(timeRemaining)}.`,
  );

  const options: { error: Error; retry?: () => void } = {
    error: new Error(friendlyError.message),
  };

  if (timeRemaining === 0) {
    options.retry = () => window.location.reload();
  }

  showErrorToast(options);
}

/**
 * Parse rate limit headers from response
 */
export function parseRateLimitHeaders(
  headers: Headers,
): RateLimitFeedbackProps {
  const limit = headers.get("X-RateLimit-Limit");
  const remaining = headers.get("X-RateLimit-Remaining");
  const reset = headers.get("X-RateLimit-Reset");
  const retryAfter = headers.get("Retry-After");

  const result: RateLimitFeedbackProps = {};

  if (limit) result.limit = parseInt(limit, 10);
  if (remaining) result.remaining = parseInt(remaining, 10);
  if (retryAfter) result.retryAfter = parseInt(retryAfter, 10);
  if (reset) result.blockedUntil = parseInt(reset, 10) * 1000;

  return result;
}
