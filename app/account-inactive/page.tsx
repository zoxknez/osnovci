// Account Inactive Page
"use client";

import { Home, Mail, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccountInactivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Nalog je neaktivan 🚫
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Tvoj nalog trenutno nije aktivan
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">
              Mogući razlozi:
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-yellow-800">
              <li>Nalog je deaktiviran od strane roditelja</li>
              <li>Nije potvrđena email adresa</li>
              <li>Privremena suspenzija zbog kršenja pravila</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                // Open email client to contact support
                window.location.href =
                  "mailto:podrska@osnovci.rs?subject=Neaktivan nalog&body=Pozdrav, moj nalog je neaktivan i trebam pomoć. Hvala!";
              }}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              size="lg"
            >
              <Mail className="mr-2 h-5 w-5" />
              Kontaktiraj podršku
            </Button>

            <Link href="/">
              <Button variant="outline" className="w-full" size="lg">
                <Home className="mr-2 h-5 w-5" />
                Vrati se na početnu
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            Za dodatna pitanja, kontaktiraj roditelja ili podršku. 🙋‍♂️
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
