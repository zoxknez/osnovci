import { Lightbulb } from "lucide-react";

export function DailyTip() {
  return (
    <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-xl p-4 flex items-start gap-4">
        <div className="bg-yellow-400 rounded-full p-2 text-white shrink-0">
          <Lightbulb className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-yellow-900 mb-1">Savet dana</h3>
          <p className="text-yellow-800 text-sm">
            Pokušaj da radiš domaći u isto vreme svakog dana. Rutina pomaže mozgu da se brže fokusira! 🧠
          </p>
        </div>
      </div>
  );
}
