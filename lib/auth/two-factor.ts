// Two-Factor Authentication (2FA/TOTP) Library
// Generates TOTP secrets, QR codes, and verifies tokens

import crypto from "crypto";
import QRCode from "qrcode";
import speakeasy from "speakeasy";

const ENCRYPTION_KEY =
  process.env["ENCRYPTION_KEY"] ||
  "default-encryption-key-change-in-production";
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypt sensitive data (TOTP secret, backup codes)
 */
export function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }

  const [ivHex, encrypted] = parts;
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = Buffer.from(ivHex!, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  const decrypted =
    decipher.update(encrypted!, "hex", "utf8") + decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a new TOTP secret for a user
 * @returns Object with secret (base32 encoded) and otpauth URL
 */
export function generateTOTPSecret(userName: string, appName = "Osnovci") {
  const secret = speakeasy.generateSecret({
    name: `${appName} (${userName})`,
    length: 32, // 256 bits
  });

  return {
    secret: secret.base32, // Store this encrypted in database
    otpauthUrl: secret.otpauth_url!, // Use for QR code generation
  };
}

/**
 * Generate QR code data URL from otpauth URL
 * @param otpauthUrl The otpauth:// URL from generateTOTPSecret
 * @returns Data URL for <img src="..." />
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`);
  }
}

/**
 * Verify a TOTP token against a secret
 * @param token 6-digit code from authenticator app
 * @param secret Base32 encoded secret (decrypted from database)
 * @returns True if token is valid, false otherwise
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  // Remove spaces and validate format
  const cleanToken = token.replace(/\s/g, "");

  if (!/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: cleanToken,
    window: 2, // Allow 2 time steps before/after (±60 seconds tolerance)
  });
}

/**
 * Generate backup codes for 2FA recovery
 * @returns Array of 10 backup codes (each 8 characters)
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Verify a backup code against stored codes
 * @param inputCode Code provided by user
 * @param encryptedCodes Encrypted JSON array of backup codes from database
 * @returns Object with { valid: boolean, remainingCodes: string[] }
 */
export function verifyBackupCode(
  inputCode: string,
  encryptedCodes: string,
): { valid: boolean; remainingCodes: string[] } {
  try {
    const decryptedCodes = decrypt(encryptedCodes);
    const codes: string[] = JSON.parse(decryptedCodes);

    const cleanInput = inputCode.replace(/\s/g, "").toUpperCase();
    const index = codes.indexOf(cleanInput);

    if (index === -1) {
      return { valid: false, remainingCodes: codes };
    }

    // Remove used code
    codes.splice(index, 1);

    return { valid: true, remainingCodes: codes };
  } catch (error) {
    return { valid: false, remainingCodes: [] };
  }
}

/**
 * Format backup codes for display (4-4 pattern)
 * Example: AB12CD34 → AB12-CD34
 */
export function formatBackupCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Complete 2FA setup for a user
 * Generates secret, backup codes, and returns encrypted data
 */
export async function setupTwoFactorAuth(userName: string) {
  // Generate TOTP secret
  const { secret, otpauthUrl } = generateTOTPSecret(userName);

  // Generate QR code
  const qrCodeDataUrl = await generateQRCode(otpauthUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Encrypt sensitive data
  const encryptedSecret = encrypt(secret);
  const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));

  return {
    encryptedSecret, // Store in database
    encryptedBackupCodes, // Store in database
    qrCodeDataUrl, // Show to user once
    backupCodes, // Show to user once (formatted)
    secret, // DO NOT store - only for initial verification
  };
}

/**
 * Verify 2FA during login
 * @param token 6-digit code or 8-character backup code
 * @param encryptedSecret User's encrypted TOTP secret from database
 * @param encryptedBackupCodes User's encrypted backup codes from database
 * @returns Object with { valid: boolean, usedBackupCode: boolean, newEncryptedBackupCodes?: string }
 */
export function verifyTwoFactorAuth(
  token: string,
  encryptedSecret: string,
  encryptedBackupCodes: string | null,
): {
  valid: boolean;
  usedBackupCode: boolean;
  newEncryptedBackupCodes?: string;
} {
  const cleanToken = token.replace(/\s|-/g, "").toUpperCase();

  // Try TOTP token first (6 digits)
  if (/^\d{6}$/.test(cleanToken)) {
    const secret = decrypt(encryptedSecret);
    const isValid = verifyTOTPToken(cleanToken, secret);

    return { valid: isValid, usedBackupCode: false };
  }

  // Try backup code (8 characters)
  if (/^[A-Z0-9]{8}$/.test(cleanToken) && encryptedBackupCodes) {
    const result = verifyBackupCode(cleanToken, encryptedBackupCodes);

    if (result.valid) {
      // Re-encrypt remaining codes
      const newEncryptedCodes = encrypt(JSON.stringify(result.remainingCodes));

      return {
        valid: true,
        usedBackupCode: true,
        newEncryptedBackupCodes: newEncryptedCodes,
      };
    }
  }

  return { valid: false, usedBackupCode: false };
}
