/**
 * Enhanced Parental Dashboard
 * Dodaje Smart Alerts i Messaging funkcionalnosti
 */

"use client";

import { Bell, MessageSquare, TrendingUp } from "lucide-react";
import { useState } from "react";
import { ChatInterface } from "@/components/features/messaging/chat-interface";
import { SmartAlerts } from "@/components/features/parent/smart-alerts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ParentalDashboardEnhancedProps {
  studentId: string;
  guardianId: string;
  currentUserId: string;
  studentName: string;
}

export function ParentalDashboardEnhanced({
  studentId,
  guardianId,
  currentUserId,
  studentName,
}: ParentalDashboardEnhancedProps) {
  const [activeTab, setActiveTab] = useState("alerts");
  const [unreadAlerts] = useState(0);
  const [unreadMessages] = useState(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard za {studentName}</h2>
          <p className="text-gray-600">
            Prati napredak i komuniciraj sa detetom
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Upozorenja
            {unreadAlerts > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Poruke
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadMessages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analitika
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Automatska Upozorenja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SmartAlerts studentId={studentId} guardianId={guardianId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Komunikacija sa {studentName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChatInterface
                studentId={studentId}
                guardianId={guardianId}
                currentUserId={currentUserId}
                currentUserRole="GUARDIAN"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Analitika Napretka
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Detaljna analitika je dostupna na stranici{" "}
                <a
                  href={`/dashboard/roditelj?studentId=${studentId}`}
                  className="text-blue-600 hover:underline"
                >
                  Roditeljski Dashboard
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
