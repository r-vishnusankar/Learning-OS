import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { ensureProfile } from "@/lib/profile";

const DEFAULT_DEV_EMAIL = "demo@nexus.local";
const DEFAULT_DEV_PASSWORD = "nexus123";

export function getDevCredentials() {
  return {
    email: process.env.DEV_LOGIN_EMAIL ?? DEFAULT_DEV_EMAIL,
    password: process.env.DEV_LOGIN_PASSWORD ?? DEFAULT_DEV_PASSWORD,
  };
}

function defaultAvatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

/**
 * Dev auth: shared password for demo admin + any existing *@nexus.local roster user.
 * Production should use Entra SSO only.
 */
export async function authenticateDevUser(email: string, password: string) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const dev = getDevCredentials();
  const normalized = email.trim().toLowerCase();

  if (password !== dev.password) {
    return null;
  }

  const isPrimaryAdmin = normalized === dev.email.toLowerCase();
  const isLocalRoster = normalized.endsWith("@nexus.local");

  if (!isPrimaryAdmin && !isLocalRoster) {
    return null;
  }

  if (!process.env.DATABASE_URL) {
    if (!isPrimaryAdmin) return null;
    return {
      id: "dev-local-user",
      email: dev.email,
      name: "Alex Rivera",
      image: defaultAvatar("Alex Rivera"),
    };
  }

  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);

  if (existing) {
    await ensureProfile(existing.id);
    return {
      id: existing.id,
      email: existing.email ?? normalized,
      name: existing.name ?? normalized,
      image: existing.image ?? defaultAvatar(existing.name ?? normalized),
    };
  }

  // Only auto-create the primary demo admin
  if (!isPrimaryAdmin) {
    return null;
  }

  const name = "Alex Rivera";
  const [created] = await db
    .insert(users)
    .values({
      email: dev.email,
      name,
      image: defaultAvatar(name),
    })
    .returning();

  await ensureProfile(created.id);

  return {
    id: created.id,
    email: created.email ?? dev.email,
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
