import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoModeBanner() {
  return (
    <div className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 text-white rounded-2xl p-6 shadow-xl border-2 border-white/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">🎮 Demo Mode Aktivan</h2>
              <p className="text-white/90 text-sm">
                Istraži sve funkcionalnosti bez potrebe za registracijom! Podaci
                su simulirani.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/40"
            >
              📚 Dokumentacija
            </Button>
          </div>
        </div>
      </div>
  );
}
