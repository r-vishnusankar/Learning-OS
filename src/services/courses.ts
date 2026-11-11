"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  countLessonsForCourses,
  courseSlugExists,
  getActiveLearnerCountsByCourse,
  getAdminCourses,
  getCourseById,
  getCourseBySlug,
  getCourseModulesWithLessons,
  getModulesWithLessonsForCourses,
  getPublishedCourses,
  getPublishedCoursesByIds,
  getUserActiveCourseIds,
  getUserLessonProgressMap,
  getUserLessonProgress,
} from "@/db/queries/courses";
import {
  getAssessmentByCourseId,
  getPassedAssessmentIds,
  getPublishedAssessmentsByCourseIds,
} from "@/db/queries/assessments";
import type { CourseProgressAssessment } from "@/lib/course-progress";

async function assessmentByCourseForUser(userId: string, courseIds: string[]) {
  const published = await getPublishedAssessmentsByCourseIds(courseIds);
  const passed = await getPassedAssessmentIds(
    userId,
    [...published.values()].map((a) => a.id)
  );
  const map = new Map<string, CourseProgressAssessment | null>();
  for (const courseId of courseIds) {
    const row = published.get(courseId);
    map.set(
      courseId,
      row ? { id: row.id, required: true, passed: passed.has(row.id) } : null
    );
  }
  return map;
}

import { courses, instructors, lessonResources, lessons, mediaAssets, modules } from "@/db/schema";
import type { PublishStatus } from "@/db/schema/courses";
import { requireAdminOrInstructor, requireCourseAssigner, requireUserId } from "@/lib/auth-utils";
import { mapCourseToUi } from "@/lib/course-mapper";
import { uniqueSlug } from "@/lib/slug";
import {
  addLessonResourceSchema,
  createCourseSchema,
  createLessonSchema,
  createMediaAssetSchema,
  createModuleSchema,
  reorderSchema,
  updateCourseSchema,
  updateLessonSchema,
  updateModuleSchema,
} from "@/validators/course";

export async function fetchAdminCoursesAction(filters?: {
  search?: string;
  departmentId?: string;
  publishStatus?: PublishStatus;
  level?: import("@/types").LearningLevel;
  difficulty?: import("@/types").Difficulty;
  learningCategory?: import("@/types").LearningCategory;
}) {
  await requireAdminOrInstructor();
  const rows = await getAdminCourses(filters);
  const lessonCounts = await countLessonsForCourses(rows.map((r) => r.course.id));

  return rows.map((row) => ({
    ...row.course,
    instructorName: row.instructor?.name ?? null,
    lessonsCount: lessonCounts.get(row.course.id) ?? 0,
  }));
}

/** Lean published courses for dashboard recommendations — no modules/lessons. */
export async function fetchRecommendedCoursesAction(limit = 12) {
  const userId = await requireUserId();
  const profile = await (await import("@/lib/profile")).getProfileByUserId(userId);
  const userDepartmentId = profile?.department ?? undefined;

  const [rows, activeIds, learnerCounts] = await Promise.all([
    getPublishedCourses(userDepartmentId),
    getUserActiveCourseIds(userId, 24),
    getActiveLearnerCountsByCourse(),
  ]);

  const busy = new Set(activeIds);
  const ranked = rows
    .filter((row) => !busy.has(row.course.id))
    .sort((a, b) => {
      const score = (row: (typeof rows)[number]) =>
        (row.course.departmentId === userDepartmentId ? 4 : 0) +
        (row.course.isTrending ? 3 : 0) +
        (row.course.rating ?? 0);
      return score(b) - score(a);
    })
    .slice(0, limit);

  return ranked.map((row) =>
    mapCourseToUi({ ...row, progress: 0 }, [], {}, false, learnerCounts.get(row.course.id) ?? 0)
  );
}

/** Published courses for assigners (includes department_head). */
export async function fetchAssignableCoursesAction() {
  await requireCourseAssigner();
  const rows = await getAdminCourses({ publishStatus: "published" });
  return rows.map((row) => ({
    id: row.course.id,
    title: row.course.title,
    description: row.course.description,
    departmentId: row.course.departmentId,
    level: row.course.level,
    difficulty: row.course.difficulty,
    learningCategory: row.course.learningCategory,
    slug: row.course.slug,
    durationMinutes: row.course.durationMinutes,
  }));
}

export async function fetchPublishedCoursesAction() {
  const userId = await requireUserId();
  const profile = await (await import("@/lib/profile")).getProfileByUserId(userId);
  const userDepartmentId = profile?.department ?? undefined;

  const [rows, prefs, progressByLesson, learnerCounts] = await Promise.all([
    getPublishedCourses(userDepartmentId),
    (await import("@/services/me")).fetchMyPreferencesAction(),
    getUserLessonProgressMap(userId),
    getActiveLearnerCountsByCourse(),
  ]);
  const saved = new Set(prefs.savedCourseIds ?? []);
  const courseIds = rows.map((r) => r.course.id);
  const [modulesByCourse, assessments] = await Promise.all([
    getModulesWithLessonsForCourses(courseIds),
    assessmentByCourseForUser(userId, courseIds),
  ]);
  const { listPublishedPathsByCourseIds } = await import("@/db/queries/certification");
  const pathMap = await listPublishedPathsByCourseIds(courseIds);

  return rows.map((row) => {
    const mods = modulesByCourse.get(row.course.id) ?? [];
    const lessonIds = mods.flatMap((m) => m.lessons.map((l) => l.id));
    const progressMap = Object.fromEntries(
      lessonIds.map((id) => {
        const p = progressByLesson.get(id);
        return [
          id,
          {
            completed: p?.completed ?? false,
            percentage: p?.percentage ?? 0,
            lastViewedAt: p?.lastViewedAt ?? null,
          },
        ];
      })
    );

    return {
      ...mapCourseToUi(
        row,
        mods,
        progressMap,
        saved.has(row.course.id),
        learnerCounts.get(row.course.id) ?? 0,
        assessments.get(row.course.id)
      ),
      paths: pathMap.get(row.course.id) ?? [],
    };
  });
}

/** Lean list for dashboard home — only courses the learner has touched. */
export async function fetchMyActiveCoursesAction(limit = 8) {
  const userId = await requireUserId();
  const [activeIds, prefs, progressByLesson, learnerCounts] = await Promise.all([
    getUserActiveCourseIds(userId, limit),
    (await import("@/services/me")).fetchMyPreferencesAction(),
    getUserLessonProgressMap(userId),
    getActiveLearnerCountsByCourse(),
  ]);
  if (!activeIds.length) return [];

  const saved = new Set(prefs.savedCourseIds ?? []);
  const [rows, modulesByCourse, assessments] = await Promise.all([
    getPublishedCoursesByIds(activeIds),
    getModulesWithLessonsForCourses(activeIds),
    assessmentByCourseForUser(userId, activeIds),
  ]);

  return rows.map((row) => {
    const mods = modulesByCourse.get(row.course.id) ?? [];
    const lessonIds = mods.flatMap((m) => m.lessons.map((l) => l.id));
    const progressMap = Object.fromEntries(
      lessonIds.map((id) => {
        const p = progressByLesson.get(id);
        return [
          id,
          {
            completed: p?.completed ?? false,
            percentage: p?.percentage ?? 0,
            lastViewedAt: p?.lastViewedAt ?? null,
          },
        ];
      })
    );

    return mapCourseToUi(
      row,
      mods,
      progressMap,
      saved.has(row.course.id),
      learnerCounts.get(row.course.id) ?? 0,
      assessments.get(row.course.id)
    );
  });
}

export async function fetchCourseBySlugAction(slug: string) {
  const userId = await requireUserId();
  const row = await getCourseBySlug(slug);
  if (!row || row.course.publishStatus !== "published") {
    return null;
  }

  const mods = await getCourseModulesWithLessons(row.course.id);
  const lessonIds = mods.flatMap((m) => m.lessons.map((l) => l.id));
  const [progressRows, assessments, prefs] = await Promise.all([
    getUserLessonProgress(userId, lessonIds),
    assessmentByCourseForUser(userId, [row.course.id]),
    (await import("@/services/me")).fetchMyPreferencesAction(),
  ]);
  const progressMap = Object.fromEntries(
    progressRows.map((p) => [
      p.lessonId,
      {
        completed: p.completed,
        percentage: p.percentage,
        lastViewedAt: p.lastViewedAt,
      },
    ])
  );
  const isSaved = (prefs.savedCourseIds ?? []).includes(row.course.id);

  const mapped = mapCourseToUi(
    row,
    mods,
    progressMap,
    isSaved,
    undefined,
    assessments.get(row.course.id)
  );
  const { listPublishedPathsByCourseIds } = await import("@/db/queries/certification");
  const pathMap = await listPublishedPathsByCourseIds([row.course.id]);
  return { ...mapped, paths: pathMap.get(row.course.id) ?? [] };
}

export async function fetchCourseBuilderAction(courseId: string) {
  await requireAdminOrInstructor();
  const course = await getCourseById(courseId);
  if (!course) return null;
  const mods = await getCourseModulesWithLessons(courseId);
  const knowledgeCheck = await getAssessmentByCourseId(courseId);
  return {
    course,
    modules: mods,
    knowledgeCheck: knowledgeCheck
      ? {
          id: knowledgeCheck.id,
          title: knowledgeCheck.title,
          publishStatus: knowledgeCheck.publishStatus,
        }
      : null,
  };
}

export async function createCourseAction(
  input: unknown
): Promise<
  | { ok: true; data: { id: string; [key: string]: unknown } }
  | { ok: false; fieldErrors: Record<string, string[]> }
> {
  await requireAdminOrInstructor();
  const result = createCourseSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, fieldErrors: result.error.flatten().fieldErrors };
  }
  const data = result.data;
  const db = getDb();
  const slug = await uniqueSlug(data.title, (s) => courseSlugExists(s));

  const [created] = await db
    .insert(courses)
    .values({
      title: data.title,
      description: data.description,
      slug,
      departmentId: data.departmentId,
      learningCategory: data.learningCategory,
      level: data.level,
      difficulty: data.difficulty,
      thumbnailUrl: data.thumbnailUrl || null,
      categoryId: data.categoryId || null,
      instructorId: data.instructorId || null,
      language: data.language,
      xpReward: data.xpReward,
      tags: data.tags,
      learningObjectives: data.learningObjectives,
      prerequisites: data.prerequisites,
      isTrending: data.isTrending,
      openToAll: data.openToAll ?? true,
      publishStatus: "draft",
    })
    .returning();

  revalidatePath("/dashboard/admin/courses");
  return { ok: true, data: created };
}

export async function updateCourseAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = updateCourseSchema.parse(input);
  const db = getDb();

  const [updated] = await db
    .update(courses)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
      ...(data.learningCategory !== undefined
        ? { learningCategory: data.learningCategory }
        : {}),
      ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl || null } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.instructorId !== undefined ? { instructorId: data.instructorId } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
      ...(data.xpReward !== undefined ? { xpReward: data.xpReward } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.learningObjectives !== undefined
        ? { learningObjectives: data.learningObjectives }
        : {}),
      ...(data.prerequisites !== undefined ? { prerequisites: data.prerequisites } : {}),
      ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
      ...(data.isTrending !== undefined ? { isTrending: data.isTrending } : {}),
      ...(data.openToAll !== undefined ? { openToAll: data.openToAll } : {}),
      ...(data.publishStatus !== undefined ? { publishStatus: data.publishStatus } : {}),
      updatedAt: new Date(),
    })
    .where(eq(courses.id, data.id))
    .returning();

  revalidatePath("/dashboard/admin/courses");
  revalidatePath(`/dashboard/admin/courses/${data.id}`);
  revalidatePath("/dashboard/courses");
  return updated;
}

export async function deleteCourseAction(id: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  await db.delete(courses).where(eq(courses.id, id));
  revalidatePath("/dashboard/admin/courses");
}

export async function setCourseStatusAction(
  id: string,
  publishStatus: "draft" | "review" | "published" | "archived"
) {
  return updateCourseAction({ id, publishStatus });
}

export async function publishCourseAction(id: string) {
  return setCourseStatusAction(id, "published");
}

export async function archiveCourseAction(id: string) {
  return setCourseStatusAction(id, "archived");
}

export async function createModuleAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = createModuleSchema.parse(input);
  const db = getDb();
  const existing = await db.select().from(modules).where(eq(modules.courseId, data.courseId));
  const orderIndex = existing.length;

  const [created] = await db
    .insert(modules)
    .values({
      courseId: data.courseId,
      title: data.title,
      description: data.description ?? null,
      orderIndex,
    })
    .returning();

  revalidatePath(`/dashboard/admin/courses/${data.courseId}`);
  return created;
}

export async function updateModuleAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = updateModuleSchema.parse(input);
  const db = getDb();
  const [updated] = await db
    .update(modules)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    })
    .where(eq(modules.id, data.id))
    .returning();

  const [mod] = await db.select().from(modules).where(eq(modules.id, data.id)).limit(1);
  if (mod) revalidatePath(`/dashboard/admin/courses/${mod.courseId}`);
  return updated;
}

export async function deleteModuleAction(id: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  const [mod] = await db.select().from(modules).where(eq(modules.id, id)).limit(1);
  await db.delete(modules).where(eq(modules.id, id));
  if (mod) revalidatePath(`/dashboard/admin/courses/${mod.courseId}`);
}

export async function createLessonAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = createLessonSchema.parse(input);
  const db = getDb();
  const existing = await db.select().from(lessons).where(eq(lessons.moduleId, data.moduleId));
  const orderIndex = existing.length;

  const [created] = await db
    .insert(lessons)
    .values({
      moduleId: data.moduleId,
      title: data.title,
      type: data.type,
      content: data.content ?? null,
      durationMinutes: data.durationMinutes,
      isPreview: data.isPreview,
      learningObjectives: data.learningObjectives,
      prerequisites: data.prerequisites,
      orderIndex,
    })
    .returning();

  const [mod] = await db.select().from(modules).where(eq(modules.id, data.moduleId)).limit(1);
  if (mod) revalidatePath(`/dashboard/admin/courses/${mod.courseId}`);
  return created;
}

export async function updateLessonAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = updateLessonSchema.parse(input);
  const db = getDb();
  const [updated] = await db
    .update(lessons)
    .set({
      ...(data.moduleId !== undefined ? { moduleId: data.moduleId } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
      ...(data.isPreview !== undefined ? { isPreview: data.isPreview } : {}),
      ...(data.learningObjectives !== undefined
        ? { learningObjectives: data.learningObjectives }
        : {}),
      ...(data.prerequisites !== undefined ? { prerequisites: data.prerequisites } : {}),
      updatedAt: new Date(),
    })
    .where(eq(lessons.id, data.id))
    .returning();

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, data.id)).limit(1);
  if (lesson) {
    const [mod] = await db.select().from(modules).where(eq(modules.id, lesson.moduleId)).limit(1);
    if (mod) revalidatePath(`/dashboard/admin/courses/${mod.courseId}`);
  }
  return updated;
}

export async function deleteLessonAction(id: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  await db.delete(lessons).where(eq(lessons.id, id));
  if (lesson) {
    const [mod] = await db.select().from(modules).where(eq(modules.id, lesson.moduleId)).limit(1);
    if (mod) revalidatePath(`/dashboard/admin/courses/${mod.courseId}`);
  }
}

export async function reorderModulesAction(courseId: string, input: unknown) {
  await requireAdminOrInstructor();
  const data = reorderSchema.parse(input);
  const db = getDb();
  await Promise.all(
    data.ids.map((id, index) =>
      db.update(modules).set({ orderIndex: index }).where(eq(modules.id, id))
    )
  );
  revalidatePath(`/dashboard/admin/courses/${courseId}`);
}

export async function reorderLessonsAction(moduleId: string, input: unknown) {
  await requireAdminOrInstructor();
  const data = reorderSchema.parse(input);
  const db = getDb();
  await Promise.all(
    data.ids.map((id, index) =>
      db.update(lessons).set({ orderIndex: index }).where(eq(lessons.id, id))
    )
  );
  const [mod] = await db.select().from(modules).where(eq(modules.id, moduleId)).limit(1);
  if (mod) revalidatePath(`/dashboard/admin/courses/${mod.courseId}`);
}

export async function addLessonResourceAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = addLessonResourceSchema.parse(input);
  const db = getDb();
  const [created] = await db
    .insert(lessonResources)
    .values({
      lessonId: data.lessonId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
    })
    .returning();

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, data.lessonId)).limit(1);
  if (lesson) {
    const [mod] = await db.select().from(modules).where(eq(modules.id, lesson.moduleId)).limit(1);
    if (mod) revalidatePath(`/dashboard/admin/courses/${mod.courseId}`);
  }
  return created;
}

export async function listMediaAssetsAction() {
  await requireAdminOrInstructor();
  const db = getDb();
  return db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
}

export async function createMediaAssetAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = createMediaAssetSchema.parse(input);
  const userId = await requireUserId();
  const db = getDb();
  const [created] = await db
    .insert(mediaAssets)
    .values({
      name: data.name,
      url: data.url,
      type: data.type,
      mimeType: data.mimeType ?? null,
      sizeBytes: data.sizeBytes ?? null,
      uploadedBy: userId,
    })
    .returning();
  revalidatePath("/dashboard/admin/media");
  return created;
}

export async function deleteMediaAssetAction(id: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  revalidatePath("/dashboard/admin/media");
}

// Keep instructors export available for admin UIs that list them
export async function listInstructorsAction() {
  await requireAdminOrInstructor();
  const db = getDb();
  return db.select().from(instructors).orderBy(asc(instructors.name));
}
