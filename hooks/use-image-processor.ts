import { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

export function useImageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);

  const enhanceDocument = useCallback((imageData: ImageData): ImageData => {
    const data = imageData.data;
    const contrast = 1.2;
    const brightness = 10;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r !== undefined) data[i] = (r - 128) * contrast + 128 + brightness;
      if (g !== undefined) data[i + 1] = (g - 128) * contrast + 128 + brightness;
      if (b !== undefined) data[i + 2] = (b - 128) * contrast + 128 + brightness;
    }

    return imageData;
  }, []);

  const dataURLtoFile = useCallback(
    (dataUrl: string, filename: string): File => {
      const arr = dataUrl.split(",");
      const firstPart = arr[0];
      const secondPart = arr[1];
      
      if (!firstPart || !secondPart) {
        throw new Error('Invalid data URL');
      }
      
      const mime = firstPart.match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(secondPart);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new File([u8arr], filename, { type: mime });
    },
    [],
  );

  const processAndCompressImage = useCallback(async (capturedImage: string): Promise<File | null> => {
    setIsProcessing(true);
    try {
      const file = dataURLtoFile(capturedImage, `dokaz-${Date.now()}.jpg`);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg",
      };

      const compressedFile = await imageCompression(file, options);

      const originalSizeKB = (file.size / 1024).toFixed(2);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
      console.log(
        `📸 Image compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduction)`,
      );

      toast.success("Dokaz sačuvan! 📸", {
        description: `Kompresovano: ${originalSizeKB}KB → ${compressedSizeKB}KB`,
      });

      return compressedFile;
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Greška pri čuvanju");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [dataURLtoFile]);

  return {
    enhanceDocument,
    processAndCompressImage,
    isProcessing,
  };
}
