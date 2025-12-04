/**
 * Loading component for auth routes
 * Displays a centered spinner while auth pages load
 */

import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Učitavanje...</p>
      </div>
    </div>
  );
}
