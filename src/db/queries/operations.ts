import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assessmentAttempts,
  assessments,
  certificates,
  courses,
  departments,
  lessonProgress,
  notifications,
  profiles,
  teams,
  teamMembers,
  users,
  auditLogs,
} from "@/db/schema";
import type { DepartmentId, UserRole } from "@/types";
import type { EmployeeStatus } from "@/db/schema/auth";

export async function listUsersWithProfiles(opts?: {
  department?: DepartmentId;
  role?: UserRole;
  status?: EmployeeStatus;
  search?: string;
}) {
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: profiles.role,
      department: profiles.department,
      designation: profiles.designation,
      status: profiles.status,
      managerId: profiles.managerId,
      joinDate: profiles.joinDate,
      xp: profiles.xp,
      streak: profiles.streak,
      level: profiles.level,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(asc(users.name));

  return rows.filter((row) => {
    if (opts?.department && row.department !== opts.department) return false;
    if (opts?.role && row.role !== opts.role) return false;
    if (opts?.status && row.status !== opts.status) return false;
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      const hay = `${row.name ?? ""} ${row.email ?? ""} ${row.id} ${row.designation ?? ""} ${row.department ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function listDepartments() {
  const db = getDb();
  return db.select().from(departments).orderBy(asc(departments.name));
}

export async function listNotificationsForUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function countUnreadNotifications(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, 0)));
  return row?.count ?? 0;
}

export async function listAuditLogs(limit = 20) {
  const db = getDb();
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function listTeams() {
  const db = getDb();
  return db.select().from(teams).orderBy(asc(teams.name));
}

export async function getTeamMemberUserIds(teamId: string) {
  const db = getDb();
  const rows = await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  return rows.map((r) => r.userId);
}

export async function getManagedUserIds(managerId: string) {
  const db = getDb();
  const direct = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.managerId, managerId));

  const managedTeams = await db.select().from(teams).where(eq(teams.managerId, managerId));
  const teamUserIds: string[] = [];
  for (const team of managedTeams) {
    const members = await getTeamMemberUserIds(team.id);
    teamUserIds.push(...members);
  }

  return [...new Set([...direct.map((d) => d.userId), ...teamUserIds])];
}

export async function getAnalyticsSnapshot(scopeUserIds?: string[]) {
  const db = getDb();

  // Fast path: single-user dashboard metrics (SQL-filtered, no full-table scans)
  if (scopeUserIds?.length === 1) {
    const userId = scopeUserIds[0]!;
    const [[profile], [certRow], [attemptRow], [progressRow], [courseRow], [assessmentRow]] =
      await Promise.all([
        db
          .select({
            xp: profiles.xp,
            streak: profiles.streak,
            status: profiles.status,
            department: profiles.department,
          })
          .from(profiles)
          .where(eq(profiles.userId, userId))
          .limit(1),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(certificates)
          .where(and(eq(certificates.userId, userId), eq(certificates.status, "earned"))),
        db
          .select({
            taken: sql<number>`count(*)::int`,
            passed: sql<number>`count(*) filter (where ${assessmentAttempts.passed} = true)::int`,
            avgScore: sql<number>`coalesce(round(avg(${assessmentAttempts.percentage})), 0)::int`,
          })
          .from(assessmentAttempts)
          .where(
            and(
              eq(assessmentAttempts.userId, userId),
              sql`${assessmentAttempts.status} in ('graded', 'submitted')`
            )
          ),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(lessonProgress)
          .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.completed, true))),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(courses)
          .where(eq(courses.publishStatus, "published")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(assessments)
          .where(eq(assessments.publishStatus, "published")),
      ]);

    return {
      activeUsers: profile?.status === "active" ? 1 : 0,
      totalUsers: 1,
      totalXp: profile?.xp ?? 0,
      avgStreak: profile?.streak ?? 0,
      certificatesEarned: certRow?.count ?? 0,
      assessmentsTaken: attemptRow?.taken ?? 0,
      assessmentsPassed: attemptRow?.passed ?? 0,
      avgAssessmentScore: attemptRow?.avgScore ?? 0,
      completedLessons: progressRow?.count ?? 0,
      publishedCourses: courseRow?.count ?? 0,
      publishedAssessments: assessmentRow?.count ?? 0,
      departments: [],
    };
  }

  const allProfiles = await db.select().from(profiles);
  const scopedProfiles = scopeUserIds
    ? allProfiles.filter((p) => scopeUserIds.includes(p.userId))
    : allProfiles;

  const activeUsers = scopedProfiles.filter((p) => p.status === "active").length;
  const totalXp = scopedProfiles.reduce((sum, p) => sum + p.xp, 0);
  const avgStreak =
    scopedProfiles.length === 0
      ? 0
      : Math.round(
          scopedProfiles.reduce((sum, p) => sum + p.streak, 0) / scopedProfiles.length
        );

  const certRows = await db.select().from(certificates);
  const certs = scopeUserIds
    ? certRows.filter((c) => scopeUserIds.includes(c.userId) && c.status === "earned")
    : certRows.filter((c) => c.status === "earned");

  const attemptRows = await db.select().from(assessmentAttempts);
  const attempts = scopeUserIds
    ? attemptRows.filter((a) => scopeUserIds.includes(a.userId))
    : attemptRows;
  const graded = attempts.filter((a) => a.status === "graded" || a.status === "submitted");
  const passed = graded.filter((a) => a.passed === true);
  const avgScore =
    graded.length === 0
      ? 0
      : Math.round(
          graded.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / graded.length
        );

  const progressRows = await db.select().from(lessonProgress);
  const progress = scopeUserIds
    ? progressRows.filter((p) => scopeUserIds.includes(p.userId))
    : progressRows;
  const completedLessons = progress.filter((p) => p.completed).length;

  const publishedCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.publishStatus, "published"));
  const publishedAssessments = await db
    .select()
    .from(assessments)
    .where(eq(assessments.publishStatus, "published"));

  const depts = await listDepartments();
  const deptStats = depts.map((d) => {
    const members = scopedProfiles.filter((p) => p.department === d.id);
    const memberIds = new Set(members.map((m) => m.userId));
    const deptCerts = certs.filter((c) => memberIds.has(c.userId)).length;
    const deptAttempts = graded.filter((a) => memberIds.has(a.userId));
    const completion =
      deptAttempts.length === 0
        ? 0
        : Math.round(
            (deptAttempts.filter((a) => a.passed).length / deptAttempts.length) * 100
          );
    return {
      id: d.id,
      name: d.name,
      employeeCount: members.length,
      certificates: deptCerts,
      avgCompletion: completion || d.avgCompletion,
      color: d.color,
    };
  });

  return {
    activeUsers,
    totalUsers: scopedProfiles.length,
    totalXp,
    avgStreak,
    certificatesEarned: certs.length,
    assessmentsTaken: graded.length,
    assessmentsPassed: passed.length,
    avgAssessmentScore: avgScore,
    completedLessons,
    publishedCourses: publishedCourses.length,
    publishedAssessments: publishedAssessments.length,
    departments: deptStats,
  };
}

/** Org-wide average assessment score only (for charts) — avoids full org snapshot. */
export async function getOrgAvgAssessmentScore() {
  const db = getDb();
  const [row] = await db
    .select({
      avgScore: sql<number>`coalesce(round(avg(${assessmentAttempts.percentage})), 0)::int`,
    })
    .from(assessmentAttempts)
    .where(sql`${assessmentAttempts.status} in ('graded', 'submitted')`);
  return row?.avgScore ?? 0;
}


export async function getLeaderboardRows(limit = 20) {
  const db = getDb();
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      image: users.image,
      department: profiles.department,
      xp: profiles.xp,
      streak: profiles.streak,
      companyRank: profiles.companyRank,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.status, "active"))
    .orderBy(desc(profiles.xp))
    .limit(limit);

  const certCounts = await db
    .select({
      userId: certificates.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(eq(certificates.status, "earned"))
    .groupBy(certificates.userId);

  const certMap = Object.fromEntries(certCounts.map((c) => [c.userId, c.count]));

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.userId,
    name: row.name ?? "Learner",
    avatar:
      row.image ??
      `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(row.name ?? "user")}`,
    department: row.department,
    xp: row.xp,
    streak: row.streak,
    certificates: certMap[row.userId] ?? 0,
    badges: 0,
  }));
}
