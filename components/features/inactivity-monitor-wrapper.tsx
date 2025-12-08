// Inactivity Monitor Wrapper - Client Component that uses the hook and shows warning

"use client";

import { useRouter } from "next/navigation";
import { useInactivityMonitor } from "@/hooks/use-inactivity-monitor";
import { InactivityWarning } from "./inactivity-warning";

export function InactivityMonitor() {
  const router = useRouter();

  const { remainingTime, showWarning, resetInactivity, forceLogout } =
    useInactivityMonitor({
      timeout: 30 * 60 * 1000, // 30 minutes
      warningTime: 2 * 60 * 1000, // 2 minutes warning
      onLogout: async () => {
        // Logout user - call API and redirect
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
          console.error("Logout failed", error);
        }
        router.push("/prijava?reason=inactivity");
      },
    });

  return (
    <InactivityWarning
      seconds={Math.floor(remainingTime / 1000)}
      open={showWarning}
      onExtend={resetInactivity}
      onLogout={forceLogout}
    />
  );
}
