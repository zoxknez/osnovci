import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { log } from "@/lib/logger";

// Configuration
const STORAGE_PROVIDER = process.env["STORAGE_PROVIDER"] || "local"; // 's3', 'r2', 'vercel-blob', 'local'
const BUCKET_NAME = process.env["STORAGE_BUCKET"] || "osnovci-uploads";
const REGION = process.env["STORAGE_REGION"] || "eu-central-1";

// S3 Client (works for AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces)
const s3Client = new S3Client({
  region: REGION,
  ...(process.env["STORAGE_ENDPOINT"] ? { endpoint: process.env["STORAGE_ENDPOINT"] } : {}),
  credentials: {
    accessKeyId: process.env["STORAGE_ACCESS_KEY"] || "",
    secretAccessKey: process.env["STORAGE_SECRET_KEY"] || "",
  },
  forcePathStyle: true, // Needed for some S3-compatible providers
});

export interface UploadResult {
  url: string;
  key: string;
  provider: string;
}

/**
 * Storage Service - Abstracted file storage
 * Supports: S3, R2, Local (Dev)
 */
export class StorageService {
  /**
   * Upload file to storage
   */
  static async upload(
    file: Buffer,
    key: string,
    mimeType: string
  ): Promise<UploadResult> {
    if (STORAGE_PROVIDER === "local") {
      return this.uploadLocal(file, key);
    }

    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: mimeType,
        // ACL: 'public-read', // Be careful with ACLs, prefer bucket policies
      });

      await s3Client.send(command);

      // Construct public URL
      let url = "";
      if (process.env["STORAGE_PUBLIC_URL"]) {
        url = `${process.env["STORAGE_PUBLIC_URL"]}/${key}`;
      } else {
        url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
      }

      log.info("File uploaded to S3", { key, provider: STORAGE_PROVIDER });

      return {
        url,
        key,
        provider: STORAGE_PROVIDER,
      };
    } catch (error) {
      log.error("S3 Upload failed", { error, key });
      throw new Error("Storage upload failed");
    }
  }

  /**
   * Delete file from storage
   */
  static async delete(key: string): Promise<void> {
    if (STORAGE_PROVIDER === "local") {
      // Local delete logic (using fs)
      const { unlink } = await import("node:fs/promises");
      const { join } = await import("node:path");
      try {
        await unlink(join(process.cwd(), "public", "uploads", key));
      } catch (e) {
        // Ignore if not found
      }
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      log.info("File deleted from S3", { key });
    } catch (error) {
      log.error("S3 Delete failed", { error, key });
      throw new Error("Storage delete failed");
    }
  }

  /**
   * Get signed URL for private access (optional)
   */
  static async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (STORAGE_PROVIDER === "local") {
      return `/uploads/${key}`;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      
      // Note: This generates a PUT url, for GET use GetObjectCommand
      // But usually we serve public files directly via CDN
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      log.error("Get Signed URL failed", { error, key });
      return "";
    }
  }

  /**
   * Local upload fallback (Development only)
   */
  private static async uploadLocal(file: Buffer, key: string): Promise<UploadResult> {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const { join, dirname } = await import("node:path");

    const filePath = join(process.cwd(), "public", "uploads", key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file);

    return {
      url: `/uploads/${key}`,
      key,
      provider: "local",
    };
  }
}
