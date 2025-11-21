"use client";

import { PageHeader } from "@/components/features/page-header";
import { ShiftSettingsDialog } from "@/components/features/schedule/shift-settings-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchedule } from "@/hooks/use-schedule";
import { getShiftSettingsAction } from "@/app/actions/settings";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useState } from "react";

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
  );

  const { data: schedule, isLoading } = useSchedule();
  
  const { data: settings } = useQuery({
    queryKey: ["shift-settings"],
    queryFn: async () => {
      const res = await getShiftSettingsAction();
      if (res.error) throw new Error(res.error);
      return res.data;
    },
  });

  const getCurrentShift = () => {
    if (!settings?.shiftSystemEnabled || !settings.shiftReferenceDate) return null;
    
    const refDate = new Date(settings.shiftReferenceDate);
    const now = new Date();
    
    // Reset times to compare dates only
    refDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    // Calculate weeks difference
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const diffTime = now.getTime() - refDate.getTime();
    const diffWeeks = Math.floor(diffTime / oneWeek);
    
    const isEvenWeek = diffWeeks % 2 === 0;
    
    if (settings.shiftReferenceType === "A") {
      return isEvenWeek ? "A" : "B";
    } else {
      return isEvenWeek ? "B" : "A";
    }
  };

  const currentShift = getCurrentShift();

  const days = [
    { id: "MONDAY", label: "Ponedeljak" },
    { id: "TUESDAY", label: "Utorak" },
    { id: "WEDNESDAY", label: "Sreda" },
    { id: "THURSDAY", label: "Četvrtak" },
    { id: "FRIDAY", label: "Petak" },
  ];

  const filteredSchedule = schedule?.data?.filter((item: any) => {
    if (item.dayOfWeek !== selectedDay) return false;
    
    // Filter by shift if enabled
    if (currentShift) {
      if (currentShift === "A" && !item.isAWeek) return false;
      if (currentShift === "B" && !item.isBWeek) return false;
    }
    
    return true;
  }).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Raspored Časova"
        description="Pregled tvojih školskih obaveza."
        action={<ShiftSettingsDialog />}
      />

      {currentShift && (
        <div className={`p-4 rounded-lg border flex items-center justify-between ${
          currentShift === "A" ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg ${
              currentShift === "A" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
            }`}>
              {currentShift}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Trenutno je Smena {currentShift}
              </h3>
              <p className="text-sm text-muted-foreground">
                Prikazujem časove samo za ovu smenu.
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          {days.map((day) => (
            <TabsTrigger key={day.id} value={day.id} className="text-xs sm:text-sm">
              <span className="hidden sm:inline">{day.label}</span>
              <span className="sm:hidden">{day.label.slice(0, 3)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((day) => (
          <TabsContent key={day.id} value={day.id} className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Učitavanje rasporeda...
              </div>
            ) : filteredSchedule?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nema časova za ovaj dan.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredSchedule?.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all">
                    <div className="flex">
                      <div 
                        className="w-2" 
                        style={{ backgroundColor: item.subject?.color || item.customColor || "#3b82f6" }} 
                      />
                      <div className="flex-1 p-4 flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center min-w-[80px] p-2 bg-muted rounded-lg">
                          <span className="text-lg font-bold">{item.startTime}</span>
                          <span className="text-xs text-muted-foreground">{item.endTime}</span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.subject?.name || item.customTitle || "Događaj"}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {item.room && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.room}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              45 min
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!currentShift && (
                            <>
                              {item.isAWeek && <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">A</Badge>}
                              {item.isBWeek && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">B</Badge>}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
