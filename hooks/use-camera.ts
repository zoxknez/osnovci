import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

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

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
  }, [stream]);

  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return {
    videoRef,
    stream,
    facingMode,
    startCamera,
    stopCamera,
    flipCamera,
  };
}
