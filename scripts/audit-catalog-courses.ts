import { config } from "dotenv";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { buildDepartmentCourseCatalog } from "../src/db/catalog/department-courses";
import { courses, lessons, modules } from "../src/db/schema";
import {
  buildCourseUrlAudit,
  formatCourseUrlAuditMarkdown,
  type DbCourseAuditSnapshot,
} from "../src/lib/course-url-audit";

config({ path: ".env.local" });

async function loadDbSnapshots(databaseUrl: string): Promise<DbCourseAuditSnapshot[]> {
  const db = drizzle(neon(databaseUrl));
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

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const catalog = buildDepartmentCourseCatalog();
  const dbCourses = await loadDbSnapshots(databaseUrl);
  const result = buildCourseUrlAudit(catalog, dbCourses);

  const md = formatCourseUrlAuditMarkdown(result);
  const outPath = join(process.cwd(), "docs", "COURSE_URL_AUDIT.md");
  writeFileSync(outPath, md, "utf8");

  console.log("Course URL + Video Audit");
  console.log(`  Total: ${result.summary.total}`);
  console.log(`  Overall Pass: ${result.summary.overallPass}`);
  console.log(`  Overall Fail: ${result.summary.overallFail}`);
  console.log(`  URL Fail: ${result.summary.urlFail}`);
  console.log(`  Video Fail: ${result.summary.videoFail}`);
  console.log(`  Missing in DB: ${result.summary.missingInDb}`);
  console.log(`  Duplicate slugs: ${result.summary.duplicateSlugs.length}`);
  console.log(`  Shared-video warnings: ${result.summary.sharedVideoWarnings.length}`);
  console.log(`  Report: ${outPath}`);

  if (result.summary.overallFail > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
