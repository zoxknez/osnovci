/**
 * Enhanced Error Toast Component
 * Provides better error feedback with retry options
 */

"use client";

import { toast } from "sonner";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChildFriendlyError } from "@/lib/utils/child-friendly-errors";

interface ErrorToastOptions {
  error: Error | string;
  retry?: () => void | Promise<void>;
  dismissible?: boolean;
  duration?: number;
}

/**
 * Show user-friendly error toast with retry option
 */
export function showErrorToast({ 
  error, 
  retry, 
  dismissible = true,
  duration = 5000 
}: ErrorToastOptions) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  // Try to get child-friendly error message
  let friendlyError;
  try {
    // Extract error code if available
    const errorCode = error instanceof Error && 'code' in error 
      ? (error as any).code 
      : errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')
        ? 'network_error'
        : errorMessage.toLowerCase().includes('timeout')
          ? 'timeout'
          : '500';
    
    friendlyError = getChildFriendlyError(errorCode, errorMessage);
  } catch {
    friendlyError = {
      emoji: "😕",
      title: "Ups! Nešto nije u redu",
      message: errorMessage,
      action: "OK",
      color: "red",
    };
  }

  const toastId = toast.error(friendlyError.title, {
    description: friendlyError.message,
    duration: duration,
    icon: <AlertCircle className="h-5 w-5" />,
    action: retry ? {
      label: "Pokušaj ponovo",
      onClick: async () => {
        try {
          await retry();
          toast.success("Uspešno!", {
            description: "Akcija je ponovljena.",
          });
        } catch (err) {
          showErrorToast({ error: err as Error, retry });
        }
      },
    } : undefined,
    cancel: dismissible ? {
      label: "Zatvori",
      onClick: () => toast.dismiss(toastId),
    } : undefined,
  });

  return toastId;
}

/**
 * Show success toast with action
 */
export function showSuccessToast(
  title: string,
  description?: string,
  action?: {
    label: string;
    onClick: () => void;
  }
) {
  return toast.success(title, {
    description,
    duration: 3000,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  });
}

/**
 * Show loading toast that can be updated
 */
export function showLoadingToast(message: string) {
  return toast.loading(message, {
    duration: Infinity,
  });
}

/**
 * Update loading toast to success/error
 */
export function updateToast(
  toastId: string | number,
  type: "success" | "error",
  message: string,
  description?: string
) {
  if (type === "success") {
    toast.success(message, {
      id: toastId,
      description,
      duration: 3000,
    });
  } else {
    toast.error(message, {
      id: toastId,
      description,
      duration: 5000,
    });
  }
}

