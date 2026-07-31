import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  courseAssignments,
  courses,
  lessonProgress,
  lessons,
  modules,
  profiles,
  users,
} from "@/db/schema";
import type { CourseAssignmentScope } from "@/db/schema/operations";
import type { DepartmentId, LearningLevel } from "@/types";

export type LearnerAssignmentStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "overdue"
  | "upcoming";

export type AdminEnrollmentRow = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseLevel: LearningLevel;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment: DepartmentId;
  userLevel: LearningLevel;
  scope: CourseAssignmentScope;
  mandatory: boolean;
  startDate: string | null;
  dueDate: string | null;
  daysRemaining: number | null;
  progress: number;
  status: LearnerAssignmentStatus;
  source: string;
  assignedAt: string;
};

export type LearnerAggregate = {
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment: DepartmentId;
  userLevel: LearningLevel;
  total: number;
  completed: number;
  overdue: number;
  mandatoryOpen: number;
  dueSoon: number;
  avgProgress: number;
  enrollments: AdminEnrollmentRow[];
};

export type CourseAggregate = {
  courseId: string;
  courseTitle: string;
  courseLevel: LearningLevel;
  total: number;
  completed: number;
  overdue: number;
  mandatory: number;
  avgProgress: number;
  completionRate: number;
  enrollments: AdminEnrollmentRow[];
};

export type AssignmentConsoleKpis = {
  enrollments: number;
  uniqueLearners: number;
  mandatoryOpen: number;
  overdue: number;
  dueIn7d: number;
  completionPct: number;
};

export type AssignmentConsolePayload = {
  enrollments: AdminEnrollmentRow[];
  byLearner: LearnerAggregate[];
  byCourse: CourseAggregate[];
  kpis: AssignmentConsoleKpis;
};

export async function listActiveUserIds(filters?: {
  departmentId?: DepartmentId;
  level?: LearningLevel;
  userIds?: string[];
}) {
  const db = getDb();
  const rows = await db
    .select({
      userId: profiles.userId,
      department: profiles.department,
      level: profiles.level,
      status: profiles.status,
    })
    .from(profiles);

  return rows
    .filter((r) => (r.status ?? "active") === "active")
    .filter((r) => (filters?.departmentId ? r.department === filters.departmentId : true))
    .filter((r) => (filters?.level ? r.level === filters.level : true))
    .filter((r) => (filters?.userIds?.length ? filters.userIds.includes(r.userId) : true))
    .map((r) => r.userId);
}

export async function getCourseProgressMap(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return new Map<string, number>();
  const db = getDb();

  const moduleRows = await db
    .select({ id: modules.id, courseId: modules.courseId })
    .from(modules)
    .where(inArray(modules.courseId, courseIds));

  const moduleIds = moduleRows.map((m) => m.id);
  if (moduleIds.length === 0) {
    return new Map(courseIds.map((id) => [id, 0]));
  }

  const lessonRows = await db
    .select({ id: lessons.id, moduleId: lessons.moduleId })
    .from(lessons)
    .where(inArray(lessons.moduleId, moduleIds));

  const progressRows = await db
    .select({ lessonId: lessonProgress.lessonId, completed: lessonProgress.completed })
    .from(lessonProgress)
    .where(
      and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, lessonRows.map((l) => l.id)))
    );

  const completedSet = new Set(
    progressRows.filter((p) => p.completed).map((p) => p.lessonId)
  );

  const lessonsByCourse = new Map<string, string[]>();
  for (const mod of moduleRows) {
    const list = lessonsByCourse.get(mod.courseId) ?? [];
    for (const lesson of lessonRows) {
      if (lesson.moduleId === mod.id) list.push(lesson.id);
    }
    lessonsByCourse.set(mod.courseId, list);
  }

  const result = new Map<string, number>();
  for (const courseId of courseIds) {
    const ids = lessonsByCourse.get(courseId) ?? [];
    if (ids.length === 0) {
      result.set(courseId, 0);
      continue;
    }
    const done = ids.filter((id) => completedSet.has(id)).length;
    result.set(courseId, Math.round((done / ids.length) * 100));
  }
  return result;
}

/** Batch progress for many (user, course) pairs — used by admin console. */
export async function getProgressMatrix(userIds: string[], courseIds: string[]) {
  const result = new Map<string, number>();
  if (userIds.length === 0 || courseIds.length === 0) return result;

  const db = getDb();
  const moduleRows = await db
    .select({ id: modules.id, courseId: modules.courseId })
    .from(modules)
    .where(inArray(modules.courseId, courseIds));

  const moduleIds = moduleRows.map((m) => m.id);
  if (moduleIds.length === 0) {
    for (const userId of userIds) {
      for (const courseId of courseIds) result.set(`${userId}:${courseId}`, 0);
    }
    return result;
  }

  const lessonRows = await db
    .select({ id: lessons.id, moduleId: lessons.moduleId })
    .from(lessons)
    .where(inArray(lessons.moduleId, moduleIds));

  const lessonIds = lessonRows.map((l) => l.id);
  const lessonsByCourse = new Map<string, string[]>();
  for (const mod of moduleRows) {
    const list = lessonsByCourse.get(mod.courseId) ?? [];
    for (const lesson of lessonRows) {
      if (lesson.moduleId === mod.id) list.push(lesson.id);
    }
    lessonsByCourse.set(mod.courseId, list);
  }

  if (lessonIds.length === 0) {
    for (const userId of userIds) {
      for (const courseId of courseIds) result.set(`${userId}:${courseId}`, 0);
    }
    return result;
  }

  const progressRows = await db
    .select({
      userId: lessonProgress.userId,
      lessonId: lessonProgress.lessonId,
      completed: lessonProgress.completed,
    })
    .from(lessonProgress)
    .where(
      and(inArray(lessonProgress.userId, userIds), inArray(lessonProgress.lessonId, lessonIds))
    );

  const completedByUser = new Map<string, Set<string>>();
  for (const row of progressRows) {
    if (!row.completed) continue;
    const set = completedByUser.get(row.userId) ?? new Set<string>();
    set.add(row.lessonId);
    completedByUser.set(row.userId, set);
  }

  for (const userId of userIds) {
    const completed = completedByUser.get(userId) ?? new Set<string>();
    for (const courseId of courseIds) {
      const ids = lessonsByCourse.get(courseId) ?? [];
      if (ids.length === 0) {
        result.set(`${userId}:${courseId}`, 0);
        continue;
      }
      const done = ids.filter((id) => completed.has(id)).length;
      result.set(`${userId}:${courseId}`, Math.round((done / ids.length) * 100));
    }
  }

  return result;
}

function deriveStatus(
  progress: number,
  startDate: Date | null,
  dueDate: Date | null
): LearnerAssignmentStatus {
  if (progress >= 100) return "completed";
  const now = new Date();
  if (dueDate && dueDate < now && progress < 100) return "overdue";
  if (startDate && startDate > now) return "upcoming";
  if (progress > 0) return "in_progress";
  return "not_started";
}

function daysRemaining(dueDate: Date | null): number | null {
  if (!dueDate) return null;
  const ms = dueDate.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export async function listAssignmentsForUser(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: courseAssignments.id,
      courseId: courseAssignments.courseId,
      scope: courseAssignments.scope,
      mandatory: courseAssignments.mandatory,
      startDate: courseAssignments.startDate,
      dueDate: courseAssignments.dueDate,
      source: courseAssignments.source,
      createdAt: courseAssignments.createdAt,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      thumbnailUrl: courses.thumbnailUrl,
      durationMinutes: courses.durationMinutes,
      departmentId: courses.departmentId,
      learningCategory: courses.learningCategory,
      courseLevel: courses.level,
    })
    .from(courseAssignments)
    .innerJoin(courses, eq(courses.id, courseAssignments.courseId))
    .where(eq(courseAssignments.userId, userId))
    .orderBy(desc(courseAssignments.createdAt));

  const progressMap = await getCourseProgressMap(
    userId,
    rows.map((r) => r.courseId)
  );

  return rows.map((row) => {
    const progress = progressMap.get(row.courseId) ?? 0;
    const status = deriveStatus(progress, row.startDate, row.dueDate);
    return {
      id: row.id,
      courseId: row.courseId,
      courseSlug: row.slug,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnailUrl ?? "",
      departmentId: row.departmentId,
      learningCategory: (row.learningCategory ?? "role") as "role" | "goal",
      courseLevel: row.courseLevel,
      durationHours: Math.round((row.durationMinutes ?? 0) / 60),
      scope: row.scope as CourseAssignmentScope,
      mandatory: row.mandatory,
      startDate: row.startDate?.toISOString() ?? null,
      dueDate: row.dueDate?.toISOString() ?? null,
      daysRemaining: daysRemaining(row.dueDate),
      progress,
      status,
      source: row.source,
      assignedAt: row.createdAt.toISOString(),
    };
  });
}

export async function listAdminCourseAssignments(filters?: {
  departmentId?: DepartmentId;
  courseId?: string;
}): Promise<AdminEnrollmentRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: courseAssignments.id,
      courseId: courseAssignments.courseId,
      userId: courseAssignments.userId,
      scope: courseAssignments.scope,
      mandatory: courseAssignments.mandatory,
      startDate: courseAssignments.startDate,
      dueDate: courseAssignments.dueDate,
      source: courseAssignments.source,
      departmentId: courseAssignments.departmentId,
      createdAt: courseAssignments.createdAt,
      courseTitle: courses.title,
      courseLevel: courses.level,
      userName: users.name,
      userEmail: users.email,
      userDepartment: profiles.department,
      userLevel: profiles.level,
    })
    .from(courseAssignments)
    .innerJoin(courses, eq(courses.id, courseAssignments.courseId))
    .innerJoin(users, eq(users.id, courseAssignments.userId))
    .innerJoin(profiles, eq(profiles.userId, courseAssignments.userId))
    .orderBy(desc(courseAssignments.createdAt))
    .limit(2000);

  const scoped = rows
    .filter((r) => (filters?.departmentId ? r.userDepartment === filters.departmentId : true))
    .filter((r) => (filters?.courseId ? r.courseId === filters.courseId : true));

  const userIds = [...new Set(scoped.map((r) => r.userId))];
  const courseIds = [...new Set(scoped.map((r) => r.courseId))];
  const progressMatrix = await getProgressMatrix(userIds, courseIds);

  const enrollments: AdminEnrollmentRow[] = scoped.map((r) => {
    const progress = progressMatrix.get(`${r.userId}:${r.courseId}`) ?? 0;
    return {
      id: r.id,
      courseId: r.courseId,
      courseTitle: r.courseTitle,
      courseLevel: r.courseLevel,
      userId: r.userId,
      userName: r.userName ?? "Learner",
      userEmail: r.userEmail ?? "",
      userDepartment: r.userDepartment,
      userLevel: r.userLevel,
      scope: r.scope as CourseAssignmentScope,
      mandatory: r.mandatory,
      startDate: r.startDate?.toISOString() ?? null,
      dueDate: r.dueDate?.toISOString() ?? null,
      daysRemaining: daysRemaining(r.dueDate),
      progress,
      status: deriveStatus(progress, r.startDate, r.dueDate),
      source: r.source,
      assignedAt: r.createdAt.toISOString(),
    };
  });

  // Overdue first, then due soon, then newest
  return enrollments.sort((a, b) => {
    const rank = (s: LearnerAssignmentStatus) =>
      s === "overdue" ? 0 : s === "upcoming" ? 3 : s === "completed" ? 4 : 1;
    const rd = rank(a.status) - rank(b.status);
    if (rd !== 0) return rd;
    const da = a.daysRemaining ?? 9999;
    const db_ = b.daysRemaining ?? 9999;
    return da - db_;
  });
}

function isDueSoon(row: AdminEnrollmentRow) {
  return (
    row.daysRemaining != null &&
    row.daysRemaining >= 0 &&
    row.daysRemaining <= 7 &&
    row.status !== "completed"
  );
}

function buildKpis(enrollments: AdminEnrollmentRow[]): AssignmentConsoleKpis {
  const completed = enrollments.filter((e) => e.status === "completed").length;
  return {
    enrollments: enrollments.length,
    uniqueLearners: new Set(enrollments.map((e) => e.userId)).size,
    mandatoryOpen: enrollments.filter((e) => e.mandatory && e.status !== "completed").length,
    overdue: enrollments.filter((e) => e.status === "overdue").length,
    dueIn7d: enrollments.filter(isDueSoon).length,
    completionPct:
      enrollments.length === 0 ? 0 : Math.round((completed / enrollments.length) * 100),
  };
}

function aggregateByLearner(enrollments: AdminEnrollmentRow[]): LearnerAggregate[] {
  const map = new Map<string, LearnerAggregate>();
  for (const row of enrollments) {
    const existing = map.get(row.userId);
    if (!existing) {
      map.set(row.userId, {
        userId: row.userId,
        userName: row.userName,
        userEmail: row.userEmail,
        userDepartment: row.userDepartment,
        userLevel: row.userLevel,
        total: 1,
        completed: row.status === "completed" ? 1 : 0,
        overdue: row.status === "overdue" ? 1 : 0,
        mandatoryOpen: row.mandatory && row.status !== "completed" ? 1 : 0,
        dueSoon: isDueSoon(row) ? 1 : 0,
        avgProgress: row.progress,
        enrollments: [row],
      });
      continue;
    }
    existing.total += 1;
    if (row.status === "completed") existing.completed += 1;
    if (row.status === "overdue") existing.overdue += 1;
    if (row.mandatory && row.status !== "completed") existing.mandatoryOpen += 1;
    if (isDueSoon(row)) existing.dueSoon += 1;
    existing.enrollments.push(row);
    existing.avgProgress = Math.round(
      existing.enrollments.reduce((s, e) => s + e.progress, 0) / existing.enrollments.length
    );
  }

  return [...map.values()].sort((a, b) => {
    if (b.overdue !== a.overdue) return b.overdue - a.overdue;
    if (b.mandatoryOpen !== a.mandatoryOpen) return b.mandatoryOpen - a.mandatoryOpen;
    return a.userName.localeCompare(b.userName);
  });
}

function aggregateByCourse(enrollments: AdminEnrollmentRow[]): CourseAggregate[] {
  const map = new Map<string, CourseAggregate>();
  for (const row of enrollments) {
    const existing = map.get(row.courseId);
    if (!existing) {
      map.set(row.courseId, {
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        courseLevel: row.courseLevel,
        total: 1,
        completed: row.status === "completed" ? 1 : 0,
        overdue: row.status === "overdue" ? 1 : 0,
        mandatory: row.mandatory ? 1 : 0,
        avgProgress: row.progress,
        completionRate: row.status === "completed" ? 100 : 0,
        enrollments: [row],
      });
      continue;
    }
    existing.total += 1;
    if (row.status === "completed") existing.completed += 1;
    if (row.status === "overdue") existing.overdue += 1;
    if (row.mandatory) existing.mandatory += 1;
    existing.enrollments.push(row);
    existing.avgProgress = Math.round(
      existing.enrollments.reduce((s, e) => s + e.progress, 0) / existing.enrollments.length
    );
    existing.completionRate = Math.round((existing.completed / existing.total) * 100);
  }

  return [...map.values()].sort((a, b) => {
    if (b.overdue !== a.overdue) return b.overdue - a.overdue;
    return a.courseTitle.localeCompare(b.courseTitle);
  });
}

export async function listAdminAssignmentConsole(filters?: {
  departmentId?: DepartmentId;
  courseId?: string;
}): Promise<AssignmentConsolePayload> {
  const enrollments = await listAdminCourseAssignments(filters);
  return {
    enrollments,
    byLearner: aggregateByLearner(enrollments),
    byCourse: aggregateByCourse(enrollments),
    kpis: buildKpis(enrollments),
  };
}

export async function bulkUpdateAssignmentDueDates(assignmentIds: string[], dueDate: Date | null) {
  if (assignmentIds.length === 0) return { updated: 0 };
  const db = getDb();
  await db
    .update(courseAssignments)
    .set({ dueDate })
    .where(inArray(courseAssignments.id, assignmentIds));
  return { updated: assignmentIds.length };
}

export async function bulkDeleteAssignments(assignmentIds: string[]) {
  if (assignmentIds.length === 0) return { deleted: 0 };
  const db = getDb();
  await db.delete(courseAssignments).where(inArray(courseAssignments.id, assignmentIds));
  return { deleted: assignmentIds.length };
}

export async function countAssignmentStats(userId: string) {
  const items = await listAssignmentsForUser(userId);
  return {
    total: items.length,
    mandatory: items.filter((i) => i.mandatory).length,
    overdue: items.filter((i) => i.status === "overdue").length,
    dueSoon: items.filter(
      (i) =>
        i.daysRemaining != null &&
        i.daysRemaining >= 0 &&
        i.daysRemaining <= 7 &&
        i.status !== "completed"
    ).length,
    completed: items.filter((i) => i.status === "completed").length,
    inProgress: items.filter((i) => i.status === "in_progress").length,
  };
}

/** Upsert-friendly insert; skips existing (courseId, userId) pairs. */
export async function insertAssignmentsForUsers(input: {
  courseId: string;
  userIds: string[];
  scope: CourseAssignmentScope;
  departmentId?: DepartmentId | null;
  mandatory: boolean;
  startDate: Date | null;
  dueDate: Date | null;
  source: "manual" | "rule" | "onboarding" | "annual_review";
  planId?: string | null;
  cycleId?: string | null;
  assignedBy: string;
}) {
  if (input.userIds.length === 0) {
    return { inserted: 0, skipped: 0, insertedUserIds: [] as string[] };
  }

  const db = getDb();
  const existing = await db
    .select({ userId: courseAssignments.userId })
    .from(courseAssignments)
    .where(
      and(
        eq(courseAssignments.courseId, input.courseId),
        inArray(courseAssignments.userId, input.userIds)
      )
    );
  const existingSet = new Set(existing.map((e) => e.userId));
  const fresh = input.userIds.filter((id) => !existingSet.has(id));

  if (fresh.length === 0) {
    return { inserted: 0, skipped: input.userIds.length, insertedUserIds: [] as string[] };
  }

  await db.insert(courseAssignments).values(
    fresh.map((userId) => ({
      courseId: input.courseId,
      userId,
      departmentId: input.departmentId ?? null,
      scope: input.scope,
      mandatory: input.mandatory,
      startDate: input.startDate,
      dueDate: input.dueDate,
      source: input.source,
      planId: input.planId ?? null,
      cycleId: input.cycleId ?? null,
      assignedBy: input.assignedBy,
    }))
  );

  return {
    inserted: fresh.length,
    skipped: existingSet.size,
    insertedUserIds: fresh,
  };
}

export async function assignmentComplianceSnapshot(departmentId?: DepartmentId) {
  const db = getDb();
  const rows = await db
    .select({
      id: courseAssignments.id,
      userId: courseAssignments.userId,
      courseId: courseAssignments.courseId,
      mandatory: courseAssignments.mandatory,
      dueDate: courseAssignments.dueDate,
      department: profiles.department,
    })
    .from(courseAssignments)
    .innerJoin(profiles, eq(profiles.userId, courseAssignments.userId));

  const scoped = departmentId ? rows.filter((r) => r.department === departmentId) : rows;
  const now = new Date();
  return {
    totalAssignments: scoped.length,
    mandatoryCount: scoped.filter((r) => r.mandatory).length,
    overdueCount: scoped.filter((r) => r.dueDate && r.dueDate < now).length,
    uniqueLearners: new Set(scoped.map((r) => r.userId)).size,
  };
}

/** Used by tests / diagnostics */
export async function countCourseAssignments() {
  const db = getDb();
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(courseAssignments);
  return row?.count ?? 0;
}
