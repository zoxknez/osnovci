/**
 * Biometric Authentication - Client-side WebAuthn Integration
 *
 * Provides browser-side functions for biometric authentication using WebAuthn API.
 * Supports Face ID, Touch ID, Windows Hello, fingerprint sensors, etc.
 *
 * @see https://webauthn.guide
 * @see https://simplewebauthn.dev
 */

"use client";

import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";
import { log } from "@/lib/logger";

/**
 * Check if biometric authentication is supported in current browser
 */
export function isBiometricSupported(): boolean {
  return browserSupportsWebAuthn();
}

/**
 * Register a new biometric credential (Face ID, Touch ID, etc.)
 *
 * Flow:
 * 1. Request challenge from server
 * 2. Prompt user for biometric (browser handles this)
 * 3. Send credential to server for storage
 *
 * @returns Promise<{ success: true }> on successful registration
 * @throws Error with user-friendly message on failure
 */
export async function registerBiometric(): Promise<{ success: true }> {
  try {
    // Step 1: Check browser support
    if (!isBiometricSupported()) {
      throw new Error(
        "Ovaj pregledač ne podržava biometrijsku autentifikaciju",
      );
    }

    // Step 2: Request registration challenge from server
    log.info("Requesting biometric registration challenge");
    const challengeResponse = await fetch("/api/auth/biometric/challenge", {
      method: "POST",
      credentials: "include", // Include session cookie
    });

    if (!challengeResponse.ok) {
      const error = await challengeResponse.json();
      throw new Error(error.message || "Greška pri kreiranju izazova");
    }

    const options: PublicKeyCredentialCreationOptionsJSON =
      await challengeResponse.json();

    // Step 3: Prompt user for biometric authentication
    // Browser will show native Face ID/Touch ID/Windows Hello prompt
    log.info("Prompting user for biometric registration");
    const credential = await startRegistration(options);

    // Step 4: Send credential to server for storage
    log.info("Sending credential to server");
    const verifyResponse = await fetch("/api/auth/biometric/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(credential),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.message || "Greška pri verifikaciji kredencijala");
    }

    const result = await verifyResponse.json();
    log.info("Biometric registration successful", {
      deviceName: result.deviceName,
    });

    return { success: true };
  } catch (error) {
    log.error("Biometric registration failed", error);

    // Handle common WebAuthn errors with user-friendly messages
    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        throw new Error("Biometrijska autentifikacija je otkazana");
      }
      if (error.name === "InvalidStateError") {
        throw new Error("Ovaj uređaj je već registrovan");
      }
      if (error.name === "NotSupportedError") {
        throw new Error(
          "Biometrijska autentifikacija nije podržana na ovom uređaju",
        );
      }
      throw error;
    }

    throw new Error("Nepoznata greška pri registraciji biometrije");
  }
}

/**
 * Authenticate using a registered biometric credential
 *
 * Flow:
 * 1. Request authentication challenge from server
 * 2. Prompt user for biometric (browser handles this)
 * 3. Send authentication response to server for verification
 * 4. Server returns userId on success
 *
 * @returns Promise<{ userId: string }> on successful authentication
 * @throws Error with user-friendly message on failure
 */
export async function authenticateWithBiometric(): Promise<{ userId: string }> {
  try {
    // Step 1: Check browser support
    if (!isBiometricSupported()) {
      throw new Error(
        "Ovaj pregledač ne podržava biometrijsku autentifikaciju",
      );
    }

    // Step 2: Request authentication challenge from server
    log.info("Requesting biometric authentication challenge");
    const challengeResponse = await fetch("/api/auth/biometric/verify", {
      method: "GET",
      credentials: "include",
    });

    if (!challengeResponse.ok) {
      const error = await challengeResponse.json();
      throw new Error(error.message || "Greška pri kreiranju izazova");
    }

    const options: PublicKeyCredentialRequestOptionsJSON =
      await challengeResponse.json();

    // Step 3: Prompt user for biometric authentication
    // Browser will show native Face ID/Touch ID/Windows Hello prompt
    log.info("Prompting user for biometric authentication");
    const credential = await startAuthentication(options);

    // Step 4: Send authentication response to server for verification
    log.info("Sending authentication response to server");
    const verifyResponse = await fetch("/api/auth/biometric/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(credential),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(
        error.message || "Greška pri verifikaciji autentifikacije",
      );
    }

    const result = await verifyResponse.json();
    log.info("Biometric authentication successful", {
      userId: result.userId,
    });

    return { userId: result.userId };
  } catch (error) {
    log.error("Biometric authentication failed", error);

    // Handle common WebAuthn errors with user-friendly messages
    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        throw new Error("Biometrijska autentifikacija je otkazana");
      }
      if (error.name === "InvalidStateError") {
        throw new Error(
          "Nema registrovanih uređaja za biometrijsku autentifikaciju",
        );
      }
      if (error.name === "NotSupportedError") {
        throw new Error(
          "Biometrijska autentifikacija nije podržana na ovom uređaju",
        );
      }
      throw error;
    }

    throw new Error("Nepoznata greška pri biometrijskoj autentifikaciji");
  }
}

/**
 * Get list of registered biometric devices for current user
 *
 * @returns Promise<Array<{ id: string, deviceName: string, createdAt: Date }>>
 */
export async function listBiometricDevices(): Promise<
  Array<{
    id: string;
    deviceName: string;
    createdAt: Date;
  }>
> {
  try {
    const response = await fetch("/api/auth/biometric/devices", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Greška pri učitavanju uređaja");
    }

    const devices = await response.json();
    return devices;
  } catch (error) {
    log.error("Failed to list biometric devices", error);
    throw error;
  }
}

/**
 * Remove a registered biometric device
 *
 * @param credentialId - ID of the credential to remove
 * @returns Promise<{ success: true }>
 */
export async function removeBiometricDevice(
  credentialId: string,
): Promise<{ success: true }> {
  try {
    const response = await fetch(
      `/api/auth/biometric/devices/${credentialId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Greška pri brisanju uređaja");
    }

    log.info("Biometric device removed", { credentialId });
    return { success: true };
  } catch (error) {
    log.error("Failed to remove biometric device", error);
    throw error;
  }
}

/**
 * Check if current user has any registered biometric devices
 *
 * @returns Promise<boolean>
 */
export async function hasBiometricDevices(): Promise<boolean> {
  try {
    const devices = await listBiometricDevices();
    return devices.length > 0;
  } catch {
    return false;
  }
}
