"use client";

import { useMemo } from "react";
import { Lightbulb, Sparkles, Moon, Sun } from "lucide-react";

// Kolekcija saveta po kategorijama
const TIPS: Record<string, Array<{ text: string; emoji: string }>> = {
  general: [
    { text: "Pokušaj da radiš domaći u isto vreme svakog dana. Rutina pomaže mozgu da se brže fokusira! 🧠", emoji: "🧠" },
    { text: "Napravi kratke pauze svakih 25 minuta učenja. Mozak bolje pamti sa odmorom! 💡", emoji: "💡" },
    { text: "Piši beleške rukom - istraživanja pokazuju da se tako bolje pamti! ✍️", emoji: "✍️" },
    { text: "Pre spavanja ponovi najvažnije stvari koje si danas naučio. 😴", emoji: "😴" },
    { text: "Postavi telefon na tihi režim dok učiš - fokus je ključ uspeha! 📵", emoji: "📵" },
    { text: "Počni sa najtežim zadatkom dok si pun energije! 💪", emoji: "💪" },
    { text: "Objasni gradivo nekome drugom - tako ćeš proveriti koliko si naučio! 🗣️", emoji: "🗣️" },
    { text: "Vežbaj malo pre učenja - fizička aktivnost pomaže koncentraciji! 🏃", emoji: "🏃" },
  ],
  morning: [
    { text: "Dobro jutro! Jutro je savršeno vreme za učenje - mozak je odmoran! ☀️", emoji: "☀️" },
    { text: "Započni dan uz zdravi doručak - mozak treba goriva za razmišljanje! 🍎", emoji: "🍎" },
    { text: "Proveži juče naučeno pre nego što počneš novo gradivo! 📖", emoji: "📖" },
  ],
  afternoon: [
    { text: "Posle ručka mozak može biti umoran. Kratka šetnja pomaže! 🚶", emoji: "🚶" },
    { text: "Ovo je odlično vreme za teže zadatke - još uvek imaš energije! ⚡", emoji: "⚡" },
  ],
  evening: [
    { text: "Večernje učenje je dobro za ponavljanje, ali ne previše kasno! 🌙", emoji: "🌙" },
    { text: "Spremi stvari za sutra večeras - jutro će biti lakše! 🎒", emoji: "🎒" },
  ],
  weekend: [
    { text: "Vikend je savršen za projekte i kreativne zadatke! 🎨", emoji: "🎨" },
    { text: "Iskoristi vikend za ponavljanje gradiva iz cele nedelje! 📚", emoji: "📚" },
    { text: "Ne zaboravi na odmor - i mozgu treba pauza! 🎮", emoji: "🎮" },
  ],
  streak: [
    { text: "Svaki dan učenja gradi tvoj streak - nastavi tako! 🔥", emoji: "🔥" },
    { text: "Konstantnost je važnija od savršenstva. Samo nastavi! 💫", emoji: "💫" },
  ],
};

interface DailyTipProps {
  currentStreak?: number;
}

export function DailyTip({ currentStreak = 0 }: DailyTipProps) {
  const tip = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Odaberi kategoriju na osnovu konteksta
    let category: keyof typeof TIPS;
    
    if (isWeekend) {
      category = "weekend";
    } else if (hour >= 5 && hour < 12) {
      category = "morning";
    } else if (hour >= 12 && hour < 17) {
      category = "afternoon";
    } else if (hour >= 17 && hour < 22) {
      category = "evening";
    } else {
      category = "general";
    }
    
    // Dodaj streak savete ako ima aktivan streak
    const categoryTips = TIPS[category] || [];
    const tips = [...categoryTips];
    if (currentStreak >= 3) {
      const streakTips = TIPS["streak"] || [];
      tips.push(...streakTips);
    }
    // Uvek dodaj neke generalne savete
    const generalTips = TIPS["general"] || [];
    tips.push(...generalTips.slice(0, 3));
    
    // Odaberi savet na osnovu dana u godini (deterministički, ali se menja svakog dana)
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const tipIndex = dayOfYear % tips.length;
    
    return tips[tipIndex] || tips[0];
  }, [currentStreak]);

  // Odaberi ikonu na osnovu doba dana
  const getIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return <Sun className="h-6 w-6" />;
    if (hour >= 12 && hour < 17) return <Sparkles className="h-6 w-6" />;
    if (hour >= 17 && hour < 22) return <Moon className="h-6 w-6" />;
    return <Lightbulb className="h-6 w-6" />;
  };

  return (
    <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-xl p-4 flex items-start gap-4">
      <div className="bg-yellow-400 rounded-full p-2 text-white shrink-0" aria-hidden="true">
        {getIcon()}
      </div>
      <div>
        <h3 className="font-bold text-yellow-900 mb-1">
          <span aria-hidden="true">{tip?.emoji} </span>
          Savet dana
        </h3>
        <p className="text-yellow-800 text-sm">
          {tip?.text}
        </p>
      </div>
    </div>
  );
}
