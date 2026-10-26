/**
 * Server-side password utilities for the Skillrr credentials system.
 *
 * SECURITY NOTES:
 * - All functions run server-side only. Never import this module in client code.
 * - Plaintext passwords are never stored, logged, returned, or audited.
 * - bcrypt cost factor 12 targets ~300ms on a modern server.
 * - generateTemporaryPassword uses crypto.randomBytes for entropy.
 */

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const COST_FACTOR = 12;

/** Hash a plaintext password with bcrypt. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}

/**
 * Constant-time bcrypt compare.
 * Returns true only when plain matches the stored hash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Server-side policy enforcement.
 * Rules: minimum 8 characters, at least one digit.
 * Call this before hashPassword on any user-supplied password.
 */
export function validatePasswordPolicy(
  password: string
): { ok: true } | { ok: false; message: string } {
  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (!/\d/.test(password)) {
    return { ok: false, message: "Password must contain at least one number." };
  }
  return { ok: true };
}

/**
 * Generate a cryptographically random 12-character temporary password.
 * Composition: 4 uppercase + 4 lowercase + 4 digits, then shuffled.
 * Ambiguous characters (I/l/1/O/0) excluded for legibility.
 * Guaranteed to satisfy the policy (8+ chars, at least one digit).
 */
export function generateTemporaryPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";

  const pick = (charset: string): string =>
    charset[randomBytes(1)[0] % charset.length];

  const parts: string[] = [
    ...Array.from({ length: 4 }, () => pick(upper)),
    ...Array.from({ length: 4 }, () => pick(lower)),
    ...Array.from({ length: 4 }, () => pick(digits)),
  ];

  // Fisher-Yates shuffle using crypto bytes
  const shuffleBytes = randomBytes(parts.length);
  for (let i = parts.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }

  return parts.join("");
}
