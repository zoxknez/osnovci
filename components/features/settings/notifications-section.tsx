"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { staggerItem } from "@/lib/animations/variants";
import { NOTIFICATION_OPTIONS } from "./constants";
import type { NotificationKey, NotificationsSettings } from "./types";

interface NotificationsSectionProps {
  notifications: NotificationsSettings;
  onToggle: (key: NotificationKey) => Promise<void>;
}

export function NotificationsSection({ notifications, onToggle }: NotificationsSectionProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 text-lg">
              🔔
            </span>
            Notifikacije
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATION_OPTIONS.map((option) => {
            const active = notifications[option.key];
            return (
              <div key={option.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-medium text-gray-900">{option.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggle(option.key)}
                  aria-label={`${active ? "Isključi" : "Uključi"} notifikacije za ${option.label}`}
                  className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                    active ? "bg-blue-500 shadow-md" : "bg-gray-300"
                  } hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none`}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"
                    animate={{ x: active ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                  <span className="sr-only">{active ? "Uključeno" : "Isključeno"}</span>
                </button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
