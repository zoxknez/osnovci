/**
 * Comprehensive Serbian Profanity & Inappropriate Content List
 * Used for child safety and bullying prevention
 *
 * ⚠️ IMPORTANT: This list should be regularly updated based on moderation logs
 */

// Tier 1 - Mild insults (warn + filter)
export const SERBIAN_INSULTS = [
  "glupan",
  "glupana",
  "glupo",
  "glup",
  "glupa",
  "budala",
  "budaletina",
  "budale",
  "idiot",
  "idiote",
  "idiotski",
  "debil",
  "debilu",
  "debilski",
  "debilčino",
  "retard",
  "retardiran",
  "retardirano",
  "lud",
  "luda",
  "ludak",
  "ludača",
  "seljak",
  "seljačina",
  "seljacki",
  "primitivac",
  "primitivna",
  "nekulturno",
  "bezobraznik",
  "mrš",
  "gubi se",
  "odlazi",
  "dosadan",
  "dosadna",
  "smor",
];

// Tier 2 - Moderate profanity (block immediately)
export const SERBIAN_PROFANITY = [
  "đavo",
  "đavoli",
  "đavolji",
  "vrag",
  "vražji",
  "dođavola",
  "dovrag",
  "proklet",
  "prokleto",
  "đubre",
  "đubrad",
  "stoka",
  "stočino",
  "kopile",
  "kopilad",
  "gamad",
  "gmazov",
  "šupak",
  "šupalj",
  "kreten",
  "kretenu",
  "kretenska",
  "mongoloid",
  "mongoloidu",
  "mentol",
  "mentolu",
  "mrzim",
  "mrziš",
  "mrzi",
  "mržnja",
  "mržnje",
  "sovini",
  "šovinista",
  "šovinizam",
];

// Tier 3 - Bullying patterns (regex-based detection)
export const BULLYING_PATTERNS = [
  /ti si (glup|loš|debil|idiot|retard)/i,
  /niko te ne (voli|želi|trpi|podnosi)/i,
  /(mrzi|mrzim|mrzimo) te/i,
  /svi te (mrze|ne vole)/i,
  /bolje.*umr(i|eš|eti)/i,
  /trebao.*umreti/i,
  /(ubi|ubij) se/i,
  /ne zaslužuješ/i,
  /najgori si/i,
  /sramotiš (nas|školu|roditelje)/i,
  /smrdiš/i,
  /(ružan|ružna|gadna|gadan) si/i,
  /niko ne (želi|voli) da.*sa tobom/i,
];

// Tier 4 - Discriminatory language (zero tolerance)
export const DISCRIMINATORY_TERMS = [
  "ciganin",
  "ciganka",
  "cigo",
  "rom",
  "romkinja", // Context-dependent, but often used pejoratively
  "šiptar",
  "šiptarka",
  "vlah",
  "vlaški",
  "peder",
  "pederu",
  "pederski",
  "lezba",
  "lezbejka",
  "homić",
  "homo",
  "invalid",
  "hendikepiran",
  "osakačen",
  "nenormalan",
  "nenormalna",
  "bolesnik",
  "bolesna",
];

// Tier 5 - Violence-related terms (immediate flag)
export const VIOLENCE_TERMS = [
  "ubiću",
  "ubiću te",
  "ubiću ga",
  "ubiću je",
  "zabiću",
  "zaklati",
  "razneti",
  "razneću",
  "prebiti",
  "prebiću",
  "izudarati",
  "istući",
  "lomiti",
  "slomiti",
  "povrediti",
  "povrediću",
  "napasti",
  "napadnu",
  "bomb",
  "bomba",
  "eksploziv",
  "pištolj",
  "oružje",
  "nož",
  "napraviti kolju",
];

// Tier 6 - Sexual/Inappropriate content (COPPA violation)
export const INAPPROPRIATE_CONTENT = [
  "seks",
  "sex",
  "seksual",
  "jebati",
  "jebe",
  "jebo",
  "jebem",
  "kurac",
  "kurač",
  "kurava",
  "pička",
  "pičke",
  "pičkin",
  "sisa",
  "sise",
  "cycki",
  "guzica",
  "guz",
  "čmar",
  "porn",
  "porno",
  "pornografija",
  "drogu",
  "droga",
  "narkotik",
  "marihuan",
  "trava",
  "vutra",
  "alkohol",
  "pivo",
  "rakija",
  "vino",
  "piće",
  "pušiti",
  "cigarete",
  "cigare",
];

// Context-aware filters (words that are OK in certain contexts)
export const CONTEXT_AWARE = {
  ubiti: ["vreme", "dosadu"], // "ubiti vreme" is OK
  glup: ["pitanje"], // "glupo pitanje" is mild
  lud: ["luda", "ludilo", "ludovanje"], // "ludnica", "ludovanje" can be positive
};

/**
 * Check if text contains profanity
 */
export function containsProfanity(text: string): {
  hasProfanity: boolean;
  severity: "none" | "mild" | "moderate" | "severe" | "critical";
  matches: string[];
  patterns: string[];
} {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];
  const patterns: string[] = [];

  let severity: "none" | "mild" | "moderate" | "severe" | "critical" = "none";

  // Check Tier 1 - Insults (mild)
  for (const word of SERBIAN_INSULTS) {
    if (lowerText.includes(word)) {
      matches.push(word);
      severity = severity === "none" ? "mild" : severity;
    }
  }

  // Check Tier 2 - Profanity (moderate)
  for (const word of SERBIAN_PROFANITY) {
    if (lowerText.includes(word)) {
      matches.push(word);
      severity = "moderate";
    }
  }

  // Check Tier 3 - Bullying patterns (severe)
  for (const pattern of BULLYING_PATTERNS) {
    if (pattern.test(text)) {
      patterns.push(pattern.source);
      severity = "severe";
    }
  }

  // Check Tier 4 - Discriminatory (critical)
  for (const word of DISCRIMINATORY_TERMS) {
    if (lowerText.includes(word)) {
      matches.push(word);
      severity = "critical";
    }
  }

  // Check Tier 5 - Violence (critical)
  for (const word of VIOLENCE_TERMS) {
    if (lowerText.includes(word)) {
      matches.push(word);
      severity = "critical";
    }
  }

  // Check Tier 6 - Inappropriate content (critical)
  for (const word of INAPPROPRIATE_CONTENT) {
    if (lowerText.includes(word)) {
      matches.push(word);
      severity = "critical";
    }
  }

  return {
    hasProfanity: matches.length > 0 || patterns.length > 0,
    severity,
    matches,
    patterns,
  };
}

/**
 * Get appropriate action based on severity
 */
export function getActionForSeverity(
  severity: "none" | "mild" | "moderate" | "severe" | "critical",
): {
  action: "allow" | "warn" | "filter" | "block" | "flag";
  notifyParent: boolean;
  notifyAdmin: boolean;
} {
  switch (severity) {
    case "none":
      return { action: "allow", notifyParent: false, notifyAdmin: false };
    case "mild":
      return { action: "warn", notifyParent: false, notifyAdmin: false };
    case "moderate":
      return { action: "filter", notifyParent: true, notifyAdmin: false };
    case "severe":
      return { action: "block", notifyParent: true, notifyAdmin: true };
    case "critical":
      return { action: "flag", notifyParent: true, notifyAdmin: true };
    default:
      return { action: "allow", notifyParent: false, notifyAdmin: false };
  }
}
