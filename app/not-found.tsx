/**
 * 404 Not Found Page
 * Prikazuje se kada korisnik poseti nepostojeću stranicu
 */

import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Animated 404 */}
        <div className="relative">
          <h1 className="text-[120px] md:text-[180px] font-bold text-muted-foreground/20 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-16 w-16 text-muted-foreground/50 animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Stranica nije pronađena
          </h2>
          <p className="text-muted-foreground">
            Izgleda da si se izgubio/la! Stranica koju tražiš ne postoji ili je
            premeštena.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" size="lg">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Početna stranica
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Vrati se nazad
            </Link>
          </Button>
        </div>

        {/* Helpful tips */}
        <div className="pt-6 border-t text-sm text-muted-foreground">
          <p>Možda si hteo/htela da posetiš:</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Link
              href="/dashboard/domaci"
              className="text-primary hover:underline"
            >
              Domaći zadaci
            </Link>
            <span>•</span>
            <Link
              href="/dashboard/ocene"
              className="text-primary hover:underline"
            >
              Ocene
            </Link>
            <span>•</span>
            <Link
              href="/dashboard/raspored"
              className="text-primary hover:underline"
            >
              Raspored
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
