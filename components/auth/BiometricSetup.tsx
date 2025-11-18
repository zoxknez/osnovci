/**
 * Biometric Setup Component
 *
 * Allows users to:
 * - Enable biometric authentication (Face ID, Touch ID, Windows Hello)
 * - View registered devices
 * - Remove devices
 *
 * Usage:
 * ```tsx
 * <BiometricSetup />
 * ```
 */

"use client";

import {
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  Info,
  Laptop,
  Loader2,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";

export function BiometricSetup() {
  const {
    devices,
    isLoading,
    error,
    isSupported,
    register,
    removeDevice,
    clearError,
  } = useBiometricAuth();

  const [registerSuccess, setRegisterSuccess] = useState(false);

  /**
   * Handle registration button click
   */
  const handleRegister = async () => {
    try {
      setRegisterSuccess(false);
      await register();
      setRegisterSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setRegisterSuccess(false), 3000);
    } catch {
      // Error is handled by hook
    }
  };

  /**
   * Handle device removal
   */
  const handleRemoveDevice = async (credentialId: string) => {
    if (!confirm("Da li ste sigurni da želite da uklonite ovaj uređaj?")) {
      return;
    }

    try {
      await removeDevice(credentialId);
    } catch {
      // Error is handled by hook
    }
  };

  /**
   * Get icon based on device name
   */
  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes("phone") || name.includes("telefon")) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (name.includes("laptop") || name.includes("computer")) {
      return <Laptop className="h-5 w-5" />;
    }
    return <Fingerprint className="h-5 w-5" />;
  };

  // Show warning if not supported
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometrijska Autentifikacija
          </CardTitle>
          <CardDescription>
            Brža prijava pomoću otiska prsta, Face ID ili Windows Hello
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                Vaš pregledač ne podržava biometrijsku autentifikaciju.
                Pokušajte da koristite noviju verziju Chrome, Safari ili Edge
                pregledača.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometrijska Autentifikacija
        </CardTitle>
        <CardDescription>
          Brža prijava pomoću otiska prsta, Face ID ili Windows Hello
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success message */}
        {registerSuccess && (
          <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-950 p-4">
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-700" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Uređaj je uspešno registrovan! Sada možete da se prijavljujete
                pomoću biometrije.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Zatvori
              </Button>
            </div>
          </div>
        )}

        {/* Register button */}
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <p className="font-medium">Dodaj ovaj uređaj</p>
            <p className="text-sm text-muted-foreground">
              Omogući biometrijsku prijavu za ovaj uređaj
            </p>
          </div>
          <Button onClick={handleRegister} disabled={isLoading} size="sm">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registracija...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Dodaj
              </>
            )}
          </Button>
        </div>

        {/* Registered devices list */}
        {devices.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Registrovani uređaji</h3>
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(device.deviceName)}
                    <div>
                      <p className="font-medium text-sm">{device.deviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        Registrovan:{" "}
                        {new Date(device.createdAt).toLocaleDateString(
                          "sr-Latn-RS",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDevice(device.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {devices.length === 0 && !isLoading && (
          <div className="text-center py-6 border rounded-lg border-dashed">
            <Fingerprint className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Nemate registrovanih uređaja
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Dodajte uređaj da biste omogućili brzu biometrijsku prijavu
            </p>
          </div>
        )}

        {/* Info banner */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong>Napomena:</strong> Biometrijski podaci se čuvaju sigurno
              na vašem uređaju i nikada se ne šalju na server. Server čuva samo
              javni ključ koji se koristi za verifikaciju.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
