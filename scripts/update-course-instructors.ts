import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  DEPARTMENT_INSTRUCTORS,
  instructorAvatar,
} from "@/db/catalog/department-instructors";
import { courses, instructors } from "@/db/schema";
import type { DepartmentId } from "@/types";

/** Upsert Skillrr department instructors and attach them to courses. */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));
  const instructorIds = new Map<string, string>();

  for (const profile of Object.values(DEPARTMENT_INSTRUCTORS)) {
    if (instructorIds.has(profile.name)) continue;

    const [existing] = await db
      .select()
      .from(instructors)
      .where(eq(instructors.name, profile.name))
      .limit(1);

    if (existing) {
      await db
        .update(instructors)
        .set({
          title: profile.title,
          bio: profile.bio,
          avatar: instructorAvatar(profile.name),
        })
        .where(eq(instructors.id, existing.id));
      instructorIds.set(profile.name, existing.id);
      console.log(`Updated instructor: ${profile.name}`);
      continue;
    }

    const [created] = await db
      .insert(instructors)
      .values({
        name: profile.name,
        title: profile.title,
        bio: profile.bio,
        avatar: instructorAvatar(profile.name),
      })
      .returning();

    instructorIds.set(profile.name, created.id);
    console.log(`Created instructor: ${profile.name}`);
  }

  let updatedCourses = 0;
  let skipped = 0;

  const allCourses = await db
    .select({ id: courses.id, departmentId: courses.departmentId, title: courses.title })
    .from(courses);

  for (const course of allCourses) {
    const dept = course.departmentId as DepartmentId | null;
    if (!dept || !(dept in DEPARTMENT_INSTRUCTORS)) {
      skipped += 1;
      continue;
    }

    const profile = DEPARTMENT_INSTRUCTORS[dept];
    const instructorId = instructorIds.get(profile.name);
    if (!instructorId) {
      skipped += 1;
      continue;
    }

    await db
      .update(courses)
      .set({ instructorId, updatedAt: new Date() })
      .where(eq(courses.id, course.id));
    updatedCourses += 1;
  }

  console.log(`Assigned instructors on ${updatedCourses} courses (${skipped} skipped)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
