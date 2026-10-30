import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { lessonProgress, lessons, profiles } from "@/db/schema";
import { bucketWeeklyHours } from "@/lib/ist";
import { streakCalendarKeys } from "@/lib/streak";

export async function upsertLessonProgress(input: {
  userId: string;
  lessonId: string;
  percentage: number;
  completed?: boolean;
}) {
  const db = getDb();
  const now = new Date();
  const wantCompleted = input.completed ?? input.percentage >= 100;

  const [existing] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, input.userId), eq(lessonProgress.lessonId, input.lessonId)))
    .limit(1);

  // Completion is one-way; percentage never decreases. Views must not wipe either.
  const completed = Boolean(existing?.completed) || wantCompleted;
  const percentage = Math.max(
    existing?.percentage ?? 0,
    input.percentage,
    completed ? 100 : 0
  );
  const completedAt = completed ? (existing?.completedAt ?? now) : null;

  await db
    .insert(lessonProgress)
    .values({
      userId: input.userId,
      lessonId: input.lessonId,
      percentage,
      completed,
      lastViewedAt: now,
      completedAt,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        percentage,
        completed,
        lastViewedAt: now,
        completedAt,
      },
    });

  if (completed || percentage > 0) {
    await recordLearningActivityStreak(input.userId, now);
  }

  return { percentage, completed };
}

/** Single-row UPDATE; Postgres serializes concurrent writers on the same profile. */
export async function recordLearningActivityStreak(userId: string, now: Date = new Date()) {
  const { todayKey, yesterdayKey } = streakCalendarKeys(now);
  const db = getDb();
  await db
    .update(profiles)
    .set({
      streak: sql`CASE
        WHEN ${profiles.lastActivityDate} IS NOT DISTINCT FROM ${todayKey} THEN ${profiles.streak}
        WHEN ${profiles.lastActivityDate} IS NOT DISTINCT FROM ${yesterdayKey} THEN ${profiles.streak} + 1
        ELSE 1
      END`,
      lastActivityDate: todayKey,
      updatedAt: now,
    })
    .where(
      and(
        eq(profiles.userId, userId),
        sql`${profiles.lastActivityDate} IS DISTINCT FROM ${todayKey}`
      )
    );
}

export async function markLessonComplete(userId: string, lessonId: string) {
  return upsertLessonProgress({ userId, lessonId, percentage: 100, completed: true });
}

export async function getLearnerTimeStats(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      durationMinutes: lessons.durationMinutes,
      completedAt: lessonProgress.completedAt,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.completed, true)));

  const completions = rows.map((row) => ({
    completedAt: row.completedAt,
    durationMinutes: row.durationMinutes ?? 0,
  }));
  const learnedMinutes = completions.reduce((sum, row) => sum + row.durationMinutes, 0);
  const weekly = bucketWeeklyHours(completions, new Date());

  return {
    learnedMinutes,
    todayLearnedMinutes: weekly.todayMinutes,
    weeklyHours: weekly.hours,
    weeklyCompletedLessons: weekly.completedCount,
  };
}
