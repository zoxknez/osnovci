// Child-Friendly Error Messages - Za decu 7-15 godina
// Mobile-optimized: Large text, emoji, simple language

export interface ChildFriendlyError {
  emoji: string;
  title: string;
  message: string;
  action: string;
  color: string; // Tailwind color class
}

/**
 * Convert technical errors to child-friendly messages
 */
export const CHILD_FRIENDLY_ERRORS: Record<
  string | number,
  ChildFriendlyError
> = {
  // Auth errors
  401: {
    emoji: "🔐",
    title: "Ups! Nisi prijavljen",
    message:
      "Moraš prvo da se prijaviš da bi mogao ovo da radiš. Klikni dugme ispod!",
    action: "Prijavi se",
    color: "blue",
  },

  403: {
    emoji: "🙅‍♂️",
    title: "Opa! Ne smeš ovde",
    message:
      "Ovo mogu samo roditelji ili nastavnici. Pitaj ih za pomoć ako ti treba!",
    action: "Nazad",
    color: "red",
  },

  404: {
    emoji: "🔍",
    title: "Hmm... Nisam našao to",
    message: "Ne mogu da pronađem to što tražiš. Možda je već obrisano?",
    action: "Idi nazad",
    color: "gray",
  },

  500: {
    emoji: "🛠️",
    title: "Ajoj! Nešto se pokvarilo",
    message:
      "Ne brini, to nije tvoja greška! Pokušaj ponovo za malo. Ako ne radi, reci roditelju.",
    action: "Pokušaj ponovo",
    color: "orange",
  },

  // Validation errors
  file_too_large: {
    emoji: "📏",
    title: "Slika je prevelika!",
    message:
      "Tvoja slika je malo prevelika za upload. Probaj da je smanjiš ili izaberi drugu sliku.",
    action: "Izaberi drugu",
    color: "yellow",
  },

  invalid_file_type: {
    emoji: "📸",
    title: "Pogrešan tip fajla",
    message:
      "Mogu samo slike (.jpg, .png) ili PDF fajlove. Probaj sa drugom slikom!",
    action: "Izaberi novu sliku",
    color: "yellow",
  },

  missing_required: {
    emoji: "✏️",
    title: "Zaboravio si nešto!",
    message:
      "Neka polja su obavezna (označena sa *). Proveri da li si sve popunio!",
    action: "Proveri ponovo",
    color: "blue",
  },

  password_mismatch: {
    emoji: "🔑",
    title: "Lozinke se ne poklapaju",
    message:
      "Upisao si dve različite lozinke. Proveri i unesi istu lozinku oba puta!",
    action: "Pokušaj ponovo",
    color: "yellow",
  },

  account_locked: {
    emoji: "🔒",
    title: "Nalog je zaključan",
    message:
      "Previše puta si uneo pogrešnu lozinku. Pitaj roditelja da ti pomogne!",
    action: "Pitaj roditelja",
    color: "red",
  },

  network_error: {
    emoji: "📡",
    title: "Nema interneta",
    message:
      "Ups! Izgubio si internet vezu. Proveri WiFi ili mobilne podatke, pa pokušaj ponovo!",
    action: "Pokušaj ponovo",
    color: "orange",
  },

  timeout: {
    emoji: "⏱️",
    title: "Traje predugo...",
    message:
      "Internet je spor ili server ne odgovara. Sačekaj malo pa pokušaj ponovo!",
    action: "Pokušaj ponovo",
    color: "yellow",
  },

  // Homework specific
  homework_not_found: {
    emoji: "🤷‍♂️",
    title: "Gde je taj zadatak?",
    message: "Ne mogu da nađem taj domaći zadatak. Možda si ga već obrisao?",
    action: "Nazad na listu",
    color: "gray",
  },

  // Upload specific
  upload_failed: {
    emoji: "😵",
    title: "Upload nije uspeo",
    message:
      "Slika se nije uspešno upload-ovala. Internet je možda spor. Probaj ponovo!",
    action: "Pokušaj ponovo",
    color: "red",
  },

  // Permission
  parental_approval_needed: {
    emoji: "👨‍👩‍👧",
    title: "Treba ti dozvola roditelja",
    message:
      "Za ovu akciju moraš pitati roditelja da unese PIN kod. Pozovi ih!",
    action: "Pozovi roditelja",
    color: "purple",
  },

  // Age restriction
  too_young: {
    emoji: "👶",
    title: "Malo si mlad za ovo",
    message:
      "Moraš imati najmanje 7 godina da koristiš aplikaciju. Pitaj roditelja za pomoć!",
    action: "OK",
    color: "blue",
  },

  consent_required: {
    emoji: "✉️",
    title: "Čekamo roditelja",
    message:
      "Poslali smo email tvom roditelju. Kada on potvrdi, moći ćeš da koristiš aplikaciju!",
    action: "Razumem",
    color: "green",
  },
};

/**
 * Get child-friendly error message
 */
export function getChildFriendlyError(
  errorCode: string | number,
  customMessage?: string,
): ChildFriendlyError {
  const error = CHILD_FRIENDLY_ERRORS[errorCode] || CHILD_FRIENDLY_ERRORS[500];

  if (customMessage) {
    return {
      ...error,
      message: customMessage,
    };
  }

  return error;
}

/**
 * Convert API error to child-friendly format
 */
export function formatAPIError(error: any): ChildFriendlyError {
  // Network errors
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return CHILD_FRIENDLY_ERRORS.network_error;
  }

  // Timeout
  if (error.name === "AbortError" || error.code === "ETIMEDOUT") {
    return CHILD_FRIENDLY_ERRORS.timeout;
  }

  // HTTP status codes
  if (error.status) {
    return getChildFriendlyError(error.status);
  }

  // Default
  return CHILD_FRIENDLY_ERRORS[500];
}

/**
 * Success messages for kids (positive reinforcement!)
 */
export const SUCCESS_MESSAGES = {
  homework_created: {
    emoji: "✨",
    title: "Super! Zadatak dodat!",
    message: "Odlično! Dodao si novi zadatak. Sad ga uradi i osvoji XP!",
  },
  homework_completed: {
    emoji: "🎉",
    title: "BRAVO! Završio si!",
    message: "Odličan si! Dobio si +10 XP! Nastavi tako!",
  },
  photo_uploaded: {
    emoji: "📸",
    title: "Slika sačuvana!",
    message: "Savršeno! Tvoj dokaz je sačuvan. Roditelji će biti ponosni!",
  },
  login_success: {
    emoji: "👋",
    title: "Dobrodošao nazad!",
    message: "Lepo je videti te opet! Hajde da naučimo nešto novo danas!",
  },
  level_up: {
    emoji: "🚀",
    title: "LEVEL UP!",
    message: "WOW! Dostigao si novi level! Ti si šampion!",
  },
};
