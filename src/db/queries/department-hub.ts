import { and, eq, gte, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assessmentAttempts,
  certificates,
  courses,
  departments,
  lessonProgress,
  profiles,
  users,
} from "@/db/schema";
import { getProgressCells } from "@/db/queries/course-assignments";
import {
  ACTIVE_LEARNER_WINDOW_DAYS,
  rollupDepartmentCells,
} from "@/lib/department-metrics";
import { displayedStreak } from "@/lib/streak";
import type { DepartmentId } from "@/types";

export type DepartmentHub = {
  id: DepartmentId;
  name: string;
  description: string;
  color: string;
  icon: string;
  employeeCount: number;
  courseCount: number;
  courseIds: string[];
  avgCompletion: number;
  activeLearners: number;
  inProgressCount: number;
  completedCount: number;
  enrollmentRatePct: number | null;
  assessmentPassRatePct: number | null;
  avgWeeklyHours: number | null;
  certificatesIssued: number;
  activeStreaks: number;
  topPerformers: {
    userId: string;
    name: string;
    avatar: string;
    xp: number;
    streak: number;
  }[];
};

function defaultAvatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

export async function getDepartmentHub(departmentId: string): Promise<DepartmentHub | null> {
  const db = getDb();
  const [dept] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, departmentId as DepartmentId))
    .limit(1);
  if (!dept) return null;

  const memberRows = await db
    .select({
      userId: profiles.userId,
      name: users.name,
      image: users.image,
      xp: profiles.xp,
      streak: profiles.streak,
      lastActivityDate: profiles.lastActivityDate,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.department, dept.id), eq(profiles.status, "active")));

  const members = memberRows.map((row) => {
    const name = row.name ?? "Learner";
    return {
      userId: row.userId,
      name,
      avatar: row.image ?? defaultAvatar(name),
      xp: row.xp,
      streak: displayedStreak(row.streak, row.lastActivityDate),
    };
  });
  const userIds = members.map((m) => m.userId);

  const courseRows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.publishStatus, "published"),
        or(eq(courses.openToAll, true), eq(courses.departmentId, dept.id))
      )
    );
  const courseIds = courseRows.map((c) => c.id);

  const cells = await getProgressCells(userIds, courseIds);
  const rollup = rollupDepartmentCells([...cells.values()]);

  const now = new Date();
  const activitySince = new Date(
    now.getTime() - ACTIVE_LEARNER_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
  let activeLearners = 0;
  if (userIds.length > 0) {
    const activityRows = await db
      .select({ userId: lessonProgress.userId })
      .from(lessonProgress)
      .where(
        and(
          inArray(lessonProgress.userId, userIds),
          or(
            gte(lessonProgress.lastViewedAt, activitySince),
            gte(lessonProgress.completedAt, activitySince)
          )
        )
      );
    activeLearners = new Set(activityRows.map((r) => r.userId)).size;
  }

  let certificatesIssued = 0;
  if (userIds.length > 0) {
    const [certRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(certificates)
      .where(and(eq(certificates.status, "earned"), inArray(certificates.userId, userIds)));
    certificatesIssued = certRow?.count ?? 0;
  }

  let assessmentPassRatePct: number | null = null;
  if (userIds.length > 0) {
    const [attemptRow] = await db
      .select({
        taken: sql<number>`count(*)::int`,
        passed: sql<number>`count(*) filter (where ${assessmentAttempts.passed} = true)::int`,
      })
      .from(assessmentAttempts)
      .where(
        and(
          inArray(assessmentAttempts.userId, userIds),
          sql`${assessmentAttempts.status} in ('graded', 'submitted')`
        )
      );
    if ((attemptRow?.taken ?? 0) > 0) {
      assessmentPassRatePct = Math.round(((attemptRow?.passed ?? 0) / attemptRow!.taken) * 100);
    }
  }

  const topPerformers = [...members]
    .sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      const byName = a.name.localeCompare(b.name);
      if (byName !== 0) return byName;
      return a.userId.localeCompare(b.userId);
    })
    .slice(0, 5);

  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    color: dept.color,
    icon: dept.icon,
    employeeCount: members.length,
    courseCount: courseIds.length,
    courseIds,
    avgCompletion: rollup.avgCompletion,
    activeLearners,
    inProgressCount: rollup.inProgressCount,
    completedCount: rollup.completedCount,
    enrollmentRatePct: rollup.enrollmentRatePct,
    assessmentPassRatePct,
    avgWeeklyHours: null,
    certificatesIssued,
    activeStreaks: members.filter((m) => m.streak > 0).length,
    topPerformers,
  };
}
