// Ultra-modern Camera Component sa document scanning
"use client";

import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  FlipHorizontal,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";

interface CameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function ModernCamera({ onCapture, onClose }: CameraProps) {
  // Focus trap za accessibility
  const containerRef = useFocusTrap({
    active: true,
    onClose,
    autoFocus: true,
    restoreFocus: true,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // AI Document enhancement (contrast + brightness)
  const enhanceDocument = useCallback((imageData: ImageData): ImageData => {
    const data = imageData.data;
    const contrast = 1.2;
    const brightness = 10;

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast
      data[i] = (data[i] - 128) * contrast + 128 + brightness; // R
      data[i + 1] = (data[i + 1] - 128) * contrast + 128 + brightness; // G
      data[i + 2] = (data[i + 2] - 128) * contrast + 128 + brightness; // B
    }

    return imageData;
  }, []);

  // Convert data URL to File
  const dataURLtoFile = useCallback(
    (dataUrl: string, filename: string): File => {
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new File([u8arr], filename, { type: mime });
    },
    [],
  );

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Ne mogu da pristupim kameri. Proveri dozvole u browser-u.");
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
  }, [stream]);

  // Capture photo with AI enhancement
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply AI document enhancement (contrast, brightness)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const enhanced = enhanceDocument(imageData);
    context.putImageData(enhanced, 0, 0);

    // Get image as data URL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedImage(dataUrl);
    setIsCapturing(false);

    // Haptic feedback on mobile
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }, [enhanceDocument]);

  // Confirm and save with compression
  const handleConfirm = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);

    try {
      // Convert to file
      const file = dataURLtoFile(capturedImage, `dokaz-${Date.now()}.jpg`);

      // Compress image for mobile optimization
      const options = {
        maxSizeMB: 1, // Max 1MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg",
      };

      const compressedFile = await imageCompression(file, options);

      // Log compression results
      const originalSizeKB = (file.size / 1024).toFixed(2);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
      console.log(
        `📸 Image compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduction)`,
      );

      onCapture(compressedFile);
      toast.success("Dokaz sačuvan! 📸", {
        description: `Kompresovano: ${originalSizeKB}KB → ${compressedSizeKB}KB`,
      });
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Greška pri čuvanju");
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, onCapture, dataURLtoFile]);

  // Flip camera
  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, [stopCamera]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Load from gallery
  const loadFromGallery = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target?.files?.[0];
      if (file) {
        onCapture(file);
        toast.success("Slika učitana! 📷");
      }
    };
    input.click();
  }, [onCapture]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Fotografisanje dokaza za domaći zadatak"
        aria-describedby="camera-instructions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <h2
            id="camera-instructions"
            className="text-white text-lg font-semibold flex items-center gap-2"
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
            Fotografiši dokaz
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Zatvori kameru i vrati se na prethodnu stranicu"
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>

        {/* Camera/Preview */}
        <div className="relative w-full h-full flex items-center justify-center">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Uživo video stream iz kamere - postavi domaći zadatak u okvir i snimi"
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Capture overlay - Visual guide */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                aria-hidden="true"
              >
                <div className="w-[90%] max-w-md aspect-[3/4] border-4 border-white/30 rounded-3xl" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full h-full"
                style={{
                  backgroundImage: `url('${capturedImage}')`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                }}
                aria-label="Snimljena fotografija domaćeg zadatka sa AI poboljšanjem"
              />
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <fieldset
          className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent"
          aria-label="Kontrole kamere"
        >
          <legend className="sr-only">Kontrole kamere</legend>
          {!capturedImage ? (
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {/* Gallery */}
              <Button
                size="icon"
                variant="ghost"
                onClick={loadFromGallery}
                aria-label="Učitaj fotografiju iz galerije"
                className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 text-white focus:ring-2 focus:ring-white/50"
              >
                <ImageIcon className="h-6 w-6" aria-hidden="true" />
              </Button>

              {/* Capture Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={capturePhoto}
                disabled={isCapturing}
                aria-label={
                  isCapturing
                    ? "Snimanje u toku, molim sačekaj..."
                    : "Snimi fotografiju domaćeg zadatka"
                }
                aria-busy={isCapturing}
                className="h-20 w-20 rounded-full bg-white border-4 border-white/50 shadow-2xl flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 focus:ring-4 focus:ring-white/50 focus:outline-none"
              >
                {isCapturing ? (
                  <>
                    <Loader2
                      className="h-8 w-8 animate-spin text-blue-600"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Snimanje u toku...</span>
                  </>
                ) : (
                  <>
                    <div
                      className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
                      aria-hidden="true"
                    />
                    <span className="sr-only">
                      Pritisni Space ili Enter da snimiš
                    </span>
                  </>
                )}
              </motion.button>

              {/* Flip Camera */}
              <Button
                size="icon"
                variant="ghost"
                onClick={flipCamera}
                aria-label={`Promeni kameru na ${facingMode === "user" ? "zadnju" : "prednju"}`}
                className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 text-white focus:ring-2 focus:ring-white/50"
              >
                <FlipHorizontal className="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <fieldset
              className="flex items-center justify-center gap-4 max-w-2xl mx-auto"
              aria-label="Akcije za snimljenu fotografiju"
            >
              <legend className="sr-only">Akcije za snimljenu fotografiju</legend>
              <Button
                size="lg"
                variant="outline"
                onClick={retakePhoto}
                aria-label="Obriši ovu fotografiju i snimi novu"
                className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur"
              >
                Ponovi
              </Button>
              <Button
                size="lg"
                onClick={handleConfirm}
                disabled={isProcessing}
                loading={isProcessing}
                aria-label="Potvrdi i sačuvaj ovu fotografiju kao dokaz"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {!isProcessing && (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" aria-hidden="true" />
                    Potvrdi
                  </>
                )}
              </Button>
            </fieldset>
          )}
        </fieldset>

        {/* AI Enhancement Badge - Decorative */}
        {!capturedImage && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-10"
            aria-hidden="true"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-xl">
              <Sparkles className="h-4 w-4" />
              AI Auto-Enhancement
            </div>
          </motion.div>
        )}

        {/* Instructions - Screen reader hint */}
        <div className="sr-only" aria-live="polite">
          {!capturedImage
            ? "Kamera je spremna. Postavi dokument u okvir i pritisni veliki okrugli button u sredini da snimiš."
            : "Fotografija snimljena. Pritisni Ponovi da snimiš novu ili Potvrdi da sačuvaš ovu."}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
