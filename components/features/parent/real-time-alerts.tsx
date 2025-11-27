/**
 * Real-Time Alerts Component for Parents
 * Obaveštenja u realnom vremenu za roditelje
 * Grades, homework status, activity alerts
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  BookOpen,
  GraduationCap,
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Settings,
  Volume2,
  VolumeX,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { sr } from "date-fns/locale";

type AlertType =
  | "GRADE_RECEIVED"
  | "HOMEWORK_COMPLETED"
  | "HOMEWORK_OVERDUE"
  | "ACHIEVEMENT_UNLOCKED"
  | "LEVEL_UP"
  | "STREAK_LOST"
  | "LOW_ACTIVITY"
  | "STUDY_SESSION";

type AlertPriority = "low" | "medium" | "high" | "urgent";

interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

interface AlertSettings {
  gradeAlerts: boolean;
  homeworkAlerts: boolean;
  achievementAlerts: boolean;
  activityAlerts: boolean;
  soundEnabled: boolean;
  urgentOnly: boolean;
}

interface RealTimeAlertsProps {
  guardianId: string;
  students: Array<{ id: string; name: string }>;
  onAlertClick?: (alert: Alert) => void;
}

const DEFAULT_SETTINGS: AlertSettings = {
  gradeAlerts: true,
  homeworkAlerts: true,
  achievementAlerts: true,
  activityAlerts: true,
  soundEnabled: true,
  urgentOnly: false,
};

const ALERT_CONFIG: Record<
  AlertType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  GRADE_RECEIVED: {
    icon: GraduationCap,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  HOMEWORK_COMPLETED: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  HOMEWORK_OVERDUE: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  ACHIEVEMENT_UNLOCKED: {
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
  LEVEL_UP: {
    icon: Trophy,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  STREAK_LOST: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  LOW_ACTIVITY: {
    icon: Clock,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
  },
  STUDY_SESSION: {
    icon: BookOpen,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
  },
};

const PRIORITY_STYLES: Record<AlertPriority, string> = {
  low: "border-l-gray-400",
  medium: "border-l-blue-400",
  high: "border-l-orange-400",
  urgent: "border-l-red-500 animate-pulse",
};

export function RealTimeAlerts({
  students,
  onAlertClick,
}: RealTimeAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<AlertType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch alerts (simulated - replace with real API)
  const fetchAlerts = useCallback(async () => {
    // In production, this would be a real API call
    // For now, we'll create some sample alerts
    const sampleAlerts: Alert[] = [
      {
        id: "1",
        type: "GRADE_RECEIVED",
        priority: "medium",
        title: "Nova ocena",
        message: "Marko je dobio ocenu 5 iz Matematike",
        studentId: students[0]?.id || "student-1",
        studentName: students[0]?.name || "Marko",
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        read: false,
        data: { grade: 5, subject: "Matematika" },
      },
      {
        id: "2",
        type: "HOMEWORK_COMPLETED",
        priority: "low",
        title: "Domaći završen",
        message: "Marko je završio domaći iz Srpskog jezika",
        studentId: students[0]?.id || "student-1",
        studentName: students[0]?.name || "Marko",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        data: { subject: "Srpski jezik" },
      },
      {
        id: "3",
        type: "ACHIEVEMENT_UNLOCKED",
        priority: "medium",
        title: "Novo dostignuće!",
        message: "Marko je otključao dostignuće: Nedeljni Ratnik",
        studentId: students[0]?.id || "student-1",
        studentName: students[0]?.name || "Marko",
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        read: true,
        data: { achievement: "STREAK_7" },
      },
    ];

    setAlerts(sampleAlerts);
    setUnreadCount(sampleAlerts.filter((a) => !a.read).length);
  }, [students]);

  useEffect(() => {
    fetchAlerts();
    
    // In production, set up WebSocket or polling here
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Filter alerts based on settings and selected types
  const filteredAlerts = alerts.filter((alert) => {
    if (settings.urgentOnly && alert.priority !== "urgent" && alert.priority !== "high") {
      return false;
    }

    if (selectedTypes.length > 0 && !selectedTypes.includes(alert.type)) {
      return false;
    }

    // Check category settings
    const typeCategory = getAlertCategory(alert.type);
    if (typeCategory === "grade" && !settings.gradeAlerts) return false;
    if (typeCategory === "homework" && !settings.homeworkAlerts) return false;
    if (typeCategory === "achievement" && !settings.achievementAlerts) return false;
    if (typeCategory === "activity" && !settings.activityAlerts) return false;

    return true;
  });

  function getAlertCategory(type: AlertType): string {
    switch (type) {
      case "GRADE_RECEIVED":
        return "grade";
      case "HOMEWORK_COMPLETED":
      case "HOMEWORK_OVERDUE":
        return "homework";
      case "ACHIEVEMENT_UNLOCKED":
      case "LEVEL_UP":
        return "achievement";
      default:
        return "activity";
    }
  }

  const markAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    const alert = alerts.find((a) => a.id === alertId);
    if (alert && !alert.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const toggleTypeFilter = (type: AlertType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              {unreadCount > 0 ? (
                <BellRing className="h-5 w-5 text-primary animate-pulse" />
              ) : (
                <Bell className="h-5 w-5" />
              )}
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div>
              <CardTitle>Obaveštenja</CardTitle>
              <CardDescription>Aktivnost vaše dece u realnom vremenu</CardDescription>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(ALERT_CONFIG) as AlertType[]).map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedTypes.length === 0 || selectedTypes.includes(type)}
                    onCheckedChange={() => toggleTypeFilter(type)}
                  >
                    {getAlertTypeName(type)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Sheet */}
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Podešavanja obaveštenja</SheetTitle>
                  <SheetDescription>
                    Izaberite koje tipove obaveštenja želite da primate
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Ocene</Label>
                      <p className="text-sm text-muted-foreground">
                        Obaveštenja o novim ocenama
                      </p>
                    </div>
                    <Switch
                      checked={settings.gradeAlerts}
                      onCheckedChange={(checked: boolean) =>
                        setSettings({ ...settings, gradeAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Domaći zadaci</Label>
                      <p className="text-sm text-muted-foreground">
                        Status domaćih zadataka
                      </p>
                    </div>
                    <Switch
                      checked={settings.homeworkAlerts}
                      onCheckedChange={(checked: boolean) =>
                        setSettings({ ...settings, homeworkAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dostignuća</Label>
                      <p className="text-sm text-muted-foreground">
                        Nova dostignuća i nivoi
                      </p>
                    </div>
                    <Switch
                      checked={settings.achievementAlerts}
                      onCheckedChange={(checked: boolean) =>
                        setSettings({ ...settings, achievementAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Aktivnost</Label>
                      <p className="text-sm text-muted-foreground">
                        Upozorenja o aktivnosti
                      </p>
                    </div>
                    <Switch
                      checked={settings.activityAlerts}
                      onCheckedChange={(checked: boolean) =>
                        setSettings({ ...settings, activityAlerts: checked })
                      }
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          {settings.soundEnabled ? (
                            <Volume2 className="h-4 w-4" />
                          ) : (
                            <VolumeX className="h-4 w-4" />
                          )}
                          Zvuk
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Zvučna obaveštenja
                        </p>
                      </div>
                      <Switch
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked: boolean) =>
                          setSettings({ ...settings, soundEnabled: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Samo hitno</Label>
                      <p className="text-sm text-muted-foreground">
                        Prikaži samo hitna obaveštenja
                      </p>
                    </div>
                    <Switch
                      checked={settings.urgentOnly}
                      onCheckedChange={(checked: boolean) =>
                        setSettings({ ...settings, urgentOnly: checked })
                      }
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Mark all as read */}
        {unreadCount > 0 && (
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Označi sve kao pročitano
            </Button>
          </div>
        )}

        {/* Alerts List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nema novih obaveštenja</p>
              </motion.div>
            ) : (
              filteredAlerts.map((alert) => {
                const config = ALERT_CONFIG[alert.type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                  >
                    <div
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer",
                        "hover:bg-muted/50 transition-colors",
                        PRIORITY_STYLES[alert.priority],
                        !alert.read && "bg-muted/30"
                      )}
                      onClick={() => {
                        markAsRead(alert.id);
                        onAlertClick?.(alert);
                      }}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-full shrink-0",
                          config.bgColor
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissAlert(alert.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {alert.studentName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.timestamp), {
                              addSuffix: true,
                              locale: sr,
                            })}
                          </span>
                          {!alert.read && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

function getAlertTypeName(type: AlertType): string {
  const names: Record<AlertType, string> = {
    GRADE_RECEIVED: "Ocene",
    HOMEWORK_COMPLETED: "Završen domaći",
    HOMEWORK_OVERDUE: "Zakašnjeli domaći",
    ACHIEVEMENT_UNLOCKED: "Dostignuća",
    LEVEL_UP: "Novi nivo",
    STREAK_LOST: "Izgubljen niz",
    LOW_ACTIVITY: "Niska aktivnost",
    STUDY_SESSION: "Sesije učenja",
  };
  return names[type];
}

export default RealTimeAlerts;
