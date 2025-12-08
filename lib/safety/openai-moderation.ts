/**
 * OpenAI Moderation API Integration
 * FREE API for text content moderation
 * Detects: hate, hate/threatening, self-harm, sexual, sexual/minors, violence, violence/graphic
 */

import { log } from "@/lib/logger";

export interface OpenAIModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    "hate/threatening": boolean;
    harassment: boolean;
    "harassment/threatening": boolean;
    "self-harm": boolean;
    "self-harm/intent": boolean;
    "self-harm/instructions": boolean;
    sexual: boolean;
    "sexual/minors": boolean;
    violence: boolean;
    "violence/graphic": boolean;
  };
  categoryScores: {
    hate: number;
    "hate/threatening": number;
    harassment: number;
    "harassment/threatening": number;
    "self-harm": number;
    "self-harm/intent": number;
    "self-harm/instructions": number;
    sexual: number;
    "sexual/minors": number;
    violence: number;
    "violence/graphic": number;
  };
  severity: "none" | "low" | "medium" | "high" | "critical";
  highestScore: number;
  flaggedCategories: string[];
}

/**
 * Moderate text using OpenAI Moderation API (FREE)
 */
export async function moderateTextWithAI(
  text: string,
): Promise<OpenAIModerationResult> {
  const apiKey = process.env["OPENAI_API_KEY"];

  // Fallback if OpenAI not configured
  if (!apiKey) {
    log.warn("OpenAI API key not configured - skipping AI moderation");
    return createFallbackResult();
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: "text-moderation-latest", // Latest stable model
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log.error("OpenAI Moderation API error", {
        status: response.status,
        error,
      });
      return createFallbackResult();
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) {
      log.error("OpenAI Moderation API returned no results");
      return createFallbackResult();
    }

    // Calculate severity based on scores
    const scores = result.category_scores;
    const highestScore = Math.max(...Object.values(scores).map(Number));

    let severity: "none" | "low" | "medium" | "high" | "critical" = "none";
    if (highestScore >= 0.9) severity = "critical";
    else if (highestScore >= 0.7) severity = "high";
    else if (highestScore >= 0.5) severity = "medium";
    else if (highestScore >= 0.3) severity = "low";

    // Get flagged categories
    const flaggedCategories: string[] = [];
    for (const [category, flagged] of Object.entries(result.categories)) {
      if (flagged) {
        flaggedCategories.push(category);
      }
    }

    const moderationResult: OpenAIModerationResult = {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
      severity,
      highestScore,
      flaggedCategories,
    };

    log.info("OpenAI moderation completed", {
      flagged: result.flagged,
      severity,
      highestScore: highestScore.toFixed(3),
      flaggedCount: flaggedCategories.length,
    });

    return moderationResult;
  } catch (error) {
    log.error("OpenAI moderation failed", error);
    return createFallbackResult();
  }
}

/**
 * Batch moderate multiple texts (optimized)
 */
export async function moderateTextsWithAI(
  texts: string[],
): Promise<OpenAIModerationResult[]> {
  const apiKey = process.env["OPENAI_API_KEY"];

  if (!apiKey) {
    return texts.map(() => createFallbackResult());
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: "text-moderation-latest",
      }),
    });

    if (!response.ok) {
      return texts.map(() => createFallbackResult());
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((result: any) => {
      const scores = result.category_scores;
      const highestScore = Math.max(...Object.values(scores).map(Number));

      let severity: "none" | "low" | "medium" | "high" | "critical" = "none";
      if (highestScore >= 0.9) severity = "critical";
      else if (highestScore >= 0.7) severity = "high";
      else if (highestScore >= 0.5) severity = "medium";
      else if (highestScore >= 0.3) severity = "low";

      const flaggedCategories: string[] = [];
      for (const [category, flagged] of Object.entries(result.categories)) {
        if (flagged) {
          flaggedCategories.push(category);
        }
      }

      return {
        flagged: result.flagged,
        categories: result.categories,
        categoryScores: result.category_scores,
        severity,
        highestScore,
        flaggedCategories,
      };
    });
  } catch (error) {
    log.error("Batch OpenAI moderation failed", error);
    return texts.map(() => createFallbackResult());
  }
}

/**
 * Create fallback result when AI is unavailable
 */
function createFallbackResult(): OpenAIModerationResult {
  return {
    flagged: false,
    categories: {
      hate: false,
      "hate/threatening": false,
      harassment: false,
      "harassment/threatening": false,
      "self-harm": false,
      "self-harm/intent": false,
      "self-harm/instructions": false,
      sexual: false,
      "sexual/minors": false,
      violence: false,
      "violence/graphic": false,
    },
    categoryScores: {
      hate: 0,
      "hate/threatening": 0,
      harassment: 0,
      "harassment/threatening": 0,
      "self-harm": 0,
      "self-harm/intent": 0,
      "self-harm/instructions": 0,
      sexual: 0,
      "sexual/minors": 0,
      violence: 0,
      "violence/graphic": 0,
    },
    severity: "none",
    highestScore: 0,
    flaggedCategories: [],
  };
}

/**
 * Check if OpenAI moderation is enabled
 */
export function isOpenAIModerationEnabled(): boolean {
  return !!process.env["OPENAI_API_KEY"];
}

/**
 * Get action recommendation based on AI result
 */
export function getRecommendedAction(result: OpenAIModerationResult): {
  action: "allow" | "warn" | "filter" | "block" | "flag";
  notifyParent: boolean;
  blockReason?: string;
} {
  if (!result.flagged) {
    return { action: "allow", notifyParent: false };
  }

  // Critical violations (immediate block)
  if (result.severity === "critical") {
    return {
      action: "block",
      notifyParent: true,
      blockReason: `Critical violation: ${result.flaggedCategories.join(", ")}`,
    };
  }

  // High severity (block and notify)
  if (result.severity === "high") {
    return {
      action: "block",
      notifyParent: true,
      blockReason: `High risk content detected: ${result.flaggedCategories.join(", ")}`,
    };
  }

  // Medium severity (filter content, notify parent)
  if (result.severity === "medium") {
    return {
      action: "filter",
      notifyParent: true,
    };
  }

  // Low severity (warn, flag for review)
  if (result.severity === "low") {
    return {
      action: "flag",
      notifyParent: false,
    };
  }

  return { action: "allow", notifyParent: false };
}
