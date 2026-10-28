import { config } from "dotenv";
config({ path: ".env.local" });
import { and, eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { buildDepartmentCourseCatalog } from "@/db/catalog/department-courses";
import { courses, lessons, modules } from "@/db/schema";

/**
 * Re-sync catalog courses: department, level, slug, description, tags, thumbnail, lessons.
 * Matches by slug first, then by title + department so level merges can rename slugs.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));
  const catalog = buildDepartmentCourseCatalog();
  let synced = 0;

  for (const item of catalog) {
    const [existingBySlug] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.slug, item.slug))
      .limit(1);

    const [existingByTitle] = existingBySlug
      ? [existingBySlug]
      : await db
          .select({ id: courses.id })
          .from(courses)
          .where(
            and(eq(courses.title, item.title), eq(courses.departmentId, item.departmentId))
          )
          .limit(1);

    const existing = existingBySlug ?? existingByTitle;

    if (!existing) {
      console.warn(`Missing course (skip): ${item.slug}`);
      continue;
    }

    await db
      .update(courses)
      .set({
        slug: item.slug,
        title: item.title,
        description: item.description,
        departmentId: item.departmentId,
        level: item.level,
        difficulty: item.difficulty,
        durationMinutes: item.durationMinutes,
        xpReward: item.xpReward,
        tags: item.tags,
        thumbnailUrl: item.thumbnailUrl,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, existing.id));

    const existingModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, existing.id));

    for (const mod of existingModules) {
      await db.delete(lessons).where(eq(lessons.moduleId, mod.id));
    }
    await db.delete(modules).where(eq(modules.courseId, existing.id));

    const [mod] = await db
      .insert(modules)
      .values({
        courseId: existing.id,
        title: `${item.title} — Core Module`,
        orderIndex: 0,
        description: `Primary learning module for ${item.title} (${item.departmentId} / ${item.level}).`,
      })
      .returning();

    for (const [index, lesson] of item.lessons.entries()) {
      await db.insert(lessons).values({
        moduleId: mod.id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        durationMinutes: lesson.durationMinutes,
        orderIndex: index,
        isPreview: lesson.isPreview ?? index === 0,
        learningObjectives: lesson.learningObjectives ?? [],
      });
    }

    synced += 1;
    if (synced % 24 === 0) console.log(`Synced ${synced}/${catalog.length}…`);
  }

  console.log(`Done. Synced ${synced}/${catalog.length} catalog courses.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
