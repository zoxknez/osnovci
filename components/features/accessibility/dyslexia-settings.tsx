/**
 * Enhanced Dyslexia Settings Component
 * Dodatne opcije za dyslexia-friendly mode
 */

"use client";

import { useState } from "react";
import { Eye, Palette, Ruler, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";

interface DyslexiaSettings {
  enabled: boolean;
  font: "opendyslexic" | "arial" | "comic-sans";
  letterSpacing: number; // 0-5px
  wordSpacing: number; // 0-10px
  lineHeight: number; // 1.2-2.0
  colorOverlay: "none" | "yellow" | "blue" | "green" | "pink";
  textToSpeech: boolean;
  readingRuler: boolean;
  fontSize: number; // 16-24px
}

export function DyslexiaSettings() {
  const [settings, setSettings] = useState<DyslexiaSettings>({
    enabled: false,
    font: "opendyslexic",
    letterSpacing: 2,
    wordSpacing: 4,
    lineHeight: 1.8,
    colorOverlay: "none",
    textToSpeech: false,
    readingRuler: false,
    fontSize: 18,
  });

  const { supported: ttsSupported } = useTextToSpeech();

  const applySettings = () => {
    const root = document.documentElement;
    
    if (settings.enabled) {
      root.classList.add("dyslexia-mode");
      root.setAttribute("data-dyslexia", "true");
      
      // Apply CSS variables
      root.style.setProperty("--dysl-letter-spacing", `${settings.letterSpacing}px`);
      root.style.setProperty("--dysl-word-spacing", `${settings.wordSpacing}px`);
      root.style.setProperty("--dysl-line-height", `${settings.lineHeight}`);
      root.style.setProperty("--dysl-font-size", `${settings.fontSize}px`);
      
      // Apply color overlay
      if (settings.colorOverlay !== "none") {
        root.classList.add(`dyslexia-overlay-${settings.colorOverlay}`);
      } else {
        root.classList.remove("dyslexia-overlay-yellow", "dyslexia-overlay-blue", "dyslexia-overlay-green", "dyslexia-overlay-pink");
      }
      
      // Apply reading ruler
      if (settings.readingRuler) {
        root.classList.add("dyslexia-reading-ruler");
      } else {
        root.classList.remove("dyslexia-reading-ruler");
      }
    } else {
      root.classList.remove("dyslexia-mode");
      root.removeAttribute("data-dyslexia");
    }
    
    // Save to localStorage
    localStorage.setItem("dyslexia-settings", JSON.stringify(settings));
  };

  const handleSettingChange = <K extends keyof DyslexiaSettings>(
    key: K,
    value: DyslexiaSettings[K]
  ) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      applySettings();
      return updated;
    });
  };

  // Load settings on mount
  useState(() => {
    const saved = localStorage.getItem("dyslexia-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings();
      } catch (e) {
        // Ignore parse errors
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Dyslexia-Friendly Mode
        </CardTitle>
        <CardDescription>
          Prilagodi aplikaciju za lakše čitanje i učenje
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="dyslexia-enabled">Omogući Dyslexia Mode</Label>
            <p className="text-sm text-gray-500">
              Prilagođava font, razmake i boje za lakše čitanje
            </p>
          </div>
          <Switch
            id="dyslexia-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => handleSettingChange("enabled", checked)}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Font Selection */}
            <div className="space-y-2">
              <Label>Font</Label>
              <Select
                value={settings.font}
                onValueChange={(value: DyslexiaSettings["font"]) =>
                  handleSettingChange("font", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opendyslexic">OpenDyslexic (preporučeno)</SelectItem>
                  <SelectItem value="comic-sans">Comic Sans</SelectItem>
                  <SelectItem value="arial">Arial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Letter Spacing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Razmak između slova</Label>
                <span className="text-sm text-gray-500">{settings.letterSpacing}px</span>
              </div>
              <Slider
                value={[settings.letterSpacing]}
                onValueChange={([value]) => handleSettingChange("letterSpacing", value)}
                min={0}
                max={5}
                step={0.5}
              />
            </div>

            {/* Word Spacing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Razmak između reči</Label>
                <span className="text-sm text-gray-500">{settings.wordSpacing}px</span>
              </div>
              <Slider
                value={[settings.wordSpacing]}
                onValueChange={([value]) => handleSettingChange("wordSpacing", value)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Visina linije</Label>
                <span className="text-sm text-gray-500">{settings.lineHeight.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.lineHeight]}
                onValueChange={([value]) => handleSettingChange("lineHeight", value)}
                min={1.2}
                max={2.0}
                step={0.1}
              />
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Veličina fonta</Label>
                <span className="text-sm text-gray-500">{settings.fontSize}px</span>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => handleSettingChange("fontSize", value)}
                min={16}
                max={24}
                step={1}
              />
            </div>

            {/* Color Overlay */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color Overlay
              </Label>
              <Select
                value={settings.colorOverlay}
                onValueChange={(value: DyslexiaSettings["colorOverlay"]) =>
                  handleSettingChange("colorOverlay", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bez overlay-a</SelectItem>
                  <SelectItem value="yellow">Žuta</SelectItem>
                  <SelectItem value="blue">Plava</SelectItem>
                  <SelectItem value="green">Zelena</SelectItem>
                  <SelectItem value="pink">Roze</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Color overlay može pomoći u lakšem čitanju
              </p>
            </div>

            {/* Reading Ruler */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reading-ruler" className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Reading Ruler
                </Label>
                <p className="text-sm text-gray-500">
                  Prikazuje horizontalnu liniju za lakše praćenje teksta
                </p>
              </div>
              <Switch
                id="reading-ruler"
                checked={settings.readingRuler}
                onCheckedChange={(checked) => handleSettingChange("readingRuler", checked)}
              />
            </div>

            {/* Text-to-Speech */}
            {ttsSupported && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="text-to-speech" className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Text-to-Speech
                  </Label>
                  <p className="text-sm text-gray-500">
                    Čita tekst naglas za lakše razumevanje
                  </p>
                </div>
                <Switch
                  id="text-to-speech"
                  checked={settings.textToSpeech}
                  onCheckedChange={(checked) => handleSettingChange("textToSpeech", checked)}
                />
              </div>
            )}

            {/* Preview */}
            <div className="border-t pt-4">
              <Label>Pregled</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  Ovo je primer teksta sa primenjenim podešavanjima. Kako ti se čini?
                  Da li je lakše za čitanje?
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

