/**
 * Assigns published courses matching each active user's department + level.
 * source = "rule". Idempotent via unique (course_id, user_id).
 * Revert: npm run db:revert-career-loop
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { and, eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { courseAssignments, courses, notifications, profiles, users } from "@/db/schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));

  const active = await db
    .select({
      userId: profiles.userId,
      department: profiles.department,
      level: profiles.level,
      name: users.name,
      email: users.email,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.status, "active"));

  let inserted = 0;
  let skipped = 0;

  for (const person of active) {
    const matching = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
      })
      .from(courses)
      .where(
        and(
          eq(courses.departmentId, person.department),
          eq(courses.level, person.level),
          eq(courses.publishStatus, "published")
        )
      );

    for (const course of matching) {
      const [existing] = await db
        .select({ id: courseAssignments.id })
        .from(courseAssignments)
        .where(
          and(
            eq(courseAssignments.courseId, course.id),
            eq(courseAssignments.userId, person.userId)
          )
        )
        .limit(1);

      if (existing) {
        skipped += 1;
        continue;
      }

      await db.insert(courseAssignments).values({
        courseId: course.id,
        userId: person.userId,
        departmentId: person.department,
        scope: "user",
        mandatory: true,
        source: "rule",
      });
      inserted += 1;

      await db.insert(notifications).values({
        userId: person.userId,
        title: "Mandatory course assigned",
        message: `${course.title} was assigned for your ${person.level} learning track.`,
        type: "warning",
        href: `/dashboard/courses/${course.slug}`,
        read: 0,
      });
    }
  }

  console.log(
    `Level course assign: users=${active.length} · inserted=${inserted} · skipped=${skipped}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
