"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  assignLevelCoursesForUser,
  computePromotionEligibility,
  listPromotionEligibilities,
  type PromotionEligibility,
} from "@/db/queries/eligibility";
import { notifications, profiles, promotions } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { requireManagerOrAbove, requireRole, requireUserId } from "@/lib/auth-utils";
import { getProfileByUserId } from "@/lib/profile";
import type { DepartmentId, LearningLevel } from "@/types";
import {
  approvePromotionSchema,
  promotionConsoleFilterSchema,
  rejectPromotionSchema,
  remindPromotionSchema,
} from "@/validators/promotions";

function revalidateCareerPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/learning");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/promotions");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/course-assignments");
  revalidatePath("/dashboard/analytics");
}

async function requirePromotionApprover() {
  return requireRole(["admin", "department_head"]);
}

export async function fetchMyEligibilityAction(): Promise<PromotionEligibility | null> {
  const userId = await requireUserId();
  return computePromotionEligibility(userId);
}

export async function fetchPromotionConsoleAction(input?: unknown) {
  const actorId = await requireManagerOrAbove();
  const actor = await getProfileByUserId(actorId);
  const data = promotionConsoleFilterSchema.parse(input ?? {});

  let departmentId = data.departmentId as DepartmentId | undefined;
  if (actor?.role === "department_head" || actor?.role === "manager") {
    departmentId = actor.department;
  }

  let rows = await listPromotionEligibilities({
    departmentId,
    status: data.status,
  });

  if (data.search?.trim()) {
    const q = data.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q)
    );
  }

  const kpis = {
    eligible: rows.filter((r) => r.status === "eligible").length,
    inProgress: rows.filter((r) => r.status === "in_progress").length,
    blocked: rows.filter((r) => r.status === "blocked").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    maxLevel: rows.filter((r) => r.status === "max_level").length,
    total: rows.length,
  };

  return { rows, kpis };
}

export async function approvePromotionAction(input: unknown) {
  const actorId = await requirePromotionApprover();
  const actor = await getProfileByUserId(actorId);
  const data = approvePromotionSchema.parse(input);
  const db = getDb();

  const eligibility = await computePromotionEligibility(data.userId);
  if (!eligibility) throw new Error("User not found");
  if (actor?.role === "department_head" && eligibility.department !== actor.department) {
    throw new Error("Forbidden");
  }
  if (eligibility.status === "rejected") {
    throw new Error("Promotion was rejected — employee must remain at current level until reconsidered");
  }
  if (eligibility.status !== "eligible" || !eligibility.nextLevel) {
    throw new Error("Employee is not eligible for promotion");
  }

  const toLevel = (data.toLevel ?? eligibility.nextLevel) as LearningLevel;
  if (toLevel !== eligibility.nextLevel) {
    throw new Error("Can only promote to the next learning level");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, data.userId))
    .limit(1);
  if (!profile) throw new Error("Profile not found");

  // Supersede open eligible records
  await db
    .update(promotions)
    .set({ status: "superseded", updatedAt: new Date() })
    .where(
      and(
        eq(promotions.userId, data.userId),
        inArray(promotions.status, ["eligible", "pending_approval"])
      )
    );

  await db.insert(promotions).values({
    userId: data.userId,
    fromLevel: eligibility.currentLevel,
    toLevel,
    fromDesignation: eligibility.designation,
    toDesignation: data.toDesignation ?? eligibility.designation,
    status: "approved",
    eligibleAt: new Date(),
    decidedAt: new Date(),
    decidedBy: actorId,
    snapshot: {
      certifiedCount: eligibility.certifiedCount,
      requiredCount: eligibility.requiredCount,
      courses: eligibility.courses,
    },
  });

  await db
    .update(profiles)
    .set({
      level: toLevel,
      designation: data.toDesignation ?? profile.designation,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, data.userId));

  const assignResult = await assignLevelCoursesForUser(data.userId, actorId);

  await db.insert(notifications).values({
    userId: data.userId,
    title: "Promotion approved",
    message: `You advanced from ${eligibility.currentLevel} to ${toLevel}. ${assignResult.inserted} new course(s) were assigned.`,
    type: "achievement",
    href: "/dashboard/learning",
    read: 0,
  });

  await writeAuditLog({
    userId: actorId,
    action: "promotion.approve",
    entityType: "promotion",
    entityId: data.userId,
    metadata: {
      fromLevel: eligibility.currentLevel,
      toLevel,
      assignedCourses: assignResult.inserted,
    },
  });

  revalidateCareerPaths();
  return { ok: true as const, toLevel, assigned: assignResult.inserted };
}

export async function rejectPromotionAction(input: unknown) {
  const actorId = await requirePromotionApprover();
  const actor = await getProfileByUserId(actorId);
  const data = rejectPromotionSchema.parse(input);
  const db = getDb();

  const eligibility = await computePromotionEligibility(data.userId);
  if (!eligibility) throw new Error("User not found");
  if (actor?.role === "department_head" && eligibility.department !== actor.department) {
    throw new Error("Forbidden");
  }

  await db
    .update(promotions)
    .set({ status: "superseded", updatedAt: new Date() })
    .where(
      and(
        eq(promotions.userId, data.userId),
        inArray(promotions.status, ["eligible", "pending_approval"])
      )
    );

  await db.insert(promotions).values({
    userId: data.userId,
    fromLevel: eligibility.currentLevel,
    toLevel: eligibility.nextLevel ?? eligibility.currentLevel,
    fromDesignation: eligibility.designation,
    status: "rejected",
    decidedAt: new Date(),
    decidedBy: actorId,
    reason: data.reason,
    snapshot: { certifiedCount: eligibility.certifiedCount },
  });

  await db.insert(notifications).values({
    userId: data.userId,
    title: "Promotion not approved",
    message: data.reason,
    type: "warning",
    href: "/dashboard/learning",
    read: 0,
  });

  await writeAuditLog({
    userId: actorId,
    action: "promotion.reject",
    entityType: "promotion",
    entityId: data.userId,
    metadata: { reason: data.reason },
  });

  revalidateCareerPaths();
  return { ok: true as const };
}

export async function remindPromotionCandidateAction(input: unknown) {
  const actorId = await requireManagerOrAbove();
  const data = remindPromotionSchema.parse(input);
  const db = getDb();
  const eligibility = await computePromotionEligibility(data.userId);
  if (!eligibility) throw new Error("User not found");

  const pending = eligibility.courses.filter((c) => c.state !== "certified");
  const tip =
    pending[0]?.state === "assessment_pending" && pending[0].assessmentId
      ? `Take the assessment for "${pending[0].courseTitle}".`
      : pending[0]
        ? `Continue "${pending[0].courseTitle}".`
        : "Keep completing your level courses.";

  await db.insert(notifications).values({
    userId: data.userId,
    title: "Learning reminder",
    message: `Complete your ${eligibility.currentLevel} track to become promotion-eligible. ${tip}`,
    type: "reminder",
    href: "/dashboard/learning",
    read: 0,
  });

  await writeAuditLog({
    userId: actorId,
    action: "promotion.remind",
    entityType: "user",
    entityId: data.userId,
  });

  return { ok: true as const };
}

export async function syncEligiblePromotionRecordAction(userId?: string) {
  const id = userId ?? (await requireUserId());
  const eligibility = await computePromotionEligibility(id);
  if (!eligibility || eligibility.status !== "eligible" || !eligibility.nextLevel) {
    return { synced: false as const };
  }

  const db = getDb();
  const [open] = await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.userId, id),
        inArray(promotions.status, ["eligible", "pending_approval"])
      )
    )
    .limit(1);

  if (open) return { synced: true as const, id: open.id };

  const [row] = await db
    .insert(promotions)
    .values({
      userId: id,
      fromLevel: eligibility.currentLevel,
      toLevel: eligibility.nextLevel,
      fromDesignation: eligibility.designation,
      status: "eligible",
      snapshot: {
        certifiedCount: eligibility.certifiedCount,
        requiredCount: eligibility.requiredCount,
      },
    })
    .returning();

  await db.insert(notifications).values({
    userId: id,
    title: "Eligible for promotion",
    message: `You completed your ${eligibility.currentLevel} certifications. Waiting for admin approval to advance to ${eligibility.nextLevel}.`,
    type: "achievement",
    href: "/dashboard",
    read: 0,
  });

  return { synced: true as const, id: row.id };
}
