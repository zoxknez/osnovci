/**
 * AI Homework Helper
 * Pomaže učeniku da SAM reši zadatak kroz step-by-step guidance
 * NIKAD ne daje direktne odgovore - samo vodi kroz proces učenja
 */

import { log } from "@/lib/logger";

interface HomeworkHelpRequest {
  photoUrl?: string;
  text?: string;
  subject: string;
  grade: number;
  homeworkId?: string;
}

interface Step {
  number: number;
  instruction: string;
  hint?: string;
  explanation: string;
  checkPoint?: string; // Šta učenik treba da proveri pre nego što nastavi
}

interface HomeworkHelpResponse {
  steps: Step[];
  encouragement: string;
  similarProblems?: Array<{
    problem: string;
    solutionSteps: string[];
  }>;
  learningTips: string[];
}

/**
 * AI Homework Helper - Vodi kroz proces, ne daje odgovore
 */
export async function getHomeworkHelp(
  request: HomeworkHelpRequest,
): Promise<HomeworkHelpResponse> {
  try {
    // OCR - prepoznaj tekst sa slike (ako postoji)
    let problemText = request.text || "";

    if (request.photoUrl && !problemText) {
      // TODO: Integrisati OCR (Google Cloud Vision ili Tesseract.js)
      // Za sada koristimo placeholder
      problemText = await extractTextFromImage(request.photoUrl);
    }

    // AI analiza - identifikuj tip zadatka i predmet
    const analysis = await analyzeProblem(
      problemText,
      request.subject,
      request.grade,
    );

    // Generiši step-by-step guidance (NE direktne odgovore)
    const steps = await generateLearningSteps(analysis, request.grade);

    // Dodaj encouragement i learning tips
    const encouragement = getEncouragement();
    const learningTips = getLearningTips(request.subject, analysis.problemType);

    // Generiši slične zadatke za vežbanje (bez rešenja)
    const similarProblems = await generateSimilarProblems(
      analysis,
      request.grade,
    );

    return {
      steps,
      encouragement,
      similarProblems,
      learningTips,
    };
  } catch (error) {
    log.error("Error in homework helper", error);
    throw new Error("Greška pri analizi zadatka. Pokušaj ponovo.");
  }
}

/**
 * Analizira problem i identifikuje tip zadatka
 */
async function analyzeProblem(
  problemText: string,
  subject: string,
  grade: number,
): Promise<{
  problemType: string;
  concepts: string[];
  difficulty: "easy" | "medium" | "hard";
  estimatedSteps: number;
}> {
  // TODO: Integrisati sa OpenAI GPT-4 ili Claude
  // Za sada koristimo osnovnu logiku

  const lowerText = problemText.toLowerCase();

  // Matematička analiza
  if (subject.toLowerCase().includes("matematik")) {
    if (lowerText.includes("saberi") || lowerText.includes("+")) {
      return {
        problemType: "sabiranje",
        concepts: ["sabiranje", "brojevi"],
        difficulty: grade <= 3 ? "easy" : "medium",
        estimatedSteps: 3,
      };
    }
    if (lowerText.includes("oduzmi") || lowerText.includes("-")) {
      return {
        problemType: "oduzimanje",
        concepts: ["oduzimanje", "brojevi"],
        difficulty: grade <= 3 ? "easy" : "medium",
        estimatedSteps: 3,
      };
    }
    if (
      lowerText.includes("pomnoži") ||
      lowerText.includes("×") ||
      lowerText.includes("*")
    ) {
      return {
        problemType: "množenje",
        concepts: ["množenje", "tablica množenja"],
        difficulty: grade <= 4 ? "medium" : "easy",
        estimatedSteps: 4,
      };
    }
    if (
      lowerText.includes("podeli") ||
      lowerText.includes("÷") ||
      lowerText.includes("/")
    ) {
      return {
        problemType: "deljenje",
        concepts: ["deljenje", "ostatak"],
        difficulty: "medium",
        estimatedSteps: 5,
      };
    }
    if (lowerText.includes("jednačin") || lowerText.includes("x =")) {
      return {
        problemType: "jednačina",
        concepts: ["jednačine", "algebarske operacije"],
        difficulty: grade <= 5 ? "medium" : "hard",
        estimatedSteps: 6,
      };
    }
  }

  // Default
  return {
    problemType: "opšti",
    concepts: [subject],
    difficulty: "medium",
    estimatedSteps: 4,
  };
}

/**
 * Generiše step-by-step korake za učenje (NE direktne odgovore)
 */
async function generateLearningSteps(
  analysis: Awaited<ReturnType<typeof analyzeProblem>>,
  _grade: number,
): Promise<Step[]> {
  const steps: Step[] = [];

  switch (analysis.problemType) {
    case "sabiranje":
      steps.push(
        {
          number: 1,
          instruction:
            "Pročitaj zadatak pažljivo. Koje brojeve treba da saberem?",
          explanation:
            "Prvo moraš da razumeš šta traži zadatak. Pronađi sve brojeve koje treba da saberem.",
          checkPoint: "Proveri da li si našao/la sve brojeve iz zadatka.",
        },
        {
          number: 2,
          instruction:
            "Napiši brojeve jedan ispod drugog, poravnaj ih po deseticama.",
          explanation:
            "Ako su brojevi dvocifreni ili veći, poravnaj ih tako da su jedinice ispod jedinica, desetice ispod desetica.",
          hint: "Ako je 23 + 45, napiši:\n  23\n+ 45\n---",
        },
        {
          number: 3,
          instruction:
            "Saberi prvo jedinice. Ako je rezultat veći od 9, prenesi deseticu.",
          explanation:
            "Počni sa desne strane. Saberi jedinice. Ako dobiješ 10 ili više, napiši jedinicu i prenesi 1 na desetice.",
          checkPoint:
            "Da li si sabrao/la jedinice? Da li treba da preneseš deseticu?",
        },
        {
          number: 4,
          instruction: "Saberi desetice (i prenesenu deseticu ako je ima).",
          explanation:
            "Sada saberi desetice. Ne zaboravi da dodaš prenesenu deseticu ako je ima.",
        },
        {
          number: 5,
          instruction: "Proveri svoj odgovor - da li ima smisla?",
          explanation:
            "Uvek proveri svoj odgovor. Ako sabiraš dva pozitivna broja, odgovor mora biti veći od oba broja.",
        },
      );
      break;

    case "oduzimanje":
      steps.push(
        {
          number: 1,
          instruction:
            "Pročitaj zadatak. Koji broj je veći? Od većeg oduzmi manji.",
          explanation:
            "Prvo moraš da razumeš koji broj je veći. Uvek oduzimamo manji od većeg.",
        },
        {
          number: 2,
          instruction: "Napiši brojeve jedan ispod drugog, veći gore.",
          explanation:
            "Veći broj ide gore, manji dole. Poravnaj ih po ciframa.",
        },
        {
          number: 3,
          instruction: "Oduzmi jedinice. Ako ne možeš, pozajmi od desetica.",
          explanation:
            "Počni sa desne strane. Ako je gornja cifra manja, pozajmi 1 od desetice.",
          hint: "Ako je 5 - 7, pozajmi od desetice: 15 - 7 = 8",
        },
        {
          number: 4,
          instruction: "Oduzmi desetice (ne zaboravi da si pozajmio/la).",
          explanation:
            "Sada oduzmi desetice. Ne zaboravi da si pozajmio/la jedinicu.",
        },
        {
          number: 5,
          instruction: "Proveri: da li je odgovor manji od većeg broja?",
          explanation:
            "Uvek proveri - ako oduzimaš, odgovor mora biti manji od većeg broja.",
        },
      );
      break;

    case "jednačina":
      steps.push(
        {
          number: 1,
          instruction:
            "Pročitaj jednačinu. Šta traži zadatak? Koja je nepoznata?",
          explanation:
            "Pronađi nepoznatu (obično označena sa x ili drugim slovom).",
        },
        {
          number: 2,
          instruction: "Izoluj nepoznatu na jednoj strani jednačine.",
          explanation:
            "Pokušaj da nepoznatu ostaviš sama na jednoj strani. Koristi suprotne operacije.",
          hint: "Ako je x + 5 = 10, oduzmi 5 sa obe strane: x = 10 - 5",
        },
        {
          number: 3,
          instruction: "Izvrši operacije na drugoj strani jednačine.",
          explanation: "Sada izračunaj vrednost na drugoj strani.",
        },
        {
          number: 4,
          instruction:
            "Proveri svoj odgovor - zameni x u originalnoj jednačini.",
          explanation:
            "Uvek proveri - zameni svoj odgovor u originalnu jednačinu i proveri da li je tačna.",
        },
      );
      break;

    default:
      steps.push(
        {
          number: 1,
          instruction: "Pročitaj zadatak pažljivo. Šta traži?",
          explanation:
            "Prvo moraš da razumeš šta traži zadatak. Podvuci ključne reči.",
        },
        {
          number: 2,
          instruction: "Identifikuj šta znaš i šta ne znaš.",
          explanation: "Napiši šta već znaš iz zadatka i šta treba da nađeš.",
        },
        {
          number: 3,
          instruction: "Razmisli o načinu rešavanja. Koji koraci su potrebni?",
          explanation:
            "Razmisli o tome kako bi mogao/la da rešiš ovaj zadatak. Koje korake treba da uradiš?",
        },
        {
          number: 4,
          instruction: "Reši zadatak korak po korak.",
          explanation:
            "Sada reši zadatak, korak po korak. Ne žuri, proveri svaki korak.",
        },
        {
          number: 5,
          instruction: "Proveri svoj odgovor. Da li ima smisla?",
          explanation:
            "Uvek proveri svoj odgovor. Da li je logičan? Da li odgovara na pitanje iz zadatka?",
        },
      );
  }

  return steps;
}

/**
 * Generiše slične zadatke za vežbanje (bez rešenja)
 */
async function generateSimilarProblems(
  analysis: Awaited<ReturnType<typeof analyzeProblem>>,
  grade: number,
): Promise<Array<{ problem: string; solutionSteps: string[] }>> {
  // TODO: Integrisati sa AI za generisanje sličnih zadataka
  // Za sada koristimo osnovne primere

  const problems: Array<{ problem: string; solutionSteps: string[] }> = [];

  switch (analysis.problemType) {
    case "sabiranje":
      if (grade <= 3) {
        problems.push(
          {
            problem:
              "Ana ima 15 olovaka, a Marko ima 23 olovke. Koliko olovaka imaju zajedno?",
            solutionSteps: [
              "Identifikuj brojeve: 15 i 23",
              "Saberi: 15 + 23",
              "Proveri odgovor",
            ],
          },
          {
            problem:
              "U biblioteci je 28 knjiga na srpskom i 34 knjige na engleskom. Koliko knjiga ima ukupno?",
            solutionSteps: [
              "Identifikuj brojeve: 28 i 34",
              "Saberi: 28 + 34",
              "Proveri odgovor",
            ],
          },
        );
      }
      break;
    // Dodati više primera za druge tipove zadataka
  }

  return problems;
}

/**
 * OCR - ekstraktuje tekst sa slike
 */
async function extractTextFromImage(photoUrl: string): Promise<string> {
  // TODO: Integrisati Google Cloud Vision API ili Tesseract.js
  // Za sada vraćamo placeholder
  log.info("OCR extraction requested", { photoUrl });
  return "Tekst sa slike će biti ekstraktovan ovde";
}

/**
 * Dobija encouragement poruku
 */
function getEncouragement(): string {
  const encouragements = [
    "Odlično! Ti si na pravom putu! 💪",
    "Svaki korak te vodi bliže rešenju! 🌟",
    "Verujem da možeš! Samo polako, korak po korak! 🎯",
    "Učenje je put, ne destinacija. Ti si na dobrom putu! 📚",
    "Svaki zadatak je prilika da naučiš nešto novo! 🚀",
  ];
  return (
    encouragements[Math.floor(Math.random() * encouragements.length)] ??
    "Super si!"
  );
}

/**
 * Dobija learning tips za predmet
 */
function getLearningTips(subject: string, _problemType: string): string[] {
  const tips: string[] = [];

  if (subject.toLowerCase().includes("matematik")) {
    tips.push("Uvek proveri svoj odgovor - zameni ga nazad u zadatak.");
    tips.push("Ako ne razumeš nešto, pročitaj zadatak još jednom, polako.");
    tips.push("Koristi crtež ili dijagram ako ti pomaže da razumeš problem.");
  }

  tips.push("Ne žuri! Bolje je uraditi zadatak tačno nego brzo.");
  tips.push(
    "Ako zaglaviš, probaj da razmisliš o sličnom zadatku koji znaš da rešiš.",
  );

  return tips;
}
