/**
 * React Hook for Biometric Authentication
 *
 * Provides state management and methods for biometric authentication features:
 * - Register new biometric devices
 * - Authenticate with biometrics
 * - List registered devices
 * - Remove devices
 *
 * Usage:
 * ```tsx
 * const { register, authenticate, devices, isLoading, error } = useBiometricAuth();
 *
 * // Register new device
 * await register();
 *
 * // Authenticate
 * await authenticate();
 *
 * // Remove device
 * await removeDevice(deviceId);
 * ```
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  authenticateWithBiometric,
  hasBiometricDevices,
  isBiometricSupported,
  listBiometricDevices,
  registerBiometric,
  removeBiometricDevice,
} from "@/lib/auth/biometric-client";
import { log } from "@/lib/logger";

interface BiometricDevice {
  id: string;
  deviceName: string;
  createdAt: Date;
}

interface UseBiometricAuthReturn {
  // State
  devices: BiometricDevice[];
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  hasDevices: boolean;

  // Methods
  register: () => Promise<void>;
  authenticate: () => Promise<{ userId: string } | null>;
  removeDevice: (credentialId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
  clearError: () => void;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [hasDevices, setHasDevices] = useState(false);

  // Check browser support on mount
  useEffect(() => {
    setIsSupported(isBiometricSupported());
  }, []);

  /**
   * Load list of registered biometric devices
   */
  const refreshDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const deviceList = await listBiometricDevices();
      setDevices(deviceList);
      setHasDevices(deviceList.length > 0);

      log.info("Biometric devices loaded", { count: deviceList.length });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Greška pri učitavanju uređaja";
      setError(message);
      log.error("Failed to load biometric devices", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register a new biometric credential
   * Prompts user for Face ID/Touch ID/Windows Hello
   */
  const register = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupported) {
        throw new Error(
          "Biometrijska autentifikacija nije podržana u ovom pregledaču",
        );
      }

      await registerBiometric();

      // Refresh device list after successful registration
      await refreshDevices();

      log.info("Biometric registration completed successfully");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Greška pri registraciji biometrije";
      setError(message);
      log.error("Biometric registration failed", err);
      throw err; // Re-throw so caller can handle (e.g., show toast)
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, refreshDevices]);

  /**
   * Authenticate using biometric credential
   * Prompts user for Face ID/Touch ID/Windows Hello
   *
   * @returns userId on success, null on failure
   */
  const authenticate = useCallback(async (): Promise<{
    userId: string;
  } | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupported) {
        throw new Error(
          "Biometrijska autentifikacija nije podržana u ovom pregledaču",
        );
      }

      const result = await authenticateWithBiometric();

      log.info("Biometric authentication completed successfully", {
        userId: result.userId,
      });

      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Greška pri biometrijskoj autentifikaciji";
      setError(message);
      log.error("Biometric authentication failed", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Remove a registered biometric device
   *
   * @param credentialId - ID of the device to remove
   */
  const removeDevice = useCallback(
    async (credentialId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await removeBiometricDevice(credentialId);

        // Refresh device list after removal
        await refreshDevices();

        log.info("Biometric device removed successfully", { credentialId });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Greška pri brisanju uređaja";
        setError(message);
        log.error("Failed to remove biometric device", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshDevices],
  );

  /**
   * Clear current error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load devices on mount
  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Check if user has devices on mount
  useEffect(() => {
    hasBiometricDevices().then(setHasDevices);
  }, []);

  return {
    devices,
    isLoading,
    error,
    isSupported,
    hasDevices,
    register,
    authenticate,
    removeDevice,
    refreshDevices,
    clearError,
  };
}
