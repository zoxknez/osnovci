/**
 * Gemini Pro AI Client
 * Wrapper za Google Generative AI API - optimizovan za decu
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { log } from "@/lib/logger";

// Lazy initialization - only create client when needed
let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!process.env["GEMINI_API_KEY"]) {
    log.warn("GEMINI_API_KEY is not set - AI Tutor will use fallback responses");
    return null;
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env["GEMINI_API_KEY"]);
  }
  
  return genAI;
}

// Safety settings - strict for children
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Generation config optimized for educational content
const generationConfig = {
  temperature: 0.7,      // Balanced creativity vs. accuracy
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024, // Reasonable length for explanations
};

export interface TutorRequest {
  query: string;
  imageBase64?: string;
  imageMimeType?: string;
  subject?: string;
  studentAge?: number;
}

export interface TutorResponse {
  success: boolean;
  response?: string;
  error?: string;
}

/**
 * Generate educational response using Gemini Pro
 * Supports both text and image inputs (multimodal)
 */
export async function generateTutorResponse(request: TutorRequest): Promise<TutorResponse> {
  const client = getClient();
  
  if (!client) {
    return {
      success: false,
      error: "AI Tutor nije dostupan. Molimo pokušaj kasnije.",
    };
  }

  try {
    // Use gemini-1.5-flash for speed and cost efficiency
    const modelName = request.imageBase64 ? "gemini-1.5-flash" : "gemini-1.5-flash";
    const model = client.getGenerativeModel({ 
      model: modelName,
      safetySettings,
      generationConfig,
    });

    // Build the prompt with system instructions
    const systemPrompt = buildSystemPrompt(request.subject, request.studentAge);
    
    // Prepare content parts
    const parts: any[] = [
      { text: systemPrompt + "\n\n" + request.query }
    ];

    // Add image if provided (multimodal)
    if (request.imageBase64 && request.imageMimeType) {
      parts.push({
        inlineData: {
          mimeType: request.imageMimeType,
          data: request.imageBase64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();

    if (!text) {
      return {
        success: false,
        error: "AI nije mogao da generiše odgovor. Pokušaj ponovo.",
      };
    }

    log.info("Gemini response generated", { 
      subject: request.subject,
      hasImage: !!request.imageBase64,
      responseLength: text.length,
    });

    return {
      success: true,
      response: text,
    };

  } catch (error: any) {
    log.error("Gemini API error", { error: error.message });
    
    // Handle specific error types
    if (error.message?.includes("SAFETY")) {
      return {
        success: false,
        error: "Ups! To pitanje ne mogu da obradim. Pokušaj sa drugačijim pitanjem. 🤔",
      };
    }
    
    if (error.message?.includes("quota") || error.message?.includes("rate")) {
      return {
        success: false,
        error: "AI Tutor je trenutno zauzet. Sačekaj malo pa pokušaj ponovo. ⏳",
      };
    }

    return {
      success: false,
      error: "Došlo je do greške. Pokušaj ponovo. 🔄",
    };
  }
}

/**
 * Build system prompt based on subject and age
 */
function buildSystemPrompt(subject?: string, age?: number): string {
  const ageGroup = age && age < 10 ? "mlađe" : "starije";
  const complexity = age && age < 10 ? "veoma jednostavno" : "jasno i razumljivo";

  let basePrompt = `Ti si "Tutor", prijateljski AI asistent za učenike osnovne škole u Srbiji.

PRAVILA:
1. Objašnjavaj ${complexity}, korak po korak
2. NIKADA ne daj gotov odgovor - vodi učenika do rešenja pitanjima
3. Koristi ohrabrujući ton sa emoji-jima 🌟 ✨ 💪
4. Ako učenik greši, budi strpljiv i pomozi mu da sam uoči grešku
5. Prilagodi objašnjenja za ${ageGroup} osnovce
6. Odgovaraj na srpskom jeziku (latinica)
7. Za matematiku: pokaži međukorake i proveru
8. Za jezike: daj primere i pravila
9. Budi kratak - maksimum 3-4 pasusa`;

  // Subject-specific instructions
  if (subject) {
    const subjectPrompts: Record<string, string> = {
      "matematika": `\n\nZa MATEMATIKU:
- Pokaži svaki korak računanja
- Koristi vizuelne primere kad je moguće
- Proveri rezultat zajedno sa učenikom
- Objasni "zašto", ne samo "kako"`,
      
      "srpski": `\n\nZa SRPSKI JEZIK:
- Objasni gramatička pravila jednostavno
- Daj primere iz svakodnevnog života
- Pomozi sa pravopisom i interpunkcijom
- Koristi zanimljive rečenice kao primere`,
      
      "engleski": `\n\nZa ENGLESKI JEZIK:
- Objasni na srpskom, primere daj na engleskom
- Pomozi sa izgovorom (fonetski)
- Poveži sa sličnim rečima u srpskom
- Daj praktične fraze koje mogu koristiti`,
      
      "priroda": `\n\nZa PRIRODU I DRUŠTVO:
- Koristi zanimljive činjenice
- Poveži sa svakodnevnim životom
- Predloži jednostavne eksperimente
- Objasni "zašto" se nešto dešava`,
      
      "istorija": `\n\nZa ISTORIJU:
- Ispričaj kao priču
- Poveži događaje uzročno-posledično
- Koristi zanimljive detalje o ličnostima
- Pomozi sa hronologijom`,
      
      "geografija": `\n\nZa GEOGRAFIJU:
- Opisuj lokacije slikovito
- Poveži sa mapama i pravcima
- Koristi poređenja sa poznatim mestima
- Objasni klimu i prirodne pojave jednostavno`,
    };

    const subjectKey = subject.toLowerCase();
    for (const [key, prompt] of Object.entries(subjectPrompts)) {
      if (subjectKey.includes(key)) {
        basePrompt += prompt;
        break;
      }
    }
  }

  return basePrompt;
}

/**
 * Check if Gemini API is available
 */
export function isGeminiAvailable(): boolean {
  return !!process.env["GEMINI_API_KEY"];
}
