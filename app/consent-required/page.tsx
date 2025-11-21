// Consent Required Page - COPPA Compliance
"use client";

import { AlertTriangle, Home, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resendMyConsentEmailAction } from "@/app/actions/parental-consent";

export default function ConsentRequiredPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Potrebna saglasnost roditelja 👨‍👩‍👧
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Da bi koristio Osnovci aplikaciju, potrebna je saglasnost roditelja
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Šta treba da uradiš?
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Javi roditelju da je potrebna saglasnost</li>
              <li>Roditelj će dobiti email sa linkom za potvrdu</li>
              <li>
                Nakon što roditelj klikne na link, možeš da koristiš aplikaciju
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button
              onClick={async () => {
                // Trigger resend consent email
                try {
                  const response = await resendMyConsentEmailAction();

                  if (response.success) {
                    alert("Email poslat roditelju!");
                  } else {
                    alert(
                      response.error ||
                        "Greška pri slanju emaila. Pokušaj ponovo."
                    );
                  }
                } catch {
                  // Failed to send consent email
                  alert("Greška pri slanju emaila. Pokušaj ponovo.");
                }
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              <Mail className="mr-2 h-5 w-5" />
              Pošalji email roditelju
            </Button>

            {/* Demo Mode - Skip consent */}
            <Link href="/prijava">
              <Button
                variant="default"
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                size="lg"
              >
                🎮 Vrati se na prijavu
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline" className="w-full" size="lg">
                <Home className="mr-2 h-5 w-5" />
                Vrati se na početnu
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            Ova provera je deo COPPA/GDPR zaštite dece na internetu. 🛡️
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
