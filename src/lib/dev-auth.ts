import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, userCredentials, users } from "@/db/schema";
import {
  DEFAULT_DEV_EMAIL,
  DEFAULT_DEV_NAME,
  DEFAULT_DEV_PASSWORD,
  LEGACY_DEV_EMAILS,
  SUPERADMIN_EMAIL,
  SUPERADMIN_NAME,
} from "@/lib/dev-credentials";
import { verifyPassword } from "@/lib/password";
import { ensureProfile } from "@/lib/profile";

export function getDevCredentials() {
  return {
    email: process.env.DEV_LOGIN_EMAIL ?? DEFAULT_DEV_EMAIL,
    password: process.env.DEV_LOGIN_PASSWORD ?? DEFAULT_DEV_PASSWORD,
  };
}

function defaultAvatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

function isCompanyLoginEmail(email: string) {
  return email.endsWith("@valoriz.com") || email.endsWith("@nexus.local");
}

/**
 * Credentials login for the Skillrr admin and Valoriz / Nexus roster users.
 *
 * Priority:
 *   1. If the user has a row in user_credentials (admin-invited), verify with bcrypt.
 *      The shared dev password does NOT apply — it is completely disabled for that user.
 *   2. Otherwise fall back to the shared dev password (existing users / seeded roster).
 *
 * Production should use Entra SSO only, unless ENABLE_DEV_LOGIN=true is set.
 */
export async function authenticateDevUser(email: string, password: string) {
  const devLoginEnabled = process.env.ENABLE_DEV_LOGIN === "true";
  if (process.env.NODE_ENV === "production" && !devLoginEnabled) {
    return null;
  }

  const dev = getDevCredentials();
  const normalized = email.trim().toLowerCase();

  const isPrimaryAdmin = normalized === dev.email.toLowerCase();
  const isSuperAdmin = normalized === SUPERADMIN_EMAIL;

  // Gate: only known categories may use credentials login
  if (!isPrimaryAdmin && !isSuperAdmin && !isCompanyLoginEmail(normalized)) {
    return null;
  }

  if (!process.env.DATABASE_URL) {
    // No DB: admins only, shared password only
    if (!isPrimaryAdmin && !isSuperAdmin) return null;
    if (password !== dev.password) return null;
    const name = isSuperAdmin ? SUPERADMIN_NAME : DEFAULT_DEV_NAME;
    const accountEmail = isSuperAdmin ? SUPERADMIN_EMAIL : dev.email;
    return {
      id: isSuperAdmin ? "dev-superadmin" : "dev-local-user",
      email: accountEmail,
      name,
      image: defaultAvatar(name),
    };
  }

  const db = getDb();
  let [existing] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);

  // Migrate legacy demo admin to the configured primary email on first login
  if (!existing && isPrimaryAdmin && LEGACY_DEV_EMAILS.length > 0) {
    const [legacy] = await db
      .select()
      .from(users)
      .where(inArray(users.email, [...LEGACY_DEV_EMAILS]))
      .limit(1);

    if (legacy) {
      const [updated] = await db
        .update(users)
        .set({
          email: dev.email.toLowerCase(),
          name: DEFAULT_DEV_NAME,
          image: defaultAvatar(DEFAULT_DEV_NAME),
        })
        .where(eq(users.id, legacy.id))
        .returning();
      existing = updated;
    }
  }

  if (existing) {
    // Check for a per-user credential row first
    const [cred] = await db
      .select()
      .from(userCredentials)
      .where(eq(userCredentials.userId, existing.id))
      .limit(1);

    if (cred) {
      // Per-user hash found: bcrypt verify. Shared password is disabled for this user.
      const ok = await verifyPassword(password, cred.passwordHash);
      if (!ok) return null;
      // Admins still get their role/status refreshed on login
      if (isSuperAdmin || isPrimaryAdmin) {
        await db
          .update(profiles)
          .set({
            role: "admin",
            status: "active",
            designation: isSuperAdmin ? "Platform Super Admin" : "Platform Administrator",
          })
          .where(eq(profiles.userId, existing.id));
      }
      return {
        id: existing.id,
        email: existing.email ?? normalized,
        name: existing.name ?? normalized,
        image: existing.image ?? defaultAvatar(existing.name ?? normalized),
      };
    }

    // No per-user credential: fall back to shared dev password
    if (password !== dev.password) return null;
    await ensureProfile(existing.id);
    if (isSuperAdmin || isPrimaryAdmin) {
      await db
        .update(profiles)
        .set({
          role: "admin",
          status: "active",
          designation: isSuperAdmin ? "Platform Super Admin" : "Platform Administrator",
        })
        .where(eq(profiles.userId, existing.id));
    }
    return {
      id: existing.id,
      email: existing.email ?? normalized,
      name: existing.name ?? normalized,
      image: existing.image ?? defaultAvatar(existing.name ?? normalized),
    };
  }

  // No existing user: only admins can be auto-created
  if (!isPrimaryAdmin && !isSuperAdmin) {
    return null;
  }

  // Admins: require shared password to self-provision
  if (password !== dev.password) return null;

  const name = isSuperAdmin ? SUPERADMIN_NAME : DEFAULT_DEV_NAME;
  const accountEmail = isSuperAdmin ? SUPERADMIN_EMAIL : dev.email;
  const [created] = await db
    .insert(users)
    .values({
      email: accountEmail,
      name,
      image: defaultAvatar(name),
    })
    .returning();

  await ensureProfile(created.id);
  await db
    .update(profiles)
    .set({
      role: "admin",
      status: "active",
      designation: isSuperAdmin ? "Platform Super Admin" : "Platform Administrator",
    })
    .where(eq(profiles.userId, created.id));

  return {
    id: created.id,
    email: created.email ?? accountEmail,
    name: created.name ?? name,
    image: created.image ?? defaultAvatar(name),
  };
}

export function isEntraConfigured() {
  const id = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
  const secret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;
  const issuer = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER;

  return (
    !!id &&
    !!secret &&
    !!issuer &&
    id !== "your-application-client-id" &&
    secret !== "your-client-secret" &&
    issuer !== "https://login.microsoftonline.com/<tenant-id>/v2.0"
  );
}
