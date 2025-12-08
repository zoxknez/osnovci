"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getShiftSettingsAction,
  updateShiftSettingsAction,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Simple Switch Component
function Switch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (c: boolean) => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${checked ? "bg-primary" : "bg-input"}
      `}
    >
      <span
        className={`
          pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
}

export function ShiftSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [referenceDate, setReferenceDate] = useState<string>(
    new Date().toISOString().split("T")[0] || "",
  );
  const [referenceType, setReferenceType] = useState<"A" | "B">("A");

  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["shift-settings"],
    queryFn: async () => {
      const res = await getShiftSettingsAction();
      if (res.error) throw new Error(res.error);
      return res.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setEnabled(settings.shiftSystemEnabled);
      if (settings.shiftReferenceDate) {
        const dateStr = new Date(settings.shiftReferenceDate)
          .toISOString()
          .split("T")[0];
        if (dateStr) setReferenceDate(dateStr);
      }
      if (settings.shiftReferenceType) {
        setReferenceType(settings.shiftReferenceType);
      }
    }
  }, [settings]);

  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const res = await updateShiftSettingsAction(data);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Podešavanja sačuvana");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["shift-settings"] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] }); // Refresh schedule
    },
    onError: () => {
      toast.error("Greška pri čuvanju");
    },
  });

  const handleSave = () => {
    saveSettings({
      enabled,
      referenceDate: new Date(referenceDate).toISOString(),
      referenceType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Podesi Smene
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Podešavanje Smena</DialogTitle>
          <DialogDescription>
            Ako tvoja škola menja smene (pre podne / popodne) svake nedelje,
            ovde to možeš podesiti.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="shift-enabled" className="flex flex-col gap-1">
              <span>Automatska rotacija smena</span>
              <span className="font-normal text-xs text-muted-foreground">
                Uključi ako se smene menjaju nedeljno
              </span>
            </Label>
            <Switch
              id="shift-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Referentna Nedelja</Label>
                <p className="text-xs text-muted-foreground">
                  Izaberi bilo koji datum u nedelji za koju znaš koja je smena.
                </p>
                <div className="border rounded-md p-2">
                  <input
                    type="date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.target.value)}
                    className="w-full p-2 bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Koja je smena bila te nedelje?</Label>
                <Select
                  value={referenceType}
                  onValueChange={(v) => setReferenceType(v as "A" | "B")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Smena A (Pre podne)</SelectItem>
                    <SelectItem value="B">Smena B (Popodne)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={handleSave} disabled={isPending}>
            Sačuvaj
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
