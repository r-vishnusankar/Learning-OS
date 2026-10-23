import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, users } from "@/db/schema";
import type { EmployeeStatus } from "@/db/schema";

/** A missing profile must not block: ensureProfile creates it as active. */
export function accountMaySignIn(status: EmployeeStatus | null | undefined): boolean {
  return status !== "inactive";
}

/** One primary-key lookup per request; falls back to email for a stale JWT user id. */
export const readAccountStatus = cache(
  async (userId: string | null | undefined, email: string | null | undefined) => {
    if (!process.env.DATABASE_URL) return null;
    const db = getDb();

    if (userId) {
      const [byId] = await db
        .select({ status: profiles.status })
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);
      if (byId) return byId.status;
    }

    if (email) {
      const [byEmail] = await db
        .select({ status: profiles.status })
        .from(profiles)
        .innerJoin(users, eq(users.id, profiles.userId))
        .where(eq(users.email, email))
        .limit(1);
      if (byEmail) return byEmail.status;
    }

    return null;
  }
);
