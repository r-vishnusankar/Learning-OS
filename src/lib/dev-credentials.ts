/** Shared defaults for credentials login (local + ENABLE_DEV_LOGIN). */
export const DEFAULT_DEV_EMAIL = "vishnu.sankar@valoriz.com";
export const DEFAULT_DEV_PASSWORD = "Skillrr@2026";
export const DEFAULT_DEV_NAME = "Vishnu Sankar";

/** Dedicated platform superadmin — not a personal mailbox. */
export const SUPERADMIN_EMAIL = "superadmin@valoriz.com";
export const SUPERADMIN_NAME = "Skillrr Super Admin";

/** Previous demo admin emails — migrated on first successful login. */
export const LEGACY_DEV_EMAILS = ["demo@nexus.local"] as const;

export function isProtectedAdminEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return (
    normalized === SUPERADMIN_EMAIL ||
    normalized === DEFAULT_DEV_EMAIL ||
    LEGACY_DEV_EMAILS.includes(normalized as (typeof LEGACY_DEV_EMAILS)[number])
  );
}
