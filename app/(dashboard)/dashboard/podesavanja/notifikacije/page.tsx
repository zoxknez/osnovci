// Notification Preferences Page

import { PageHeader } from "@/components/features/page-header";
import { NotificationPreferencesSettings } from "@/components/features/settings/notification-preferences";

export default function NotificationPreferencesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      <PageHeader
        title="🔔 Podešavanja Notifikacija"
        description="Kontroliši kako i kada primaš notifikacije"
        variant="blue"
        badge="Granular Control"
      />

      <NotificationPreferencesSettings />
    </div>
  );
}
