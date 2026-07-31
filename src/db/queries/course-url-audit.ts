import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { buildDepartmentCourseCatalog } from "@/db/catalog/department-courses";
import {
  buildCourseUrlAudit,
  type CourseUrlAuditResult,
  type DbCourseAuditSnapshot,
} from "@/lib/course-url-audit";
import { courses, lessons, modules } from "@/db/schema";

/** Load all courses with first video lesson content for audit. */
export async function loadDbCoursesForUrlAudit(): Promise<DbCourseAuditSnapshot[]> {
  const db = getDb();
  const courseRows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      departmentId: courses.departmentId,
      level: courses.level,
    })
    .from(courses)
    .orderBy(asc(courses.slug));

  const snapshots: DbCourseAuditSnapshot[] = [];

  for (const course of courseRows) {
    const lessonRows = await db
      .select({
        content: lessons.content,
        type: lessons.type,
      })
      .from(lessons)
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .where(eq(modules.courseId, course.id))
      .orderBy(asc(modules.orderIndex), asc(lessons.orderIndex));

    const firstVideoLesson = lessonRows.find((l) => l.type === "video");

    snapshots.push({
      id: course.id,
      slug: course.slug,
      title: course.title,
      departmentId: course.departmentId,
      level: course.level,
      introVideoContent: firstVideoLesson?.content ?? null,
    });
  }

  return snapshots;
}

export async function runCourseUrlAudit(): Promise<CourseUrlAuditResult> {
  const catalog = buildDepartmentCourseCatalog();
  const dbCourses = await loadDbCoursesForUrlAudit();
  return buildCourseUrlAudit(catalog, dbCourses);
}
