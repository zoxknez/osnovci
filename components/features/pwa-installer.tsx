// PWA Registration Component - modern approach
"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// TypeScript type for BeforeInstallPrompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstaller() {
  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered! 🚀", registration);

          // Check for updates every hour
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000,
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }

    // Handle app install prompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    window.addEventListener("beforeinstallprompt", (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;

      // Show custom install button/toast
      toast.info("Instaliraj Osnovci aplikaciju!", {
        duration: 10000,
        action: {
          label: "Instaliraj",
          onClick: async () => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              console.log(`User response: ${outcome}`);
              deferredPrompt = null;
            }
          },
        },
      });
    });

    // Detect if app is installed
    window.addEventListener("appinstalled", () => {
      console.log("App installed! 🎉");
      toast.success("Osnovci aplikacija instalirana! 🎉");
    });

    // Online/Offline status
    const handleOnline = () => {
      toast.success("Ponovo si online! 🌐");
    };

    const handleOffline = () => {
      toast.warning("Offline režim aktiviran 📱");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
