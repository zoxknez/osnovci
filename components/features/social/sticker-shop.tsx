"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Lock, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Celebration } from "@/components/ui/celebration";
import { sendStickerAction } from "@/app/actions/social";

interface Sticker {
  id: string;
  name: string;
  icon: string;
  cost: number;
  minLevel: number;
}

interface Student {
  id: string;
  name: string;
  avatar?: string | null;
}

interface StickerShopProps {
  stickers: Sticker[];
  classmates: Student[];
  currentXp: number;
  currentLevel: number;
}

export function StickerShop({ stickers, classmates, currentXp, currentLevel }: StickerShopProps) {
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    if (!selectedSticker || !selectedStudent) return;

    setIsSending(true);
    try {
      const result = await sendStickerAction({
        receiverId: selectedStudent,
        stickerId: selectedSticker.id,
      });

      if (result.error) throw new Error(result.error);

      toast.success(`Stiker "${selectedSticker.name}" poslat! 🎉`);
      setIsOpen(false);
      setSelectedSticker(null);
      setSelectedStudent("");
      setShowCelebration(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri slanju stikera");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Celebration trigger={showCelebration} onComplete={() => setShowCelebration(false)} duration={3000} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

      {stickers.map((sticker) => {
        const isLocked = currentLevel < sticker.minLevel;
        const canAfford = currentXp >= sticker.cost;

        return (
          <Card 
            key={sticker.id} 
            className={`relative overflow-hidden transition-all hover:shadow-md ${
              isLocked ? "opacity-60 bg-gray-50" : "bg-white border-blue-100"
            }`}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="text-4xl mb-2 transform transition-transform hover:scale-110">
                {sticker.icon}
              </div>
              <h3 className="font-bold text-gray-800">{sticker.name}</h3>
              
              <div className="flex items-center gap-1 text-sm font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                <span>{sticker.cost} XP</span>
              </div>

              {isLocked ? (
                <div className="absolute inset-0 bg-gray-100/50 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="bg-white/90 p-2 rounded-lg shadow-sm flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Lock className="w-3 h-3" />
                    Lvl {sticker.minLevel}
                  </div>
                </div>
              ) : (
                <Dialog open={isOpen && selectedSticker?.id === sticker.id} onOpenChange={(open) => {
                  setIsOpen(open);
                  if (open) setSelectedSticker(sticker);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="w-full mt-2" 
                      variant={canAfford ? "default" : "outline"}
                      disabled={!canAfford}
                    >
                      {canAfford ? "Pošalji" : "Nedovoljno XP"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pošalji stiker: {sticker.name} {sticker.icon}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Izaberi druga/drugaricu:</label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Izaberi iz odeljenja..." />
                          </SelectTrigger>
                          <SelectContent>
                            {classmates.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800 flex justify-between items-center">
                        <span>Cena stikera:</span>
                        <span className="font-bold">{sticker.cost} XP</span>
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={handleSend} 
                        disabled={!selectedStudent || isSending}
                      >
                        {isSending ? "Slanje..." : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Pošalji Stiker
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
    </>
  );
}
