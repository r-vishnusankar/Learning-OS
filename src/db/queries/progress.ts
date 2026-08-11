import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { lessonProgress } from "@/db/schema";

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

  return { percentage, completed };
}

export async function markLessonComplete(userId: string, lessonId: string) {
  return upsertLessonProgress({ userId, lessonId, percentage: 100, completed: true });
}
