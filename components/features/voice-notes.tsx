/**
 * Voice Notes Component
 * Glasovne beleške za učenike - snimanje i reprodukcija audio beleški
 * COPPA compliant - child-safe voice recording
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Clock,
  Loader2,
  Mic,
  Pause,
  Play,
  Save,
  Square,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface VoiceNote {
  id: string;
  title: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  createdAt: Date;
  homeworkId?: string;
  subjectId?: string;
}

interface VoiceNotesProps {
  maxDuration?: number; // in seconds, default 60
  maxNotes?: number; // max notes per session, default 10
  homeworkId?: string;
  subjectId?: string;
  onSave?: (note: VoiceNote) => Promise<void>;
  onDelete?: (noteId: string) => Promise<void>;
}

const MAX_DURATION_SECONDS = 60;
const MAX_FILE_SIZE_MB = 5;

export function VoiceNotes({
  maxDuration = MAX_DURATION_SECONDS,
  maxNotes = 10,
  homeworkId,
  subjectId,
  onSave,
  onDelete,
}: VoiceNotesProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      setError(null);
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setHasPermission(false);
      setError("Nema dozvole za mikrofon. Molimo dozvolite pristup mikrofonu.");
    }
  }, []);

  useEffect(() => {
    requestPermission();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      notes.forEach((note) => URL.revokeObjectURL(note.audioUrl));
    };
  }, [requestPermission, notes]);

  // Visualize audio level during recording
  const visualizeAudio = useCallback((analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }, []);

  // Start recording
  const startRecording = async () => {
    if (notes.length >= maxNotes) {
      toast.error(`Maksimalno ${maxNotes} beleški po sesiji.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio analysis for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      visualizeAudio(analyser);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Check file size
        const sizeMB = audioBlob.size / (1024 * 1024);
        if (sizeMB > MAX_FILE_SIZE_MB) {
          toast.error(
            `Fajl je prevelik (${sizeMB.toFixed(1)}MB). Maksimum je ${MAX_FILE_SIZE_MB}MB.`,
          );
          return;
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        const newNote: VoiceNote = {
          id: `note-${Date.now()}`,
          title: `Beleška ${notes.length + 1}`,
          audioBlob,
          audioUrl,
          duration: recordingTime,
          createdAt: new Date(),
          ...(homeworkId && { homeworkId }),
          ...(subjectId && { subjectId }),
        };

        setNotes((prev) => [...prev, newNote]);
        toast.success("Beleška sačuvana!");

        // Clean up
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Greška pri pokretanju snimanja. Proverite mikrofon.");
      toast.error("Greška pri snimanju");
    } finally {
      setIsLoading(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Play/pause note
  const togglePlayNote = (note: VoiceNote) => {
    if (playingNoteId === note.id) {
      // Pause current note
      audioRef.current?.pause();
      setPlayingNoteId(null);
    } else {
      // Play new note
      if (audioRef.current) {
        audioRef.current.src = note.audioUrl;
        audioRef.current.play();
        setPlayingNoteId(note.id);

        audioRef.current.onended = () => {
          setPlayingNoteId(null);
        };
      }
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    try {
      if (onDelete) {
        await onDelete(noteId);
      }

      URL.revokeObjectURL(note.audioUrl);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Beleška obrisana");
    } catch {
      toast.error("Greška pri brisanju");
    }
  };

  // Save note to server
  const handleSaveNote = async (note: VoiceNote) => {
    if (!onSave) return;

    try {
      setIsLoading(true);
      await onSave(note);
      toast.success("Beleška sačuvana na server");
    } catch {
      toast.error("Greška pri čuvanju");
    } finally {
      setIsLoading(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (hasPermission === false) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold">Nema pristupa mikrofonu</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Molimo dozvolite pristup mikrofonu u podešavanjima pregledača.
              </p>
            </div>
            <Button onClick={requestPermission}>Pokušaj ponovo</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Glasovne beleške
        </CardTitle>
        <CardDescription>
          Snimi do {maxNotes} glasovnih beleški (maks. {maxDuration} sekundi
          svaka)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Section */}
        <div className="flex flex-col items-center gap-4">
          {/* Audio Level Visualizer */}
          {isRecording && (
            <motion.div
              className="relative w-32 h-32 flex items-center justify-center"
              animate={{ scale: 1 + audioLevel * 0.3 }}
              transition={{ duration: 0.1 }}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-red-500/20",
                  "animate-pulse",
                )}
              />
              <div
                className="absolute inset-4 rounded-full bg-red-500/30"
                style={{ transform: `scale(${1 + audioLevel})` }}
              />
              <Mic className="h-12 w-12 text-red-500 relative z-10" />
            </motion.div>
          )}

          {/* Recording Timer */}
          {isRecording && (
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-red-500">
                {formatTime(recordingTime)}
              </p>
              <Progress
                value={(recordingTime / maxDuration) * 100}
                className="w-48 mt-2"
              />
            </div>
          )}

          {/* Record/Stop Button */}
          <div className="flex gap-4">
            {!isRecording ? (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={isLoading || notes.length >= maxNotes}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
                Snimi
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Zaustavi
              </Button>
            )}
          </div>

          {/* Notes Counter */}
          <Badge variant="secondary">
            {notes.length} / {maxNotes} beleški
          </Badge>
        </div>

        {/* Notes List */}
        <AnimatePresence>
          {notes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <h4 className="font-medium text-sm text-muted-foreground">
                Sačuvane beleške
              </h4>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    playingNoteId === note.id && "bg-primary/5 border-primary",
                  )}
                >
                  {/* Play/Pause Button */}
                  <Button
                    size="icon"
                    variant={playingNoteId === note.id ? "default" : "outline"}
                    onClick={() => togglePlayNote(note)}
                    className="shrink-0"
                  >
                    {playingNoteId === note.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Note Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{note.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(note.duration)}
                      <span>•</span>
                      {note.createdAt.toLocaleTimeString("sr-Latn-RS", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {onSave && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveNote(note)}
                        disabled={isLoading}
                        title="Sačuvaj"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-destructive hover:text-destructive"
                      title="Obriši"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} className="hidden" />

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VoiceNotes;
