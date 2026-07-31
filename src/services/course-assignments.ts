"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { courseAssignments, courses, notifications } from "@/db/schema";
import {
  insertAssignmentsForUsers,
  listAdminCourseAssignments,
  listAdminAssignmentConsole,
  listAssignmentsForUser,
  listActiveUserIds,
  countAssignmentStats,
  assignmentComplianceSnapshot,
  bulkUpdateAssignmentDueDates,
  bulkDeleteAssignments,
} from "@/db/queries/course-assignments";
import { writeAuditLog } from "@/lib/audit";
import { requireCourseAssigner, requireUserId } from "@/lib/auth-utils";
import { getProfileByUserId } from "@/lib/profile";
import type { DepartmentId } from "@/types";
import {
  assignCourseSchema,
  revokeCourseAssignmentSchema,
  bulkAssignmentIdsSchema,
  bulkUpdateDueDateSchema,
} from "@/validators/course-assignments";

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function notifyAssigned(
  userIds: string[],
  courseTitle: string,
  courseSlug: string,
  mandatory: boolean,
  dueDate: Date | null
) {
  if (userIds.length === 0) return;
  const db = getDb();
  const dueLabel = dueDate ? ` Due ${dueDate.toLocaleDateString()}.` : "";
  await db.insert(notifications).values(
    userIds.map((userId) => ({
      userId,
      title: mandatory ? "Mandatory course assigned" : "New course assigned",
      message: `${courseTitle} has been assigned to you.${dueLabel}`,
      type: mandatory ? ("warning" as const) : ("info" as const),
      href: `/dashboard/courses/${courseSlug}`,
      read: 0,
    }))
  );
}

async function assertCanManageAssignments(assignmentIds: string[]) {
  const actorId = await requireCourseAssigner();
  const actor = await getProfileByUserId(actorId);
  const db = getDb();
  const rows = await db
    .select({
      id: courseAssignments.id,
      userId: courseAssignments.userId,
    })
    .from(courseAssignments)
    .where(inArray(courseAssignments.id, assignmentIds));

  if (rows.length !== assignmentIds.length) {
    throw new Error("One or more assignments were not found");
  }

  if (actor?.role === "department_head") {
    for (const row of rows) {
      const profile = await getProfileByUserId(row.userId);
      if (profile?.department !== actor.department) {
        throw new Error("Forbidden");
      }
    }
  }

  return { actorId, rows };
}

export async function assignCourseAction(input: unknown) {
  const actorId = await requireCourseAssigner();
  const actor = await getProfileByUserId(actorId);
  const data = assignCourseSchema.parse(input);
  const db = getDb();

  const courseIds = data.courseIds?.length
    ? data.courseIds
    : data.courseId
      ? [data.courseId]
      : [];

  // Department heads are scoped to their department
  if (actor?.role === "department_head") {
    if (data.scope === "org") {
      throw new Error("Department admins cannot assign organization-wide");
    }
    if (data.scope === "department" && data.departmentId !== actor.department) {
      throw new Error("You can only assign within your department");
    }
    if (data.scope === "user") {
      const allowed = await listActiveUserIds({ departmentId: actor.department });
      const allowedSet = new Set(allowed);
      if ((data.userIds ?? []).some((id) => !allowedSet.has(id))) {
        throw new Error("You can only assign to employees in your department");
      }
    }
  }

  let targetUserIds: string[] = [];
  let departmentId: DepartmentId | null = null;

  if (data.scope === "org") {
    targetUserIds = await listActiveUserIds();
  } else if (data.scope === "department") {
    departmentId = data.departmentId as DepartmentId;
    targetUserIds = await listActiveUserIds({ departmentId });
  } else {
    targetUserIds = data.userIds ?? [];
  }

  if (targetUserIds.length === 0) {
    throw new Error("No matching active employees to assign");
  }

  const startDate = parseDate(data.startDate);
  const dueDate = parseDate(data.dueDate);

  let inserted = 0;
  let skipped = 0;

  for (const courseId of courseIds) {
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) throw new Error(`Course not found: ${courseId}`);
    if (course.publishStatus !== "published") {
      throw new Error(`Only published courses can be assigned: ${course.title}`);
    }

    const result = await insertAssignmentsForUsers({
      courseId,
      userIds: targetUserIds,
      scope: data.scope,
      departmentId,
      mandatory: data.mandatory,
      startDate,
      dueDate,
      source: data.source ?? "manual",
      planId: data.planId,
      cycleId: data.cycleId,
      assignedBy: actorId,
    });

    inserted += result.inserted;
    skipped += result.skipped;

    if (result.insertedUserIds.length > 0) {
      await notifyAssigned(
        result.insertedUserIds,
        course.title,
        course.slug,
        data.mandatory,
        dueDate
      );
    }
  }

  await writeAuditLog({
    userId: actorId,
    action: "course.assign",
    entityType: "course_assignment",
    entityId: courseIds[0],
    metadata: {
      scope: data.scope,
      courseIds,
      inserted,
      skipped,
      mandatory: data.mandatory,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/learning");
  revalidatePath("/dashboard/admin/course-assignments");

  return {
    inserted,
    skipped,
    totalTargets: targetUserIds.length,
    courseCount: courseIds.length,
  };
}

export async function revokeCourseAssignmentAction(input: unknown) {
  const actorId = await requireCourseAssigner();
  const actor = await getProfileByUserId(actorId);
  const data = revokeCourseAssignmentSchema.parse(input);
  const db = getDb();

  const [row] = await db
    .select()
    .from(courseAssignments)
    .where(eq(courseAssignments.id, data.assignmentId))
    .limit(1);
  if (!row) throw new Error("Assignment not found");

  if (actor?.role === "department_head") {
    const profile = await getProfileByUserId(row.userId);
    if (profile?.department !== actor.department) {
      throw new Error("Forbidden");
    }
  }

  await db.delete(courseAssignments).where(eq(courseAssignments.id, data.assignmentId));

  await writeAuditLog({
    userId: actorId,
    action: "course.assign.revoke",
    entityType: "course_assignment",
    entityId: data.assignmentId,
  });

  revalidatePath("/dashboard/learning");
  revalidatePath("/dashboard/admin/course-assignments");
  return { ok: true };
}

export async function bulkRevokeCourseAssignmentsAction(input: unknown) {
  const data = bulkAssignmentIdsSchema.parse(input);
  const { actorId } = await assertCanManageAssignments(data.assignmentIds);
  const result = await bulkDeleteAssignments(data.assignmentIds);

  await writeAuditLog({
    userId: actorId,
    action: "course.assign.bulk_revoke",
    entityType: "course_assignment",
    entityId: data.assignmentIds[0],
    metadata: { count: result.deleted, assignmentIds: data.assignmentIds },
  });

  revalidatePath("/dashboard/learning");
  revalidatePath("/dashboard/admin/course-assignments");
  return result;
}

export async function bulkUpdateAssignmentDueDatesAction(input: unknown) {
  const data = bulkUpdateDueDateSchema.parse(input);
  const { actorId } = await assertCanManageAssignments(data.assignmentIds);
  const dueDate = parseDate(data.dueDate);
  const result = await bulkUpdateAssignmentDueDates(data.assignmentIds, dueDate);

  await writeAuditLog({
    userId: actorId,
    action: "course.assign.bulk_due",
    entityType: "course_assignment",
    entityId: data.assignmentIds[0],
    metadata: { count: result.updated, dueDate: data.dueDate },
  });

  revalidatePath("/dashboard/learning");
  revalidatePath("/dashboard/admin/course-assignments");
  return result;
}

export async function remindCourseAssignmentsAction(input: unknown) {
  const data = bulkAssignmentIdsSchema.parse(input);
  const { actorId } = await assertCanManageAssignments(data.assignmentIds);
  const db = getDb();

  const rows = await db
    .select({
      id: courseAssignments.id,
      userId: courseAssignments.userId,
      dueDate: courseAssignments.dueDate,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(courseAssignments)
    .innerJoin(courses, eq(courses.id, courseAssignments.courseId))
    .where(inArray(courseAssignments.id, data.assignmentIds));

  if (rows.length > 0) {
    await db.insert(notifications).values(
      rows.map((row) => {
        const dueLabel = row.dueDate ? ` Due ${row.dueDate.toLocaleDateString()}.` : "";
        return {
          userId: row.userId,
          title: "Course reminder",
          message: `Reminder: complete “${row.courseTitle}”.${dueLabel}`,
          type: "warning" as const,
          href: `/dashboard/courses/${row.courseSlug}`,
          read: 0,
        };
      })
    );
  }

  await writeAuditLog({
    userId: actorId,
    action: "course.assign.remind",
    entityType: "course_assignment",
    entityId: data.assignmentIds[0],
    metadata: { count: rows.length },
  });

  return { reminded: rows.length };
}

export async function fetchMyCourseAssignmentsAction() {
  const userId = await requireUserId();
  return listAssignmentsForUser(userId);
}

export async function fetchMyAssignmentStatsAction() {
  const userId = await requireUserId();
  return countAssignmentStats(userId);
}

export async function fetchAdminCourseAssignmentsAction(filters?: {
  departmentId?: DepartmentId;
  courseId?: string;
}) {
  const actorId = await requireCourseAssigner();
  const actor = await getProfileByUserId(actorId);
  const departmentId =
    actor?.role === "department_head" ? actor.department : filters?.departmentId;
  return listAdminCourseAssignments({
    departmentId,
    courseId: filters?.courseId,
  });
}

export async function fetchAdminAssignmentConsoleAction(filters?: {
  departmentId?: DepartmentId;
  courseId?: string;
}) {
  const actorId = await requireCourseAssigner();
  const actor = await getProfileByUserId(actorId);
  const departmentId =
    actor?.role === "department_head" ? actor.department : filters?.departmentId;
  return listAdminAssignmentConsole({
    departmentId,
    courseId: filters?.courseId,
  });
}

export async function fetchAssignmentComplianceAction() {
  const actorId = await requireCourseAssigner();
  const actor = await getProfileByUserId(actorId);
  const departmentId = actor?.role === "department_head" ? actor.department : undefined;
  return assignmentComplianceSnapshot(departmentId);
}
