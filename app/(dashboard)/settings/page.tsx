/**
 * Settings Page
 * Centralna stranica za sva podešavanja aplikacije
 */

import { Bell, Eye, Shield, User } from "lucide-react";
import { redirect } from "next/navigation";
import { DyslexiaSettings } from "@/components/features/accessibility/dyslexia-settings";
import { PageHeader } from "@/components/features/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth/config";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/prijava");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="⚙️ Podešavanja"
        description="Prilagodi aplikaciju svojim potrebama"
        variant="blue"
      />

      <Tabs defaultValue="accessibility" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger
            value="accessibility"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Pristupačnost
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifikacije
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privatnost
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accessibility" className="space-y-4">
          <DyslexiaSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikacije</CardTitle>
              <CardDescription>
                Upravljaj kako i kada primaš obaveštenja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Notifikacije će biti dostupne uskoro.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privatnost i Bezbednost</CardTitle>
              <CardDescription>
                Upravljaj svojim privatnim podacima
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Podešavanja privatnosti će biti dostupna uskoro.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>
                Upravljaj informacijama o svom profilu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Podešavanja profila će biti dostupna uskoro.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
