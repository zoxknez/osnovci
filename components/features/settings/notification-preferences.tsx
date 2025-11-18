// Notification Preferences Settings Component
// Granular control with categorized event types

"use client";

import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NotificationPreference {
  eventType: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

interface GroupedPreferences {
  homework: NotificationPreference[];
  grades: NotificationPreference[];
  schedule: NotificationPreference[];
  family: NotificationPreference[];
  safety: NotificationPreference[];
  account: NotificationPreference[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  HOMEWORK_ASSIGNED: "Novi domaći zadatak",
  HOMEWORK_DUE_SOON: "Domaći uskoro ističe (24h)",
  HOMEWORK_OVERDUE: "Domaći prekoračen",
  HOMEWORK_SUBMITTED: "Domaći predat",
  HOMEWORK_REVIEWED: "Domaći pregledan",
  GRADE_ADDED: "Nova ocena",
  GRADE_UPDATED: "Ocena izmenjena",
  SCHEDULE_CHANGED: "Raspored promenjen",
  EVENT_REMINDER: "Podsetnik za događaj",
  LINK_REQUEST: "Zahtev za povezivanje",
  LINK_APPROVED: "Veza odobrena",
  CONTENT_MODERATION: "Neprikladan sadržaj",
  SAFETY_ALERT: "Bezbednosni alert",
  LOGIN_NEW_DEVICE: "Prijava sa novog uređaja",
  PASSWORD_CHANGED: "Lozinka promenjena",
  TWO_FACTOR_ENABLED: "2FA omogućen",
};

const CATEGORY_INFO = {
  homework: {
    icon: "📚",
    title: "Domaći Zadaci",
    description: "Notifikacije o domaćim zadacima",
  },
  grades: {
    icon: "📊",
    title: "Ocene",
    description: "Notifikacije o ocenama",
  },
  schedule: {
    icon: "📅",
    title: "Raspored i Događaji",
    description: "Notifikacije o rasporedu i događajima",
  },
  family: {
    icon: "👨‍👩‍👧",
    title: "Porodica",
    description: "Notifikacije o povezivanju sa roditeljima",
  },
  safety: {
    icon: "🛡️",
    title: "Bezbednost",
    description: "Važne bezbednosne notifikacije",
  },
  account: {
    icon: "🔐",
    title: "Nalog",
    description: "Notifikacije o nalogu",
  },
};

export function NotificationPreferencesSettings() {
  const [preferences, setPreferences] = useState<GroupedPreferences | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences?grouped=true");
      const data = await response.json();

      if (data.success) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      toast.error("Greška pri učitavanju podešavanja");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (
    eventType: string,
    channel: "emailEnabled" | "pushEnabled" | "inAppEnabled",
    currentValue: boolean,
  ) => {
    setSaving(true);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          [channel]: !currentValue,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadPreferences();
        toast.success("Podešavanje sačuvano", { duration: 1000 });
      } else {
        toast.error("Greška pri čuvanju");
      }
    } catch (error) {
      toast.error("Greška pri čuvanju");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async (
    channel: "emailEnabled" | "pushEnabled" | "inAppEnabled",
    value: boolean,
  ) => {
    setSaving(true);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [channel]: value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadPreferences();
        toast.success(`${data.count} podešavanja ažuriranih`, { duration: 2000 });
      } else {
        toast.error("Greška pri bulk ažuriranju");
      }
    } catch (error) {
      toast.error("Greška pri bulk ažuriranju");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm("Da li si siguran da želiš da vratiš na default podešavanja?")) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
      });

      const data = await response.json();

      if (data.success) {
        await loadPreferences();
        toast.success("Podešavanja vraćena na default", { duration: 2000 });
      } else {
        toast.error("Greška pri resetovanju");
      }
    } catch (error) {
      toast.error("Greška pri resetovanju");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Učitavanje...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Podešavanja nisu dostupna</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with bulk actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Podešavanja Notifikacija
          </CardTitle>
          <CardDescription>
            Kontroliši kako i kada primaš notifikacije
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Brze akcije</p>
              <p className="text-sm text-gray-600">
                Uključi ili isključi sve notifikacije odjednom
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => handleBulkUpdate("emailEnabled", false)}
              variant="outline"
              className="w-full"
              disabled={saving}
            >
              <Mail className="mr-2 h-4 w-4" />
              Isključi sve Email-ove
            </Button>
            <Button
              onClick={() => handleBulkUpdate("pushEnabled", false)}
              variant="outline"
              className="w-full"
              disabled={saving}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Isključi sve Push
            </Button>
            <Button
              onClick={handleResetToDefaults}
              variant="outline"
              className="w-full"
              disabled={saving}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset na Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {Object.entries(preferences).map(([category, items]) => {
        if (items.length === 0) return null;

        const info =
          CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">{info.icon}</span>
                  {info.title}
                </CardTitle>
                <CardDescription>{info.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((pref: NotificationPreference) => (
                    <div
                      key={pref.eventType}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {EVENT_TYPE_LABELS[pref.eventType] || pref.eventType}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Email toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            handleToggle(
                              pref.eventType,
                              "emailEnabled",
                              pref.emailEnabled,
                            )
                          }
                          disabled={saving}
                          className={`p-2 rounded-lg transition-colors ${
                            pref.emailEnabled
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-200 text-gray-400"
                          }`}
                          title="Email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>

                        {/* Push toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            handleToggle(
                              pref.eventType,
                              "pushEnabled",
                              pref.pushEnabled,
                            )
                          }
                          disabled={saving}
                          className={`p-2 rounded-lg transition-colors ${
                            pref.pushEnabled
                              ? "bg-purple-100 text-purple-600"
                              : "bg-gray-200 text-gray-400"
                          }`}
                          title="Push"
                        >
                          <Smartphone className="h-4 w-4" />
                        </button>

                        {/* In-app toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            handleToggle(
                              pref.eventType,
                              "inAppEnabled",
                              pref.inAppEnabled,
                            )
                          }
                          disabled={saving}
                          className={`p-2 rounded-lg transition-colors ${
                            pref.inAppEnabled
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-200 text-gray-400"
                          }`}
                          title="In-App"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Legend */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-gray-600">Email notifikacije</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Smartphone className="h-4 w-4" />
              </div>
              <span className="text-gray-600">Push notifikacije</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="text-gray-600">In-app notifikacije</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
