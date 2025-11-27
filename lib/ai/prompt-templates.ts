/**
 * AI Prompt Templates za Osnovce
 * Specifični promptovi za različite predmete i situacije
 */

// Tipovi predmeta
export type SubjectType = 
  | "matematika" 
  | "srpski" 
  | "engleski" 
  | "priroda" 
  | "istorija" 
  | "geografija"
  | "fizika"
  | "hemija"
  | "biologija"
  | "muzicko"
  | "likovno"
  | "tehnicko"
  | "informatika"
  | "opste";

// Prompt za analizu slike zadatka
export const IMAGE_ANALYSIS_PROMPT = `Pogledaj ovu sliku zadatka i pomozi učeniku da ga reši.

KORACI:
1. Opiši šta vidiš na slici
2. Identifikuj tip zadatka
3. Objasni kako pristupiti rešavanju
4. Vodi učenika kroz rešenje korak po korak
5. Ne daj direktan odgovor - pitaj učenika šta misli

Ako je rukopis nečitak, zatraži pojašnjenje.`;

// Promptovi za pomoć sa domaćim
export const HOMEWORK_HELP_PROMPTS: Record<SubjectType, string> = {
  matematika: `Pomozi mi sa ovim matematičkim zadatkom. 
Objasni korak po korak i proveri da li razumem svaki korak pre nego što pređeš na sledeći.
Koristi jednostavne primere iz svakodnevnog života.`,

  srpski: `Pomozi mi sa ovim zadatkom iz srpskog jezika.
Objasni gramatička pravila jednostavno sa primerima.
Ako je sastav, pomozi mi da organizujem misli.`,

  engleski: `Help me with this English task.
Objasni na srpskom, ali daj primere na engleskom.
Pomozi mi sa prevođenjem i gramatikom.`,

  priroda: `Pomozi mi da razumem ovu temu iz prirode i društva.
Objasni naučne pojmove jednostavno.
Koristi primere koje mogu videti u svakodnevnom životu.`,

  istorija: `Pomozi mi sa ovom temom iz istorije.
Ispričaj kao zanimljivu priču.
Pomozi mi da zapamtim važne datume i događaje.`,

  geografija: `Pomozi mi sa ovom temom iz geografije.
Opiši lokacije i pojave slikovito.
Pomozi mi da razumem karte i pravce.`,

  fizika: `Pomozi mi sa ovim zadatkom iz fizike.
Objasni formule i zakone jednostavno.
Pokaži praktične primere iz života.`,

  hemija: `Pomozi mi sa ovom temom iz hemije.
Objasni hemijske reakcije korak po korak.
Koristi analogije koje mogu razumeti.`,

  biologija: `Pomozi mi sa ovom temom iz biologije.
Objasni procese u živim bićima jednostavno.
Koristi dijagrame i opise.`,

  muzicko: `Pomozi mi sa muzičkim obrazovanjem.
Objasni note, ritam ili kompozitore.
Koristi primere pesama koje poznajem.`,

  likovno: `Pomozi mi sa likovnim zadatkom.
Objasni tehnike crtanja ili slikanja.
Daj savete za poboljšanje.`,

  tehnicko: `Pomozi mi sa tehničkim obrazovanjem.
Objasni kako nešto napraviti korak po korak.
Daj savete za materijale i alate.`,

  informatika: `Pomozi mi sa informatikom.
Objasni koncepte programiranja ili rada na računaru.
Koristi jednostavne primere.`,

  opste: `Pomozi mi sa ovim zadatkom.
Objasni jednostavno i korak po korak.
Pitaj me da proverim da li razumem.`,
};

// Promptovi za različite tipove pitanja
export const QUESTION_TYPE_PROMPTS = {
  explanation: `Objasni mi ovo:`,
  howTo: `Kako da uradim ovo:`,
  whyIs: `Zašto je ovo tako:`,
  whatIf: `Šta bi se desilo ako:`,
  compare: `Uporedi ovo:`,
  example: `Daj mi primer za:`,
  practice: `Daj mi vežbu za:`,
  check: `Proveri moj rad:`,
};

// Ohrabrujuće poruke za kraj odgovora
export const ENCOURAGEMENT_MESSAGES = [
  "Super što vežbaš! 🌟",
  "Svaka čast na trudu! 💪",
  "Odlično pitanje! ✨",
  "Ti to možeš! 🚀",
  "Nastavi tako! 🎯",
  "Bravo za učenje! 📚",
  "Svaki korak napred se računa! 🏆",
  "Učenje je super moć! 🦸",
];

// Fallback odgovori kad AI nije dostupan
export const FALLBACK_RESPONSES = {
  unavailable: `Ups! AI Tutor trenutno nije dostupan. 😔

Evo šta možeš uraditi:
1. 📖 Proveri udžbenik za to gradivo
2. 📝 Pregledaj beleške sa časa
3. 👨‍👩‍👧 Pitaj roditelja ili starijeg brata/sestru
4. 🔄 Pokušaj ponovo malo kasnije

Siguran sam da ćeš uspeti! 💪`,

  error: `Hmm, nešto nije u redu sa mojim odgovorom. 🤔

Pokušaj:
1. Da preformulišeš pitanje
2. Da dodaš više detalja
3. Da pošalješ sliku zadatka

Hajde ponovo! 🔄`,

  tooComplex: `Ovo pitanje je malo kompleksno za mene. 🧐

Predlažem:
1. Podeli pitanje na manje delove
2. Pitaj za svaki deo posebno
3. Dodaj više konteksta

Probaj ponovo sa jednostavnijim pitanjem! ✨`,
};

/**
 * Get prompt for specific subject
 */
export function getSubjectPrompt(subject: string | undefined): string {
  if (!subject) return HOMEWORK_HELP_PROMPTS.opste;
  
  const normalizedSubject = subject.toLowerCase().trim();
  
  // Try exact match first
  if (normalizedSubject in HOMEWORK_HELP_PROMPTS) {
    return HOMEWORK_HELP_PROMPTS[normalizedSubject as SubjectType];
  }
  
  // Try partial match
  for (const [key, prompt] of Object.entries(HOMEWORK_HELP_PROMPTS)) {
    if (normalizedSubject.includes(key) || key.includes(normalizedSubject)) {
      return prompt;
    }
  }
  
  return HOMEWORK_HELP_PROMPTS.opste;
}

/**
 * Get random encouragement message
 */
export function getRandomEncouragement(): string {
  const index = Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length);
  return ENCOURAGEMENT_MESSAGES[index] ?? "Super što vežbaš! 🌟";
}

/**
 * Detect question type from query
 */
export function detectQuestionType(query: string): keyof typeof QUESTION_TYPE_PROMPTS {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("objasni") || lowerQuery.includes("šta je") || lowerQuery.includes("sta je")) {
    return "explanation";
  }
  if (lowerQuery.includes("kako") || lowerQuery.includes("na koji način")) {
    return "howTo";
  }
  if (lowerQuery.includes("zašto") || lowerQuery.includes("zasto")) {
    return "whyIs";
  }
  if (lowerQuery.includes("šta ako") || lowerQuery.includes("sta ako") || lowerQuery.includes("šta bi")) {
    return "whatIf";
  }
  if (lowerQuery.includes("uporedi") || lowerQuery.includes("razlika")) {
    return "compare";
  }
  if (lowerQuery.includes("primer") || lowerQuery.includes("primjer")) {
    return "example";
  }
  if (lowerQuery.includes("vežba") || lowerQuery.includes("zadatak za vežbu")) {
    return "practice";
  }
  if (lowerQuery.includes("proveri") || lowerQuery.includes("da li je tačno")) {
    return "check";
  }
  
  return "explanation";
}
