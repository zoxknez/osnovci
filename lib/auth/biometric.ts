// Biometric Authentication - Face ID / Touch ID / Fingerprint
"use client";

/**
 * Check if biometric authentication is supported
 */
export function isBiometricSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "credentials" in navigator &&
    typeof (navigator.credentials as any).create === "function"
  );
}

/**
 * Check if device has biometric hardware
 */
export async function hasBiometricHardware(): Promise<boolean> {
  if (!isBiometricSupported()) {
    return false;
  }

  try {
    // Check for WebAuthn/FIDO2 support
    const available = await (
      window as any
    ).PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable();
    return available === true;
  } catch {
    return false;
  }
}

/**
 * Register biometric credentials
 */
export async function registerBiometric(
  userId: string,
  username: string,
): Promise<{ success: boolean; credential?: any; error?: string }> {
  if (!isBiometricSupported()) {
    return {
      success: false,
      error: "Biometric authentication nije podržana na ovom uređaju",
    };
  }

  try {
    // Generate challenge from server
    const challengeResponse = await fetch("/api/auth/biometric/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!challengeResponse.ok) {
      throw new Error("Failed to get challenge");
    }

    const { challenge } = await challengeResponse.json();

    // Create credentials
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: Uint8Array.from(challenge, (c: string) => c.charCodeAt(0)),
        rp: {
          name: "Osnovci",
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from(userId, (c) => c.charCodeAt(0)),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: "none",
      },
    } as any);

    if (!credential) {
      return {
        success: false,
        error: "Kreiranje credentials nije uspelo",
      };
    }

    // Save credential to server
    const saveResponse = await fetch("/api/auth/biometric/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        credential: credentialToJSON(credential),
      }),
    });

    if (!saveResponse.ok) {
      throw new Error("Failed to save credential");
    }

    return { success: true, credential };
  } catch (error: any) {
    console.error("Biometric registration error:", error);
    return {
      success: false,
      error: error.message || "Greška pri registraciji biometrije",
    };
  }
}

/**
 * Authenticate with biometrics
 */
export async function authenticateWithBiometric(
  userId?: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  if (!isBiometricSupported()) {
    return {
      success: false,
      error: "Biometric authentication nije podržana",
    };
  }

  try {
    // Get challenge from server
    const challengeResponse = await fetch("/api/auth/biometric/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!challengeResponse.ok) {
      throw new Error("Failed to get challenge");
    }

    const { challenge } = await challengeResponse.json();

    // Get credentials
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: Uint8Array.from(challenge, (c: string) => c.charCodeAt(0)),
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: 60000,
      },
    } as any);

    if (!credential) {
      return {
        success: false,
        error: "Autentifikacija nije uspela",
      };
    }

    // Verify with server
    const verifyResponse = await fetch("/api/auth/biometric/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: credentialToJSON(credential),
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error("Verification failed");
    }

    const { userId: verifiedUserId } = await verifyResponse.json();

    return { success: true, userId: verifiedUserId };
  } catch (error: any) {
    console.error("Biometric authentication error:", error);
    return {
      success: false,
      error: error.message || "Greška pri autentifikaciji",
    };
  }
}

/**
 * Delete biometric credentials
 */
export async function deleteBiometric(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/auth/biometric/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete biometric");
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Greška pri brisanju biometrije",
    };
  }
}

/**
 * Convert credential to JSON
 */
function credentialToJSON(credential: any): any {
  if (!credential) return null;

  return {
    id: credential.id,
    rawId: arrayBufferToBase64(credential.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
      authenticatorData: credential.response.authenticatorData
        ? arrayBufferToBase64(credential.response.authenticatorData)
        : undefined,
      signature: credential.response.signature
        ? arrayBufferToBase64(credential.response.signature)
        : undefined,
      attestationObject: credential.response.attestationObject
        ? arrayBufferToBase64(credential.response.attestationObject)
        : undefined,
      userHandle: credential.response.userHandle
        ? arrayBufferToBase64(credential.response.userHandle)
        : undefined,
    },
    type: credential.type,
  };
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * User-friendly error messages
 */
export function getBiometricErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    "not supported": "Tvoj uređaj ne podržava biometrijsku autentifikaciju 😕",
    "no hardware": "Tvoj uređaj nema biometrijski senzor 📱",
    cancelled: "Autentifikacija je otkazana ❌",
    timeout: "Vreme je isteklo. Pokušaj ponovo ⏱️",
    invalid: "Nevažeći podaci. Probaj ponovo 🔄",
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key)) {
      return message;
    }
  }

  return "Nešto je pošlo po zlu. Pokušaj ponovo 🤔";
}
