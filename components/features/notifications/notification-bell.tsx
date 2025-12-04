/**
 * Notification Bell Component
 * Prikazuje broj nepročitanih notifikacija
 */

"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "alert" | "homework" | "achievement" | "message";
  read: boolean;
  timestamp: Date;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // TODO: Set up WebSocket or polling for real-time notifications
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error loading notifications", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Notifikacije</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  // Mark all as read
                  await fetch("/api/notifications/read-all", {
                    method: "POST",
                    credentials: "include",
                  });
                  loadNotifications();
                }}
              >
                Označi sve kao pročitano
              </Button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nema notifikacija
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors",
                    !notification.read && "bg-blue-50 border-blue-200"
                  )}
                  onClick={async () => {
                    // Mark as read
                    await fetch(`/api/notifications/${notification.id}/read`, {
                      method: "POST",
                      credentials: "include",
                    });
                    loadNotifications();
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleDateString("sr-RS", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

