/**
 * File Upload Security
 * Validates file uploads - type, size, magic bytes
 */

import { createHash } from "crypto";

/**
 * Allowed MIME types
 */
const ALLOWED_TYPES = {
  "image/jpeg": { maxSize: 10 * 1024 * 1024, magicBytes: [0xff, 0xd8, 0xff] }, // 10MB
  "image/png": {
    maxSize: 10 * 1024 * 1024,
    magicBytes: [0x89, 0x50, 0x4e, 0x47],
  },
  "image/webp": { maxSize: 10 * 1024 * 1024, magicBytes: [0x52, 0x49, 0x46, 0x46] },
  "application/pdf": {
    maxSize: 25 * 1024 * 1024,
    magicBytes: [0x25, 0x50, 0x44, 0x46],
  }, // 25MB
  "video/mp4": { maxSize: 100 * 1024 * 1024, magicBytes: [0x00, 0x00, 0x00, 0x18] }, // 100MB
} as const;

type AllowedMimeType = keyof typeof ALLOWED_TYPES;

/**
 * Validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  hash?: string;
  metadata?: {
    size: number;
    type: string;
    name: string;
  };
}

/**
 * Validate uploaded file
 */
export async function validateFileUpload(
  file: File,
): Promise<FileValidationResult> {
  // 1. Check if MIME type is allowed
  if (!isAllowedType(file.type)) {
    return {
      valid: false,
      error: `Nedozvoljen tip fajla. Dozvoljeni tipovi: ${Object.keys(ALLOWED_TYPES).join(", ")}`,
    };
  }

  const allowedType = file.type as AllowedMimeType;
  const config = ALLOWED_TYPES[allowedType];

  // 2. Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Fajl je prevelik. Maksimalna veličina je ${maxSizeMB}MB`,
    };
  }

  // 3. Check minimum file size (prevent empty files)
  if (file.size < 100) {
    return {
      valid: false,
      error: "Fajl je prazan ili korumpiran",
    };
  }

  // 4. Check file extension matches MIME type
  const extensionValid = validateFileExtension(file.name, file.type);
  if (!extensionValid) {
    return {
      valid: false,
      error: "Ekstenzija fajla ne odgovara tipu",
    };
  }

  // 5. Check file signature (magic bytes)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const signatureValid = validateFileSignature(bytes, config.magicBytes);
  if (!signatureValid) {
    return {
      valid: false,
      error: "Fajl je korumpiran ili lažan",
    };
  }

  // 6. Generate hash for duplicate detection
  const hash = generateFileHash(bytes);

  return {
    valid: true,
    hash,
    metadata: {
      size: file.size,
      type: file.type,
      name: file.name,
    },
  };
}

/**
 * Check if MIME type is allowed
 */
function isAllowedType(mimeType: string): mimeType is AllowedMimeType {
  return mimeType in ALLOWED_TYPES;
}

/**
 * Validate file extension matches MIME type
 */
function validateFileExtension(fileName: string, mimeType: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const mimeToExt: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "application/pdf": ["pdf"],
    "video/mp4": ["mp4"],
  };

  const allowedExtensions = mimeToExt[mimeType];
  return allowedExtensions ? allowedExtensions.includes(extension || "") : false;
}

/**
 * Validate file signature (magic bytes)
 */
function validateFileSignature(
  bytes: Uint8Array,
  magicBytes: readonly number[],
): boolean {
  for (let i = 0; i < magicBytes.length; i++) {
    if (bytes[i] !== magicBytes[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Generate SHA-256 hash of file
 */
function generateFileHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Check for duplicate file (by hash)
 */
export async function isDuplicateFile(
  hash: string,
  prisma: { attachment: { findFirst: (args: { where: { hash: string } }) => Promise<unknown> } },
): Promise<boolean> {
  // Note: Requires adding 'hash' field to Attachment model
  const existing = await prisma.attachment.findFirst({
    where: { hash },
  });

  return !!existing;
}

/**
 * Scan file for malware (basic heuristics)
 * For production, use ClamAV or cloud service like VirusTotal API
 */
export function basicMalwareScan(bytes: Uint8Array): {
  safe: boolean;
  reason?: string;
} {
  // 1. Check for embedded executables
  const exeSignatures = [
    [0x4d, 0x5a], // MZ (Windows EXE)
    [0x7f, 0x45, 0x4c, 0x46], // ELF (Linux)
  ];

  for (const signature of exeSignatures) {
    if (hasSignature(bytes, signature)) {
      return {
        safe: false,
        reason: "Fajl sadrži izvršivi kod",
      };
    }
  }

  // 2. Check for scripts in images (polyglot files)
  const scriptPatterns = [
    "<?php",
    "<script",
    "javascript:",
    "eval(",
    "exec(",
  ];

  const text = new TextDecoder().decode(bytes.slice(0, 1024)); // Check first 1KB

  for (const pattern of scriptPatterns) {
    if (text.includes(pattern)) {
      return {
        safe: false,
        reason: "Fajl sadrži sumnjiv kod",
      };
    }
  }

  return { safe: true };
}

/**
 * Check if bytes contain signature
 */
function hasSignature(bytes: Uint8Array, signature: number[]): boolean {
  for (let i = 0; i <= bytes.length - signature.length; i++) {
    let match = true;
    for (let j = 0; j < signature.length; j++) {
      if (bytes[i + j] !== signature[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
    .replace(/\.+/g, ".") // Remove multiple dots
    .replace(/^\./, "") // Remove leading dot
    .slice(0, 255); // Limit length
}

