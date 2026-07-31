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
  const completed = input.completed ?? input.percentage >= 100;

  const [existing] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, input.userId), eq(lessonProgress.lessonId, input.lessonId)))
    .limit(1);

  const completedAt = completed ? now : existing?.completedAt ?? null;

  await db
    .insert(lessonProgress)
    .values({
      userId: input.userId,
      lessonId: input.lessonId,
      percentage: input.percentage,
      completed,
      lastViewedAt: now,
      completedAt,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        percentage: input.percentage,
        completed,
        lastViewedAt: now,
        completedAt,
      },
    });

  return { percentage: input.percentage, completed };
}

export async function markLessonComplete(userId: string, lessonId: string) {
  return upsertLessonProgress({ userId, lessonId, percentage: 100, completed: true });
}
