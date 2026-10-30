/**
 * P13: no longer writes generic question banks.
 *
 * Existing assessments are left untouched (attempts reference question ids).
 * Courses with no assessment are skipped — create a draft in Admin Builder
 * (or course builder Knowledge check) and write real questions there.
 *
 * Default is --dry-run. --apply also writes nothing; it only prints the skip report.
 *
 *   npx tsx scripts/seed-course-assessments.ts
 *   npx tsx scripts/seed-course-assessments.ts --apply
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { assessments, courses } from "@/db/schema";

async function main() {
  const apply = process.argv.includes("--apply");
  const mode = apply ? "apply" : "dry-run";

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));

  const published = await db
    .select({
      id: courses.id,
      title: courses.title,
    })
    .from(courses)
    .where(eq(courses.publishStatus, "published"));

  const existing = await db
    .select({
      id: assessments.id,
      courseId: assessments.courseId,
    })
    .from(assessments);

  const assessmentByCourse = new Map(
    existing.filter((a) => a.courseId).map((a) => [a.courseId as string, a.id])
  );

  let skippedExisting = 0;
  let skippedNoAssessment = 0;

  for (const course of published) {
    if (assessmentByCourse.has(course.id)) {
      skippedExisting += 1;
    } else {
      skippedNoAssessment += 1;
    }
  }

  console.log(
    `Course assessments [${mode}]: courses=${published.length} · skipped existing=${skippedExisting} · skipped no assessment=${skippedNoAssessment} · writes=0 (P13: seed does not insert, update, or delete questions)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
