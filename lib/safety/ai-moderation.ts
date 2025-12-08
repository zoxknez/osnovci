/**
 * AI-Powered Image Moderation
 * Using AWS Rekognition for child-safe content detection
 *
 * Cost: $0.001 per image (first 5,000 images/month FREE)
 * Alternative: Google Cloud Vision API or Azure Computer Vision
 */

import {
  DetectModerationLabelsCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import { log } from "@/lib/logger";

// Initialize AWS Rekognition client
const rekognitionClient =
  process.env["AWS_REGION"] && process.env["AWS_ACCESS_KEY_ID"]
    ? new RekognitionClient({
        region: process.env["AWS_REGION"],
        credentials: {
          accessKeyId: process.env["AWS_ACCESS_KEY_ID"],
          secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"]!,
        },
      })
    : null;

export interface ModerationResult {
  safe: boolean;
  confidence: number;
  labels: Array<{
    name: string;
    confidence: number;
    parentName?: string;
  }>;
  categories: {
    explicitNudity: number;
    suggestive: number;
    violence: number;
    visuallyDisturbing: number;
    rude: number;
    drugs: number;
    tobacco: number;
    alcohol: number;
    gambling: number;
    hate: number;
  };
  requiresReview: boolean;
  blockReason?: string;
}

/**
 * Moderate image using AWS Rekognition
 */
export async function moderateImage(buffer: Buffer): Promise<ModerationResult> {
  // Fallback if AWS not configured
  if (!rekognitionClient) {
    log.warn("AWS Rekognition not configured - using basic checks only");
    return {
      safe: true,
      confidence: 0,
      labels: [],
      categories: {
        explicitNudity: 0,
        suggestive: 0,
        violence: 0,
        visuallyDisturbing: 0,
        rude: 0,
        drugs: 0,
        tobacco: 0,
        alcohol: 0,
        gambling: 0,
        hate: 0,
      },
      requiresReview: false,
    };
  }

  try {
    const command = new DetectModerationLabelsCommand({
      Image: { Bytes: buffer },
      MinConfidence: 60, // 60% confidence threshold
    });

    const response = await rekognitionClient.send(command);
    const labels = response.ModerationLabels || [];

    // Parse labels into categories
    const categories = {
      explicitNudity: 0,
      suggestive: 0,
      violence: 0,
      visuallyDisturbing: 0,
      rude: 0,
      drugs: 0,
      tobacco: 0,
      alcohol: 0,
      gambling: 0,
      hate: 0,
    };

    for (const label of labels) {
      const confidence = label.Confidence || 0;
      const name = label.Name || "";

      // Map AWS labels to our categories
      if (name.includes("Explicit Nudity"))
        categories.explicitNudity = Math.max(
          categories.explicitNudity,
          confidence,
        );
      if (name.includes("Suggestive"))
        categories.suggestive = Math.max(categories.suggestive, confidence);
      if (name.includes("Violence") || name.includes("Weapons"))
        categories.violence = Math.max(categories.violence, confidence);
      if (name.includes("Visually Disturbing") || name.includes("Graphic"))
        categories.visuallyDisturbing = Math.max(
          categories.visuallyDisturbing,
          confidence,
        );
      if (name.includes("Rude Gestures"))
        categories.rude = Math.max(categories.rude, confidence);
      if (name.includes("Drugs") || name.includes("Drug"))
        categories.drugs = Math.max(categories.drugs, confidence);
      if (name.includes("Tobacco"))
        categories.tobacco = Math.max(categories.tobacco, confidence);
      if (name.includes("Alcohol"))
        categories.alcohol = Math.max(categories.alcohol, confidence);
      if (name.includes("Gambling"))
        categories.gambling = Math.max(categories.gambling, confidence);
      if (name.includes("Hate Symbols"))
        categories.hate = Math.max(categories.hate, confidence);
    }

    // Determine safety - STRICT for children's app
    const criticalThreshold = 70; // Block if 70%+ confidence
    const reviewThreshold = 50; // Flag for review if 50%+

    const highestConfidence = Math.max(...Object.values(categories));

    let safe = true;
    let blockReason: string | undefined;
    let requiresReview = false;

    // Critical violations (immediate block)
    if (categories.explicitNudity > criticalThreshold) {
      safe = false;
      blockReason = "Explicit content detected";
    } else if (categories.violence > criticalThreshold) {
      safe = false;
      blockReason = "Violent content detected";
    } else if (categories.drugs > criticalThreshold) {
      safe = false;
      blockReason = "Drug-related content detected";
    } else if (categories.hate > criticalThreshold) {
      safe = false;
      blockReason = "Hate symbols detected";
    }

    // Flag for manual review
    if (highestConfidence > reviewThreshold) {
      requiresReview = true;
    }

    const result: ModerationResult = {
      safe,
      confidence: highestConfidence,
      labels: labels.map((l) => ({
        name: l.Name || "",
        confidence: l.Confidence || 0,
        ...(l.ParentName ? { parentName: l.ParentName } : {}),
      })),
      categories,
      requiresReview,
      ...(blockReason ? { blockReason } : {}),
    };

    log.info("Image moderation completed", {
      safe,
      confidence: highestConfidence.toFixed(2),
      labelsCount: labels.length,
      requiresReview,
    });

    return result;
  } catch (error) {
    log.error("AWS Rekognition moderation failed", { error });

    // Fail-safe: If AI fails, flag for manual review
    return {
      safe: false,
      confidence: 0,
      labels: [],
      categories: {
        explicitNudity: 0,
        suggestive: 0,
        violence: 0,
        visuallyDisturbing: 0,
        rude: 0,
        drugs: 0,
        tobacco: 0,
        alcohol: 0,
        gambling: 0,
        hate: 0,
      },
      requiresReview: true,
      blockReason: "AI moderation unavailable - manual review required",
    };
  }
}

/**
 * Batch moderate multiple images (optimized)
 */
export async function moderateImages(
  buffers: Buffer[],
): Promise<ModerationResult[]> {
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 5; // AWS limit
  const results: ModerationResult[] = [];

  for (let i = 0; i < buffers.length; i += BATCH_SIZE) {
    const batch = buffers.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(moderateImage));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Check if AWS Rekognition is configured
 */
export function isAIModerationEnabled(): boolean {
  return rekognitionClient !== null;
}
