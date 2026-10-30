import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, users } from "@/db/schema";
import { displayedStreak } from "@/lib/streak";
import type { User } from "@/types";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultAvatar(name?: string | null) {
  const seed = encodeURIComponent(name?.trim() || "user");
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
}

export async function ensureProfile(userId: string) {
  const db = getDb();
  const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      userId,
      joinDate: todayIsoDate(),
      goals: [],
    })
    .returning();

  return created;
}

export async function getProfileByUserId(userId: string) {
  const db = getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return profile;
}

export async function getUserWithProfile(userId: string): Promise<User | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    return null;
  }

  const profile = (await getProfileByUserId(userId)) ?? (await ensureProfile(userId));

  return {
    id: user.id,
    name: user.name ?? "Learner",
    email: user.email ?? "",
    avatar: user.image ?? defaultAvatar(user.name),
    role: profile.role,
    designation: profile.designation,
    department: profile.department,
    level: profile.level,
    xp: profile.xp,
    coins: profile.coins,
    streak: displayedStreak(profile.streak, profile.lastActivityDate),
    companyRank: profile.companyRank,
    departmentRank: profile.departmentRank,
    skillScore: profile.skillScore,
    joinDate: profile.joinDate,
    experienceYears: profile.experienceYears,
    goals: profile.goals,
  };
}
