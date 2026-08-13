"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { departments, notifications, profiles, teamMembers, teams, users } from "@/db/schema";
import {
  countUnreadNotifications,
  getAnalyticsSnapshot,
  getLeaderboardRows,
  getManagedUserIds,
  listAuditLogs,
  listDepartments,
  listNotificationsForUser,
  listTeams,
  listUsersWithProfiles,
} from "@/db/queries/operations";
import { writeAuditLog } from "@/lib/audit";
import {
  canManageUsers,
  requireAdmin,
  requireManagerOrAbove,
  requireUserId,
} from "@/lib/auth-utils";
import { ROLE_LABELS } from "@/lib/roles";
import { getProfileByUserId } from "@/lib/profile";
import type { DepartmentId, UserRole } from "@/types";
import {
  bulkImportUsersSchema,
  createNotificationSchema,
  createTeamSchema,
  deleteUserSchema,
  inviteUserSchema,
  markNotificationSchema,
  updateUserSchema,
} from "@/validators/operations";

function defaultAvatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

export async function fetchAdminUsersAction(filters?: {
  search?: string;
  role?: UserRole;
  status?: "active" | "inactive";
  department?: DepartmentId;
}) {
  const actorId = await requireUserId();
  const actor = await getProfileByUserId(actorId);
  if (!canManageUsers(actor?.role) && actor?.role !== "instructor") {
    throw new Error("Forbidden");
  }

  const rows = await listUsersWithProfiles({
    search: filters?.search,
    role: filters?.role,
    status: filters?.status,
    department:
      actor?.role === "department_head" ? actor.department : filters?.department,
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? "Learner",
    email: row.email ?? "",
    avatar: row.image ?? defaultAvatar(row.name ?? "user"),
    department: row.department,
    role: row.role,
    status: row.status ?? "active",
    designation: row.designation,
    joinDate: row.joinDate,
    managerId: row.managerId,
  }));
}

export async function inviteUserAction(input: unknown) {
  const actorId = await requireAdmin();
  const data = inviteUserSchema.parse(input);
  const db = getDb();

  const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (existing[0]) throw new Error("User with this email already exists");

  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      image: defaultAvatar(data.name),
    })
    .returning();

  await db.insert(profiles).values({
    userId: user.id,
    role: data.role,
    department: data.department,
    designation: data.designation ?? ROLE_LABELS[data.role],
    managerId: data.managerId ?? null,
    joinDate: new Date().toISOString().slice(0, 10),
    status: "active",
    goals: [],
  });

  await db.insert(notifications).values({
    userId: user.id,
    title: "Welcome to Skillrr",
    message: "Your learning account is ready. Start with My Learning or a Learning Path.",
    type: "success",
    href: "/dashboard/learning",
  });

  await writeAuditLog({
    userId: actorId,
    action: "user.invited",
    entityType: "user",
    entityId: user.id,
    metadata: { email: data.email, role: data.role, department: data.department },
  });

  revalidatePath("/dashboard/admin/users");
  return { id: user.id };
}

export async function updateUserAction(input: unknown) {
  const actorId = await requireAdmin();
  const data = updateUserSchema.parse(input);
  const db = getDb();

  if (data.name) {
    await db.update(users).set({ name: data.name }).where(eq(users.id, data.userId));
  }

  const profilePatch: Record<string, unknown> = { updatedAt: new Date() };
  if (data.department !== undefined) profilePatch.department = data.department;
  if (data.role !== undefined) profilePatch.role = data.role;
  if (data.designation !== undefined) profilePatch.designation = data.designation;
  if (data.status !== undefined) profilePatch.status = data.status;
  if (data.managerId !== undefined) profilePatch.managerId = data.managerId;

  await db.update(profiles).set(profilePatch).where(eq(profiles.userId, data.userId));

  await writeAuditLog({
    userId: actorId,
    action: "user.updated",
    entityType: "user",
    entityId: data.userId,
    metadata: data,
  });

  revalidatePath("/dashboard/admin/users");
  return { ok: true };
}

export async function deleteUserAction(input: unknown) {
  const actorId = await requireAdmin();
  const data = deleteUserSchema.parse(input);
  const db = getDb();

  if (data.userId === actorId) {
    throw new Error("You cannot delete your own account.");
  }

  const [target] = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);
  if (!target) {
    throw new Error("User not found.");
  }

  const demoEmail = (process.env.DEV_LOGIN_EMAIL ?? "vishnu.sankar@valoriz.com").toLowerCase();
  if (target.email?.toLowerCase() === demoEmail) {
    throw new Error("The platform demo admin account cannot be deleted.");
  }

  await writeAuditLog({
    userId: actorId,
    action: "user.deleted",
    entityType: "user",
    entityId: data.userId,
    metadata: { email: target.email, name: target.name },
  });

  await db.delete(users).where(eq(users.id, data.userId));

  revalidatePath("/dashboard/admin/users");
  return { ok: true };
}

export async function bulkImportUsersAction(input: unknown) {
  const actorId = await requireAdmin();
  const data = bulkImportUsersSchema.parse(input);
  const db = getDb();
  let created = 0;
  let skipped = 0;

  for (const row of data.rows) {
    const existing = await db.select().from(users).where(eq(users.email, row.email)).limit(1);
    if (existing[0]) {
      skipped += 1;
      continue;
    }
    const [user] = await db
      .insert(users)
      .values({
        name: row.name,
        email: row.email,
        image: defaultAvatar(row.name),
      })
      .returning();
    await db.insert(profiles).values({
      userId: user.id,
      role: row.role ?? "employee",
      department: row.department,
      designation: row.designation ?? "Team Member",
      joinDate: new Date().toISOString().slice(0, 10),
      status: "active",
      goals: [],
    });
    created += 1;
  }

  await writeAuditLog({
    userId: actorId,
    action: "user.bulk_import",
    entityType: "user",
    metadata: { created, skipped },
  });

  revalidatePath("/dashboard/admin/users");
  return { created, skipped };
}

export async function fetchAuditLogsAction() {
  await requireManagerOrAbove();
  return listAuditLogs(25);
}

export async function fetchDepartmentsAction() {
  await requireUserId();
  const rows = await listDepartments();
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    employeeCount: d.employeeCount,
    courseCount: d.courseCount,
    avgCompletion: d.avgCompletion,
    color: d.color,
    icon: d.icon,
  }));
}

export async function createTeamAction(input: unknown) {
  const actorId = await requireManagerOrAbove();
  const data = createTeamSchema.parse(input);
  const db = getDb();
  const [team] = await db
    .insert(teams)
    .values({
      name: data.name,
      departmentId: data.departmentId,
      managerId: data.managerId ?? actorId,
    })
    .returning();

  for (const memberId of data.memberIds ?? []) {
    await db.insert(teamMembers).values({ teamId: team.id, userId: memberId });
  }

  await writeAuditLog({
    userId: actorId,
    action: "team.created",
    entityType: "team",
    entityId: team.id,
    metadata: { name: team.name },
  });

  revalidatePath("/dashboard/admin/users");
  return team;
}

export async function fetchTeamsAction() {
  await requireManagerOrAbove();
  return listTeams();
}

export async function fetchNotificationsAction() {
  const userId = await requireUserId();
  const rows = await listNotificationsForUser(userId);
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    href: n.href,
    read: n.read === 1,
    timestamp: n.createdAt.toISOString(),
  }));
}

export async function fetchUnreadNotificationCountAction() {
  const userId = await requireUserId();
  return countUnreadNotifications(userId);
}

export async function markNotificationReadAction(input: unknown) {
  const userId = await requireUserId();
  const data = markNotificationSchema.parse(input);
  const db = getDb();
  await db
    .update(notifications)
    .set({ read: 1 })
    .where(eq(notifications.id, data.notificationId));

  // Ensure ownership — soft check
  const rows = await listNotificationsForUser(userId);
  if (!rows.some((r) => r.id === data.notificationId)) {
    // still ok if already updated
  }

  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const userId = await requireUserId();
  const db = getDb();
  await db.update(notifications).set({ read: 1 }).where(eq(notifications.userId, userId));
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function createNotificationAction(input: unknown) {
  await requireManagerOrAbove();
  const data = createNotificationSchema.parse(input);
  const db = getDb();
  const [created] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type ?? "info",
      href: data.href ?? null,
    })
    .returning();
  return created;
}

export async function fetchAnalyticsAction() {
  const userId = await requireUserId();
  const profile = await getProfileByUserId(userId);
  const role = profile?.role ?? "employee";

  let scopeUserIds: string[] | undefined;
  let view: "admin" | "manager" | "learner" = "learner";

  if (role === "admin" || role === "instructor" || role === "department_head") {
    view = "admin";
    if (role === "department_head" && profile) {
      const deptUsers = await listUsersWithProfiles({ department: profile.department });
      scopeUserIds = deptUsers.map((u) => u.id);
    }
  } else if (role === "manager") {
    view = "manager";
    scopeUserIds = await getManagedUserIds(userId);
    if (scopeUserIds.length === 0) scopeUserIds = [userId];
  } else {
    view = "learner";
    scopeUserIds = [userId];
  }

  const snapshot = await getAnalyticsSnapshot(scopeUserIds);
  const leaderboard = view === "learner" ? [] : await getLeaderboardRows(10);

  return {
    view,
    role,
    snapshot,
    leaderboard,
    recommendations:
      view === "learner"
        ? [
            "Continue your in-progress courses",
            "Take a published assessment to earn a certificate",
            "Enroll in a learning path for structured growth",
          ]
        : [],
  };
}

export async function fetchLeaderboardAction() {
  await requireUserId();
  return getLeaderboardRows(20);
}

export async function refreshDepartmentCountsAction() {
  await requireAdmin();
  const db = getDb();
  const depts = await listDepartments();
  for (const d of depts) {
    const members = await listUsersWithProfiles({ department: d.id, status: "active" });
    await db
      .update(departments)
      .set({ employeeCount: members.length })
      .where(eq(departments.id, d.id));
  }
  return { ok: true };
}
