import { config } from "dotenv";
config({ path: ".env.local" });
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { buildDepartmentCourseCatalog } from "@/db/catalog/department-courses";
import { isFirstDepartmentLevel } from "@/constants/navigation";
import {
  DEPARTMENT_INSTRUCTORS,
  instructorAvatar,
} from "@/db/catalog/department-instructors";
import { courses, instructors, lessons, modules } from "@/db/schema";
import type { DepartmentId } from "@/types";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));
  const catalog = buildDepartmentCourseCatalog();

  const instructorIds = new Map<string, string>();
  for (const profile of Object.values(DEPARTMENT_INSTRUCTORS)) {
    if (instructorIds.has(profile.name)) continue;

    const [existing] = await db
      .select()
      .from(instructors)
      .where(eq(instructors.name, profile.name))
      .limit(1);

    if (existing) {
      instructorIds.set(profile.name, existing.id);
      continue;
    }

    const [created] = await db
      .insert(instructors)
      .values({
        name: profile.name,
        avatar: instructorAvatar(profile.name),
        title: profile.title,
        bio: profile.bio,
      })
      .returning();
    instructorIds.set(profile.name, created.id);
  }

  let created = 0;
  let skipped = 0;

  for (const item of catalog) {
    const dept = item.departmentId as DepartmentId;
    const profile = DEPARTMENT_INSTRUCTORS[dept];
    const instructorId = instructorIds.get(profile.name) ?? null;

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
          .where(eq(courses.title, item.title))
          .limit(1);

    const existing = existingBySlug ?? existingByTitle;

    if (existing) {
      await db
        .update(courses)
        .set({
          slug: item.slug,
          title: item.title,
          description: item.description,
          thumbnailUrl: item.thumbnailUrl,
          instructorId,
          departmentId: item.departmentId,
          level: item.level,
          difficulty: item.difficulty,
          durationMinutes: item.durationMinutes,
          xpReward: item.xpReward,
          tags: item.tags,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, existing.id));
      skipped += 1;
      continue;
    }

    const [course] = await db
      .insert(courses)
      .values({
        slug: item.slug,
        title: item.title,
        description: item.description,
        thumbnailUrl: item.thumbnailUrl,
        departmentId: item.departmentId,
        instructorId,
        level: item.level,
        difficulty: item.difficulty,
        durationMinutes: item.durationMinutes,
        publishStatus: "published",
        xpReward: item.xpReward,
        tags: item.tags,
        enrolledCount: 40 + Math.floor(Math.random() * 400),
        rating: 44 + Math.floor(Math.random() * 6),
        isTrending: item.level === "intermediate" || item.level === "advanced",
        learningObjectives: [
          `Master core concepts of ${item.title}`,
          "Apply skills in a practice lab",
          "Build portfolio-ready evidence",
        ],
        prerequisites:
          isFirstDepartmentLevel(item.level, item.departmentId)
            ? ["None — open to all"]
            : [`Complete prior ${item.departmentId} level coursework`],
      })
      .returning();

    const [mod] = await db
      .insert(modules)
      .values({
        courseId: course.id,
        title: `${item.title} — Core Module`,
        orderIndex: 0,
        description: `Primary learning module for ${item.title}.`,
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
      });
    }

    created += 1;
    if (created % 20 === 0) {
      console.log(`Created ${created}/${catalog.length - skipped}…`);
    }
  }

  console.log(`Done. Created ${created}, skipped existing ${skipped}, catalog size ${catalog.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
