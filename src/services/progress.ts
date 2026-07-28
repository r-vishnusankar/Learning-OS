"use server";

import { revalidatePath } from "next/cache";
import { getCourseModulesWithLessons, getLessonWithContext } from "@/db/queries/courses";
import { markLessonComplete, upsertLessonProgress } from "@/db/queries/progress";
import { requireUserId } from "@/lib/auth-utils";
import { upsertProgressSchema } from "@/validators/course";

function flattenLessonIds(
  mods: Awaited<ReturnType<typeof getCourseModulesWithLessons>>
): string[] {
  return mods.flatMap((m) => m.lessons.map((l) => l.id));
}

export async function fetchLessonPlayerAction(lessonId: string) {
  const userId = await requireUserId();
  const context = await getLessonWithContext(lessonId);
  if (!context || context.course.publishStatus !== "published") {
    return null;
  }

  const { getUserLessonProgress } = await import("@/db/queries/courses");
  const progressRows = await getUserLessonProgress(userId, [lessonId]);
  const progress = progressRows[0] ?? null;

  const mods = await getCourseModulesWithLessons(context.course.id);
  const orderedIds = flattenLessonIds(mods);
  const index = orderedIds.indexOf(lessonId);
  const nextLessonId = index >= 0 && index < orderedIds.length - 1 ? orderedIds[index + 1] : null;
  const prevLessonId = index > 0 ? orderedIds[index - 1] : null;

  return {
    ...context,
    progress,
    nextLessonId,
    prevLessonId,
    lessonIndex: index >= 0 ? index + 1 : 1,
    lessonTotal: orderedIds.length,
  };
}

export async function upsertProgressAction(input: unknown) {
  const userId = await requireUserId();
  const data = upsertProgressSchema.parse(input);
  const result = await upsertLessonProgress({
    userId,
    lessonId: data.lessonId,
    percentage: data.percentage,
    completed: data.completed,
  });

  const context = await getLessonWithContext(data.lessonId);
  if (context) {
    revalidatePath(`/dashboard/courses/${context.course.slug}`);
    revalidatePath(`/dashboard/courses/${context.course.slug}/lessons/${data.lessonId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/courses");
    revalidatePath("/dashboard/learning");
  }

  return result;
}

export async function completeLessonAction(lessonId: string) {
  const userId = await requireUserId();
  const result = await markLessonComplete(userId, lessonId);

  const context = await getLessonWithContext(lessonId);
  let nextLessonId: string | null = null;
  let courseSlug: string | null = null;
  let assessmentId: string | null = null;
  let courseComplete = false;

  if (context) {
    courseSlug = context.course.slug;
    const mods = await getCourseModulesWithLessons(context.course.id);
    const orderedIds = flattenLessonIds(mods);
    const index = orderedIds.indexOf(lessonId);
    nextLessonId = index >= 0 && index < orderedIds.length - 1 ? orderedIds[index + 1] : null;

    const { getCourseProgressPercent } = await import("@/db/queries/courses");
    const percent = await getCourseProgressPercent(userId, context.course.id);
    courseComplete = percent >= 100;

    if (courseComplete) {
      const { getAssessmentForCourse } = await import("@/db/queries/eligibility");
      const assessment = await getAssessmentForCourse(context.course.id);
      assessmentId = assessment?.id ?? null;

      if (assessmentId) {
        const { getDb } = await import("@/db");
        const { notifications } = await import("@/db/schema");
        const db = getDb();
        await db.insert(notifications).values({
          userId,
          title: "Course complete — take assessment",
          message: `You finished ${context.course.title}. Pass the knowledge check to certify this course.`,
          type: "reminder",
          href: `/dashboard/assessments/${assessmentId}`,
          read: 0,
        });
      }
    }

    revalidatePath(`/dashboard/courses/${context.course.slug}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/learning");
    revalidatePath("/dashboard/assessments");
  }

  return { ...result, nextLessonId, courseSlug, courseComplete, assessmentId };
}
