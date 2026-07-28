"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { profiles, users } from "@/db/schema";
import { getAnalyticsSnapshot, getLeaderboardRows } from "@/db/queries/operations";
import { requireUserId } from "@/lib/auth-utils";
import { getUserWithProfile } from "@/lib/profile";
import type { DepartmentId, Skill, User } from "@/types";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  designation: z.string().min(1).max(120).optional(),
  department: z
    .enum(["qa", "development", "ba", "hr", "marketing", "uiux", "devops"])
    .optional(),
  level: z
    .enum([
      "beginner",
      "associate",
      "intermediate",
      "advanced",
      "senior",
      "lead",
      "architect",
      "expert",
    ])
    .optional(),
  goals: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
});

const prefsSchema = z.object({
  emailDigest: z.boolean().optional(),
  assessmentReminders: z.boolean().optional(),
  streakAlerts: z.boolean().optional(),
  courseUpdates: z.boolean().optional(),
  teamActivity: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  dailyGoalMinutes: z.number().int().min(15).max(240).optional(),
  preferredDifficulty: z.string().optional(),
  autoEnrollPaths: z.boolean().optional(),
  showLeaderboard: z.boolean().optional(),
  aiRecommendations: z.boolean().optional(),
  profileVisible: z.boolean().optional(),
  showProgress: z.boolean().optional(),
  showCertificates: z.boolean().optional(),
  analyticsOptIn: z.boolean().optional(),
  savedCourseIds: z.array(z.string()).optional(),
});

export type UserPreferences = z.infer<typeof prefsSchema>;

export async function fetchCurrentUserAction(): Promise<User | null> {
  const userId = await requireUserId();
  return getUserWithProfile(userId);
}

export async function updateMyProfileAction(input: unknown) {
  const userId = await requireUserId();
  const data = updateProfileSchema.parse(input);
  const db = getDb();

  if (data.name) {
    await db.update(users).set({ name: data.name }).where(eq(users.id, userId));
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (data.designation !== undefined) patch.designation = data.designation;
  if (data.department !== undefined) patch.department = data.department;
  // Learning level is gated by Admin Promotions — ignore self-serve level changes
  if (data.goals !== undefined) patch.goals = data.goals;
  if (data.experienceYears !== undefined) patch.experienceYears = data.experienceYears;

  await db.update(profiles).set(patch).where(eq(profiles.userId, userId));
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");
  return getUserWithProfile(userId);
}

export async function fetchMyPreferencesAction(): Promise<UserPreferences> {
  const userId = await requireUserId();
  const db = getDb();
  const [row] = await db
    .select({ preferences: profiles.preferences })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return (row?.preferences as UserPreferences) ?? {};
}

export async function updateMyPreferencesAction(input: unknown) {
  const userId = await requireUserId();
  const patch = prefsSchema.parse(input);
  const db = getDb();
  const [existing] = await db
    .select({ preferences: profiles.preferences })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  const next = { ...(existing?.preferences as UserPreferences), ...patch };
  await db
    .update(profiles)
    .set({ preferences: next, updatedAt: new Date() })
    .where(eq(profiles.userId, userId));
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/learning");
  return next;
}

export async function toggleSavedCourseAction(courseId: string) {
  const userId = await requireUserId();
  const prefs = await fetchMyPreferencesAction();
  const saved = new Set(prefs.savedCourseIds ?? []);
  if (saved.has(courseId)) saved.delete(courseId);
  else saved.add(courseId);
  return updateMyPreferencesAction({ savedCourseIds: [...saved] });
}

export async function fetchDashboardHomeAction() {
  const userId = await requireUserId();
  const user = await getUserWithProfile(userId);
  const snapshot = await getAnalyticsSnapshot([userId]);
  const orgSnapshot = await getAnalyticsSnapshot();
  const leaderboard = await getLeaderboardRows(8);
  const prefs = await fetchMyPreferencesAction();
  const myRank = leaderboard.find((e) => e.userId === userId)?.rank ?? user?.companyRank ?? 0;

  const coursesCompleted = snapshot.completedLessons > 0
    ? Math.max(1, Math.round(snapshot.completedLessons / 8))
    : user?.skillScore
      ? 0
      : 0;

  // Derive weekly hours from lesson completions (fallback distribution)
  const totalHours = Math.max(1, Math.round(snapshot.completedLessons * 0.35) || Math.round((user?.xp ?? 0) / 120));
  const weeklyHours = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({
    label,
    value: Math.max(0, Math.round((totalHours / 7) * (i < 5 ? 1.2 : 0.6) * (0.7 + ((i * 17) % 5) / 10))),
  }));

  const heatmapData = Array.from({ length: 7 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const base = snapshot.completedLessons > 0 ? (snapshot.completedLessons % 5) + 1 : 0;
      return Math.min(4, Math.max(0, (base + week + day) % 5));
    })
  );

  const monthlyLearning = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((label, i) => ({
    label,
    value: Math.round(40 + (snapshot.avgAssessmentScore || 50) * 0.4 + i * 3),
    secondary: Math.round(35 + (orgSnapshot.avgAssessmentScore || 45) * 0.35 + i * 2),
  }));

  return {
    user,
    prefs,
    stats: {
      coursesCompleted: Math.max(coursesCompleted, snapshot.certificatesEarned > 0 ? 1 : 0),
      hoursLearned: totalHours,
      certificates: snapshot.certificatesEarned,
      averageScore: snapshot.avgAssessmentScore || 0,
      streak: user?.streak ?? 0,
      companyRank: myRank || user?.companyRank || 0,
      departmentRank: user?.departmentRank || 0,
      skillScore: user?.skillScore || Math.min(100, Math.round((user?.xp ?? 0) / 50)),
      todayGoalMinutes: prefs.dailyGoalMinutes ?? 45,
      todayCompletedMinutes: Math.min(
        prefs.dailyGoalMinutes ?? 45,
        Math.round(((snapshot.completedLessons % 5) + 1) * 12)
      ),
    },
    weeklyHours,
    heatmapData,
    monthlyLearning,
    leaderboard,
    orgSnapshot,
  };
}

export async function fetchMySkillsAction(): Promise<{
  skills: Skill[];
  skillGrowth: { label: string; value: number; secondary?: number }[];
  skillScore: number;
  department: DepartmentId;
}> {
  const userId = await requireUserId();
  const user = await getUserWithProfile(userId);
  const { listUserCertificates } = await import("@/db/queries/certification");
  const { fetchPublishedCoursesAction } = await import("@/services/courses");
  const certs = await listUserCertificates(userId);
  const courses = await fetchPublishedCoursesAction();
  const dept = user?.department ?? "development";

  const tagScores = new Map<string, { current: number; target: number; category: string }>();

  for (const course of courses.filter((c) => c.department === dept || c.progress > 0)) {
    for (const tag of course.tags.length ? course.tags : [course.category]) {
      const prev = tagScores.get(tag) ?? { current: 20, target: 80, category: course.category };
      const bump = course.status === "completed" ? 35 : course.progress > 0 ? 15 : 5;
      tagScores.set(tag, {
        current: Math.min(95, prev.current + bump),
        target: 90,
        category: course.category,
      });
    }
  }

  for (const cert of certs.filter((c) => c.status === "earned")) {
    for (const skill of cert.skills) {
      const prev = tagScores.get(skill) ?? { current: 40, target: 90, category: "Credential" };
      tagScores.set(skill, {
        current: Math.min(100, prev.current + 25),
        target: 95,
        category: "Credential",
      });
    }
  }

  // Ensure at least a few department baseline skills
  const defaults = [
    { name: "Core Fundamentals", category: "Foundation" },
    { name: "Collaboration", category: "Soft Skills" },
    { name: "Delivery Quality", category: "Practice" },
  ];
  for (const d of defaults) {
    if (![...tagScores.keys()].some((k) => k.toLowerCase().includes(d.name.split(" ")[0].toLowerCase()))) {
      tagScores.set(d.name, {
        current: Math.min(85, 30 + Math.round((user?.skillScore ?? 40) / 2)),
        target: 85,
        category: d.category,
      });
    }
  }

  const skills: Skill[] = [...tagScores.entries()].slice(0, 10).map(([name, v], i) => ({
    id: `skill-${i}`,
    name,
    category: v.category,
    current: v.current,
    target: v.target,
    department: dept,
  }));

  const skillGrowth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((label, i) => ({
    label,
    value: Math.round(
      skills.reduce((s, sk) => s + sk.current, 0) / Math.max(1, skills.length) * (0.7 + i * 0.04)
    ),
    secondary: 45 + i * 4,
  }));

  return {
    skills,
    skillGrowth,
    skillScore: user?.skillScore ?? Math.round(skills.reduce((s, sk) => s + sk.current, 0) / Math.max(1, skills.length)),
    department: dept,
  };
}
