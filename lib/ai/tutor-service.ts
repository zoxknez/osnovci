import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export interface AiTutorRequest {
  studentId: string;
  subjectId?: string | undefined;
  query?: string | undefined;
  imageUrl?: string | undefined;
}

export interface AiTutorResponse {
  success: boolean;
  response?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Process a question using the AI Tutor
 * Currently mocked to return a standard response
 */
export async function askAiTutor(request: AiTutorRequest): Promise<AiTutorResponse> {
  try {
    const { studentId, subjectId, query, imageUrl } = request;

    if (!query && !imageUrl) {
      return { success: false, error: "Query or Image is required" };
    }

    // TODO: Integrate with OpenAI or similar API
    // For now, we return a mocked response based on the input
    let aiResponse = "I am your AI Tutor. I can help you with your homework. ";
    
    if (query) {
      aiResponse += `\n\nYou asked: "${query}". \n\nHere is a step-by-step explanation... (AI integration pending)`;
    }
    
    if (imageUrl) {
      aiResponse += `\n\nI see you uploaded an image. I will analyze it and help you solve the problem.`;
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

    return {
      success: true,
      response: aiResponse,
      sessionId: session.id,
    };

  } catch (error) {
    log.error("AI Tutor Error", { error, studentId: request.studentId });
    return { success: false, error: "Failed to process request" };
  }
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
