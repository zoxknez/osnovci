// File Upload Component sa Progress Bar i Drag & Drop
"use client";

import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, FileIcon, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // MB
  maxFiles?: number;
  compressImages?: boolean;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function FileUpload({
  onUpload,
  accept = "image/*",
  multiple = true,
  maxSize = 10,
  maxFiles = 5,
  compressImages = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check size
      if (file.size > maxSize * 1024 * 1024) {
        return `Fajl je prevelik. Maksimalno ${maxSize}MB.`;
      }

      // Check type
      if (accept && !file.type.match(accept.replace("*", ".*"))) {
        return `Nepodržan tip fajla. Dozvoljeno: ${accept}`;
      }

      return null;
    },
    [maxSize, accept],
  );

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles = Array.from(fileList);

      // Check max files
      if (files.length + newFiles.length > maxFiles) {
        toast.error(`Možeš dodati maksimalno ${maxFiles} fajlova`);
        return;
      }

      // Validate and create upload items
      const uploadFiles: UploadedFile[] = [];

      for (const file of newFiles) {
        const error = validateFile(file);

        if (error) {
          toast.error(error);
          continue;
        }

        // Compress images if enabled
        let processedFile = file;
        if (compressImages && file.type.startsWith("image/")) {
          try {
            processedFile = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            });
          } catch (error) {
            console.error("Compression failed:", error);
          }
        }

        uploadFiles.push({
          file: processedFile,
          id: Math.random().toString(36).substr(2, 9),
          progress: 0,
          status: "pending",
        });
      }

      setFiles((prev) => [...prev, ...uploadFiles]);

      // Start upload
      uploadFilesSequentially(uploadFiles);
    },
    [files.length, maxFiles, validateFile, compressImages],
  );

  const uploadFilesSequentially = async (uploadFiles: UploadedFile[]) => {
    for (const uploadFile of uploadFiles) {
      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: "uploading" } : f,
          ),
        );

        // Simulate progress (replace with actual upload logic)
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress: i } : f,
            ),
          );
        }

        // Call upload callback
        await onUpload([uploadFile.file]);

        // Mark as success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "success", progress: 100 }
              : f,
          ),
        );
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: error.message }
              : f,
          ),
        );
        toast.error(`Greška: ${error.message}`);
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const { files } = e.dataTransfer;
      if (files) {
        processFiles(files);
      }
    },
    [processFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files) {
        processFiles(files);
      }
      // Reset input
      e.target.value = "";
    },
    [processFiles],
  );

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          type="file"
          id="file-upload"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <motion.div
            animate={{
              scale: isDragging ? 1.1 : 1,
              rotate: isDragging ? 5 : 0,
            }}
            className="mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center"
          >
            <Upload className="h-8 w-8 text-blue-600" />
          </motion.div>

          <p className="text-lg font-semibold text-gray-900 mb-2">
            {isDragging ? "Pusti fajlove ovde" : "Dodaj fajlove"}
          </p>
          <p className="text-sm text-gray-600">
            Prevuci ili klikni da izabereš
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Max {maxSize}MB • Do {maxFiles} fajlova
          </p>
        </label>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {file.status === "success" ? (
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  ) : file.status === "error" ? (
                    <AlertCircle className="h-10 w-10 text-red-600" />
                  ) : (
                    <FileIcon className="h-10 w-10 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {/* Progress Bar */}
                  {file.status === "uploading" && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${file.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {file.status === "error" && file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.id)}
                  disabled={file.status === "uploading"}
                  aria-label="Ukloni fajl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
