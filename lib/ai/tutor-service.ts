import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { generateTutorResponse, isGeminiAvailable } from "./gemini-client";
import { filterResponseForChildren, adjustForAge } from "./child-content-filter";
import { getSubjectPrompt, getRandomEncouragement, FALLBACK_RESPONSES, IMAGE_ANALYSIS_PROMPT } from "./prompt-templates";

export interface AiTutorRequest {
  studentId: string;
  subjectId?: string | undefined;
  query?: string | undefined;
  imageUrl?: string | undefined;
  imageBase64?: string | undefined;
  imageMimeType?: string | undefined;
}

export interface AiTutorResponse {
  success: boolean;
  response?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Process a question using the AI Tutor
 * Uses Gemini Pro for intelligent, child-friendly responses
 */
export async function askAiTutor(request: AiTutorRequest): Promise<AiTutorResponse> {
  try {
    const { studentId, subjectId, query, imageUrl, imageBase64, imageMimeType } = request;

    if (!query && !imageUrl && !imageBase64) {
      return { success: false, error: "Pitanje ili slika je obavezna" };
    }

    // Get student info for age-appropriate responses
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { 
        birthDate: true,
        grade: true,
      },
    });

    // Calculate age for age-appropriate responses
    let studentAge: number | undefined;
    if (student?.birthDate) {
      const today = new Date();
      studentAge = today.getFullYear() - student.birthDate.getFullYear();
    }

    // Get subject name for context
    let subjectName: string | undefined;
    if (subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { name: true },
      });
      subjectName = subject?.name;
    }

    let aiResponse: string;

    // Check if Gemini is available
    if (isGeminiAvailable()) {
      // Build the full query with subject context
      let fullQuery = query || "";
      
      if (subjectName) {
        fullQuery = `[Predmet: ${subjectName}]\n\n${getSubjectPrompt(subjectName)}\n\n${fullQuery}`;
      }

      // Add image analysis prompt if image is provided
      if (imageBase64 || imageUrl) {
        fullQuery = `${IMAGE_ANALYSIS_PROMPT}\n\n${fullQuery}`;
      }

      // Call Gemini API
      const geminiResponse = await generateTutorResponse({
        query: fullQuery,
        ...(imageBase64 && { imageBase64 }),
        ...(imageMimeType && { imageMimeType }),
        ...(subjectName && { subject: subjectName }),
        ...(studentAge && { studentAge }),
      });

      if (geminiResponse.success && geminiResponse.response) {
        // Filter response for child safety
        aiResponse = filterResponseForChildren(geminiResponse.response);
        
        // Adjust for age
        aiResponse = adjustForAge(aiResponse, studentAge);
        
        // Add encouragement if not present
        if (!aiResponse.includes("🌟") && !aiResponse.includes("💪")) {
          aiResponse += `\n\n${getRandomEncouragement()}`;
        }
      } else {
        // Gemini failed, use fallback
        aiResponse = geminiResponse.error || FALLBACK_RESPONSES.error;
      }
    } else {
      // Gemini not available, use intelligent fallback
      aiResponse = generateFallbackResponse(query, subjectName, imageUrl || imageBase64);
    }

    // Save the interaction to the database
    const session = await prisma.aiTutorSession.create({
      data: {
        studentId,
        subjectId: subjectId ?? null,
        query: query ?? null,
        imageUrl: imageUrl ?? null,
        response: aiResponse,
      },
    });

    log.info("AI Tutor session created", {
      sessionId: session.id,
      studentId,
      subject: subjectName,
      hasImage: !!(imageUrl || imageBase64),
      responseLength: aiResponse.length,
    });

    return {
      success: true,
      response: aiResponse,
      sessionId: session.id,
    };

  } catch (error) {
    log.error("AI Tutor Error", { error, studentId: request.studentId });
    return { 
      success: false, 
      error: "Došlo je do greške. Pokušaj ponovo. 🔄" 
    };
  }
}

/**
 * Generate intelligent fallback response when AI is not available
 */
function generateFallbackResponse(
  query: string | undefined, 
  subject: string | undefined,
  hasImage: string | undefined
): string {
  let response = FALLBACK_RESPONSES.unavailable;

  if (query) {
    // Provide some basic guidance based on keywords
    const lowerQuery = query.toLowerCase();
    
    if (subject?.toLowerCase().includes("matematika") || lowerQuery.includes("izračunaj") || lowerQuery.includes("koliko")) {
      response = `📐 **Matematika - Saveti za rešavanje:**

1. **Pročitaj zadatak pažljivo** - šta se traži?
2. **Izdvoji poznate podatke** - šta znaš?
3. **Odaberi operaciju** - sabiranje, oduzimanje, množenje ili deljenje?
4. **Reši korak po korak** - ne žuri!
5. **Proveri rezultat** - da li ima smisla?

${getRandomEncouragement()}

_AI Tutor nije trenutno dostupan, ali siguran sam da možeš sam!_`;
    } else if (subject?.toLowerCase().includes("srpski") || lowerQuery.includes("gramatika") || lowerQuery.includes("pravopis")) {
      response = `📝 **Srpski jezik - Saveti:**

1. **Pročitaj tekst više puta**
2. **Podvuci ključne reči**
3. **Razmisli o pravilu** koje se primenjuje
4. **Proveri u udžbeniku** ako nisi siguran
5. **Napiši odgovor čitko**

${getRandomEncouragement()}

_AI Tutor nije trenutno dostupan, ali ti ovo možeš!_`;
    }
  }

  if (hasImage) {
    response = `📷 **Primio sam sliku zadatka!**

Nažalost, AI Tutor trenutno nije dostupan za analizu slike.

**Šta možeš uraditi:**
1. Prepiši zadatak tekstualno i pitaj ponovo
2. Zamoli roditelja ili brata/sestru za pomoć
3. Pokušaj kasnije kada AI bude dostupan

${getRandomEncouragement()}`;
  }

  return response;
}

/**
 * Get history of AI Tutor sessions for a student
 */
export async function getAiTutorHistory(studentId: string, limit = 20) {
  try {
    const history = await prisma.aiTutorSession.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        subject: {
          select: { name: true, color: true, icon: true }
        }
      }
    });
    return history;
  } catch (error) {
    log.error("AI Tutor History Error", { error, studentId });
    return [];
  }
}

/**
 * Get AI usage stats for a student
 */
export async function getAiTutorStats(studentId: string) {
  try {
    const [totalSessions, sessionsBySubject, recentActivity] = await Promise.all([
      // Total sessions count
      prisma.aiTutorSession.count({
        where: { studentId },
      }),
      
      // Sessions grouped by subject
      prisma.aiTutorSession.groupBy({
        by: ["subjectId"],
        where: { studentId },
        _count: true,
      }),
      
      // Recent 7 days activity
      prisma.aiTutorSession.count({
        where: {
          studentId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalSessions,
      sessionsBySubject,
      recentActivity,
    };
  } catch (error) {
    log.error("AI Tutor Stats Error", { error, studentId });
    return null;
  }
}
