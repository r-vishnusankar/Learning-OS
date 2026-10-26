"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userCredentials } from "@/db/schema";
import { requireUserId } from "@/lib/auth-utils";
import { hashPassword, validatePasswordPolicy, verifyPassword } from "@/lib/password";

type ChangePasswordResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

/**
 * Allows a logged-in user to change their own password.
 * Enforces the current password, policy on the new password, and updates
 * must_change_password = false on success.
 *
 * SECURITY: plaintext passwords are never stored, logged, or audited.
 */
export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ChangePasswordResult> {
  const userId = await requireUserId();

  // Basic shape validation (client also validates, but server is authoritative)
  if (
    typeof input.currentPassword !== "string" ||
    typeof input.newPassword !== "string" ||
    typeof input.confirmPassword !== "string"
  ) {
    return { ok: false, code: "invalid_input", message: "Invalid input." };
  }

  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, code: "mismatch", message: "Passwords do not match." };
  }

  const policyResult = validatePasswordPolicy(input.newPassword);
  if (!policyResult.ok) {
    return { ok: false, code: "policy", message: policyResult.message };
  }

  const db = getDb();
  const [cred] = await db
    .select()
    .from(userCredentials)
    .where(eq(userCredentials.userId, userId))
    .limit(1);

  if (!cred) {
    // User signed in via Entra or shared password — no per-user credential to change
    return {
      ok: false,
      code: "no_credentials",
      message: "Password management is not available for your account. Contact your administrator.",
    };
  }

  const currentOk = await verifyPassword(input.currentPassword, cred.passwordHash);
  if (!currentOk) {
    return { ok: false, code: "wrong_password", message: "Current password is incorrect." };
  }

  const newHash = await hashPassword(input.newPassword);

  await db
    .update(userCredentials)
    .set({
      passwordHash: newHash,
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(userCredentials.userId, userId));

  return { ok: true };
}
