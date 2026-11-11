import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  categories,
  courses,
  instructors,
  lessons,
  modules,
} from "@/db/schema";
import { courseAssignments } from "@/db/schema/operations";
import { profiles } from "@/db/schema/auth";
import type { PublishStatus } from "@/db/schema/courses";
import type { Difficulty, LearningCategory, LearningLevel } from "@/types";
import { courseProgress } from "@/lib/course-progress";
import {
  getPassedAssessmentIds,
  getPublishedAssessmentsByCourseIds,
} from "@/db/queries/assessments";

/**
 * Returns a map of courseId → count of DISTINCT active learners
 * (users with a course_assignment whose profile.status = 'active').
 * Single query — no N+1 regardless of catalog size.
 */
export async function getActiveLearnerCountsByCourse(): Promise<Map<string, number>> {
  const db = getDb();
  const rows = await db
    .select({
      courseId: courseAssignments.courseId,
      count: sql<number>`count(distinct ${courseAssignments.userId})::int`,
    })
    .from(courseAssignments)
    .innerJoin(profiles, eq(profiles.userId, courseAssignments.userId))
    .where(eq(profiles.status, "active"))
    .groupBy(courseAssignments.courseId);

  return new Map(rows.map((r) => [r.courseId, r.count]));
}

export async function courseSlugExists(slug: string, excludeId?: string) {
  const db = getDb();
  const rows = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, slug)).limit(1);
  if (!rows.length) return false;
  if (excludeId && rows[0].id === excludeId) return false;
  return true;
}

export async function getAdminCourses(filters?: {
  search?: string;
  departmentId?: string;
  publishStatus?: PublishStatus;
  level?: LearningLevel;
  difficulty?: Difficulty;
  learningCategory?: LearningCategory;
}) {
  const db = getDb();
  const rows = await db
    .select({
      course: courses,
      instructor: instructors,
      category: categories,
    })
    .from(courses)
    .leftJoin(instructors, eq(courses.instructorId, instructors.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .orderBy(desc(courses.updatedAt));

  return rows.filter((row) => {
    if (filters?.departmentId && row.course.departmentId !== filters.departmentId) return false;
    if (filters?.publishStatus && row.course.publishStatus !== filters.publishStatus) return false;
    if (filters?.level && row.course.level !== filters.level) return false;
    if (filters?.difficulty && row.course.difficulty !== filters.difficulty) return false;
    if (filters?.learningCategory && row.course.learningCategory !== filters.learningCategory) {
      return false;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      return (
        row.course.title.toLowerCase().includes(q) ||
        row.course.description.toLowerCase().includes(q) ||
        row.course.slug.toLowerCase().includes(q) ||
        (row.course.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

export async function getPublishedCourses(userDepartmentId?: string) {
  const db = getDb();
  const rows = await db
    .select({
      course: courses,
      instructor: instructors,
    })
    .from(courses)
    .leftJoin(instructors, eq(courses.instructorId, instructors.id))
    .where(eq(courses.publishStatus, "published"))
    .orderBy(desc(courses.updatedAt));

  if (!userDepartmentId) return rows;

  // When a department is known: show openToAll courses + department-specific ones
  return rows.filter(
    (r) => r.course.openToAll || r.course.departmentId === userDepartmentId
  );
}

export async function getCourseById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      course: courses,
      instructor: instructors,
      category: categories,
    })
    .from(courses)
    .leftJoin(instructors, eq(courses.instructorId, instructors.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.id, id))
    .limit(1);
  return row ?? null;
}

export async function getCourseBySlug(slug: string) {
  const db = getDb();
  const [row] = await db
    .select({
      course: courses,
      instructor: instructors,
      category: categories,
    })
    .from(courses)
    .leftJoin(instructors, eq(courses.instructorId, instructors.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getCourseModulesWithLessons(courseId: string) {
  const db = getDb();
  const moduleRows = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.orderIndex));

  if (!moduleRows.length) return [];

  const moduleIds = moduleRows.map((m) => m.id);
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(inArray(lessons.moduleId, moduleIds))
    .orderBy(asc(lessons.orderIndex));

  return moduleRows.map((mod) => ({
    ...mod,
    lessons: lessonRows.filter((l) => l.moduleId === mod.id),
  }));
}

export async function getLessonById(lessonId: string) {
  const db = getDb();
  const [row] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  return row ?? null;
}

export async function getLessonWithContext(lessonId: string) {
  const db = getDb();
  const lesson = await getLessonById(lessonId);
  if (!lesson) return null;

  const [mod] = await db.select().from(modules).where(eq(modules.id, lesson.moduleId)).limit(1);
  if (!mod) return null;

  const course = await getCourseById(mod.courseId);
  if (!course) return null;

  return { lesson, module: mod, course: course.course, instructor: course.instructor };
}

export async function countCourseLessons(courseId: string) {
  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(eq(modules.courseId, courseId));
  return result?.count ?? 0;
}

/** Batch lesson counts for many courses (1 query). */
export async function countLessonsForCourses(courseIds: string[]) {
  const map = new Map<string, number>();
  if (!courseIds.length) return map;
  for (const id of courseIds) map.set(id, 0);

  const db = getDb();
  const rows = await db
    .select({
      courseId: modules.courseId,
      count: sql<number>`count(*)::int`,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(inArray(modules.courseId, courseIds))
    .groupBy(modules.courseId);

  for (const row of rows) {
    map.set(row.courseId, row.count ?? 0);
  }
  return map;
}

export async function getCourseProgressForUser(userId: string, courseId: string) {
  const db = getDb();
  const lessonRows = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(eq(modules.courseId, courseId));

  const { lessonProgress } = await import("@/db/schema");
  const lessonIds = lessonRows.map((l) => l.id);
  const progressRows =
    lessonIds.length === 0
      ? []
      : await db
          .select({
            lessonId: lessonProgress.lessonId,
            completed: lessonProgress.completed,
            percentage: lessonProgress.percentage,
            lastViewedAt: lessonProgress.lastViewedAt,
          })
          .from(lessonProgress)
          .where(
            and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, lessonIds))
          );

  const completedLessonIds = progressRows.filter((r) => r.completed).map((r) => r.lessonId);
  const startedLessonIds = progressRows
    .filter(
      (r) =>
        !r.completed && ((r.percentage ?? 0) > 0 || r.lastViewedAt != null)
    )
    .map((r) => r.lessonId);
  const resumeLessonId =
    progressRows
      .filter(
        (r) =>
          !r.completed && ((r.percentage ?? 0) > 0 || r.lastViewedAt != null)
      )
      .sort((a, b) => {
        const aTs = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
        const bTs = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
        return bTs - aTs;
      })[0]?.lessonId ?? null;

  const assessmentByCourse = await getPublishedAssessmentsByCourseIds([courseId]);
  const assessment = assessmentByCourse.get(courseId);
  const passed = assessment
    ? (await getPassedAssessmentIds(userId, [assessment.id])).has(assessment.id)
    : false;

  const engine = courseProgress({
    lessons: lessonRows,
    completedLessonIds,
    startedLessonIds,
    resumeLessonId,
    assessment: assessment
      ? { id: assessment.id, required: true, passed }
      : null,
  });

  return {
    ...engine,
    assessmentId: assessment?.id ?? null,
    assessmentPassed: passed,
  };
}

export async function getCourseProgressPercent(userId: string, courseId: string) {
  return (await getCourseProgressForUser(userId, courseId)).percent;
}

export async function getUserLessonProgress(userId: string, lessonIds: string[]) {
  if (!lessonIds.length) return [];
  const db = getDb();
  const { lessonProgress } = await import("@/db/schema");
  return db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, lessonIds)));
}

export async function getInstructors() {
  const db = getDb();
  return db.select().from(instructors).orderBy(asc(instructors.name));
}

export async function getCategories() {
  const db = getDb();
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getContinueLearning(userId: string, limit = 4) {
  const db = getDb();
  const { lessonProgress } = await import("@/db/schema");

  const recent = await db
    .select({
      progress: lessonProgress,
      lesson: lessons,
      module: modules,
      course: courses,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(and(eq(lessonProgress.userId, userId), eq(courses.publishStatus, "published")))
    .orderBy(desc(lessonProgress.lastViewedAt))
    .limit(limit);

  return recent;
}

/** Batch: modules + lessons for many courses (2 queries). */
export async function getModulesWithLessonsForCourses(courseIds: string[]) {
  if (!courseIds.length) {
    return new Map<string, Awaited<ReturnType<typeof getCourseModulesWithLessons>>>();
  }

  const db = getDb();
  const moduleRows = await db
    .select()
    .from(modules)
    .where(inArray(modules.courseId, courseIds))
    .orderBy(asc(modules.orderIndex));

  const moduleIds = moduleRows.map((m) => m.id);
  const lessonRows =
    moduleIds.length === 0
      ? []
      : await db
          .select({
            id: lessons.id,
            moduleId: lessons.moduleId,
            title: lessons.title,
            type: lessons.type,
            durationMinutes: lessons.durationMinutes,
            orderIndex: lessons.orderIndex,
            isPreview: lessons.isPreview,
          })
          .from(lessons)
          .where(inArray(lessons.moduleId, moduleIds))
          .orderBy(asc(lessons.orderIndex));

  const lessonsByModule = new Map<string, typeof lessonRows>();
  for (const lesson of lessonRows) {
    const list = lessonsByModule.get(lesson.moduleId) ?? [];
    list.push(lesson);
    lessonsByModule.set(lesson.moduleId, list);
  }

  const byCourse = new Map<
    string,
    Array<(typeof moduleRows)[number] & { lessons: typeof lessonRows }>
  >();
  for (const mod of moduleRows) {
    const entry = {
      ...mod,
      lessons: lessonsByModule.get(mod.id) ?? [],
    };
    const list = byCourse.get(mod.courseId) ?? [];
    list.push(entry);
    byCourse.set(mod.courseId, list);
  }

  for (const id of courseIds) {
    if (!byCourse.has(id)) byCourse.set(id, []);
  }

  return byCourse;
}

/** Completed lesson ids for a user (one query). */
export async function getUserCompletedLessonIdSet(userId: string) {
  const db = getDb();
  const { lessonProgress } = await import("@/db/schema");
  const rows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.completed, true)));
  return new Set(rows.map((r) => r.lessonId));
}

/** All lesson progress rows for a user (one query). */
export async function getUserLessonProgressMap(userId: string) {
  const db = getDb();
  const { lessonProgress } = await import("@/db/schema");
  const rows = await db
    .select({
      lessonId: lessonProgress.lessonId,
      completed: lessonProgress.completed,
      percentage: lessonProgress.percentage,
      lastViewedAt: lessonProgress.lastViewedAt,
    })
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId));
  return new Map(rows.map((r) => [r.lessonId, r]));
}

/** Published course ids the user has progress on (recent first). */
export async function getUserActiveCourseIds(userId: string, limit = 12) {
  const db = getDb();
  const { lessonProgress } = await import("@/db/schema");

  const rows = await db
    .select({
      courseId: modules.courseId,
      lastViewedAt: lessonProgress.lastViewedAt,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(and(eq(lessonProgress.userId, userId), eq(courses.publishStatus, "published")))
    .orderBy(desc(lessonProgress.lastViewedAt))
    .limit(Math.max(limit * 4, 40));

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const row of rows) {
    if (seen.has(row.courseId)) continue;
    seen.add(row.courseId);
    ids.push(row.courseId);
    if (ids.length >= limit) break;
  }
  return ids;
}

export async function getPublishedCoursesByIds(courseIds: string[]) {
  if (!courseIds.length) return [];
  const db = getDb();
  const rows = await db
    .select({
      course: courses,
      instructor: instructors,
    })
    .from(courses)
    .leftJoin(instructors, eq(courses.instructorId, instructors.id))
    .where(and(eq(courses.publishStatus, "published"), inArray(courses.id, courseIds)));

  const order = new Map(courseIds.map((id, i) => [id, i]));
  return rows.sort(
    (a, b) => (order.get(a.course.id) ?? 0) - (order.get(b.course.id) ?? 0)
  );
}
