// Text-to-Speech Hook - For younger children & visual impairments
"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Check browser support
    const speechSupported =
      typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(speechSupported);

    if (!speechSupported) {
      return undefined;
    }

    // Load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis.onvoiceschanged === loadVoices) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speak = useCallback(
    (
      text: string,
      options?: {
        rate?: number;
        pitch?: number;
        volume?: number;
        lang?: string;
      },
    ) => {
      if (!supported) {
        toast.error("Tvoj browser ne podržava čitanje naglas 😔");
        return;
      }

      // Stop current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Settings optimized for children
      utterance.rate = options?.rate || 0.85; // Slower - easier to understand
      utterance.pitch = options?.pitch || 1.1; // Higher pitch - friendlier
      utterance.volume = options?.volume || 1.0;
      utterance.lang = options?.lang || "sr-RS";

      // Try to find Serbian voice
      const serbianVoice = voices.find((v) => v.lang.startsWith("sr"));
      if (serbianVoice) {
        utterance.voice = serbianVoice;
      }

      // Event handlers
      utterance.onstart = () => {
        setSpeaking(true);
        toast.info("🔊 Čitam naglas...");
      };

      utterance.onend = () => {
        setSpeaking(false);
      };

      utterance.onerror = () => {
        setSpeaking(false);
        toast.error("Greška pri čitanju 😔");
      };

      window.speechSynthesis.speak(utterance);
    },
    [supported, voices],
  );

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  const pause = useCallback(() => {
    if (supported && speaking) {
      window.speechSynthesis.pause();
    }
  }, [supported, speaking]);

  const resume = useCallback(() => {
    if (supported) {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  return {
    speak,
    stop,
    pause,
    resume,
    speaking,
    supported,
    voices,
  };
}

/**
 * Read Button Component - Mobile-friendly
 */
interface ReadButtonProps {
  text: string;
  className?: string;
}

export function ReadButton({ text, className }: ReadButtonProps) {
  const { speak, stop, speaking, supported } = useTextToSpeech();

  if (!supported) return null;

  return (
    <Button
      onClick={() => (speaking ? stop() : speak(text))}
      variant="outline"
      size="sm"
      className={`touch-manipulation ${className ?? ""}`.trim()}
      aria-label={speaking ? "Zaustavi čitanje" : "Pročitaj naglas"}
      type="button"
    >
      {speaking ? (
        <>
          <VolumeX className="mr-2 h-4 w-4" />
          Zaustavi
        </>
      ) : (
        <>
          <Volume2 className="mr-2 h-4 w-4" />🔊 Pročitaj
        </>
      )}
    </Button>
  );
}
