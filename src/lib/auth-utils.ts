import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { accountMaySignIn } from "@/lib/account-status";
import { ensureProfile, getProfileByUserId } from "@/lib/profile";
import type { UserRole } from "@/types";

/**
 * Resolve the authenticated user id against the current database.
 * After a Neon region/project switch, JWT may still hold an old user id —
 * fall back to email so the session keeps working.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const sessionId = session.user.id;
  let userId: string | undefined;

  const [byId] = await db.select({ id: users.id }).from(users).where(eq(users.id, sessionId)).limit(1);
  if (byId) {
    userId = byId.id;
  } else if (session.user.email) {
    const [byEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    userId = byEmail?.id;
  }

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const profile = await ensureProfile(userId);
  if (!accountMaySignIn(profile.status)) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function requireRole(allowed: UserRole[]): Promise<string> {
  const userId = await requireUserId();
  const profile = await getProfileByUserId(userId);
  const role = profile?.role ?? "employee";

  if (!allowed.includes(role)) {
    throw new Error("Forbidden");
  }

  return userId;
}

/** Super Admin + Instructor — course/content builders */
export async function requireAdminOrInstructor(): Promise<string> {
  return requireRole(["admin", "instructor"]);
}

/** Assign courses + ops: Super Admin, Instructor, Department Admin */
export async function requireCourseAssigner(): Promise<string> {
  return requireRole(["admin", "instructor", "department_head"]);
}

/** Super Admin only */
export async function requireAdmin(): Promise<string> {
  return requireRole(["admin"]);
}

/** Org operators: admin, department_head, manager, instructor */
export async function requireManagerOrAbove(): Promise<string> {
  return requireRole(["admin", "department_head", "manager", "instructor"]);
}

export { ROLE_LABELS, canAccessAdmin, canManageUsers } from "@/lib/roles";
