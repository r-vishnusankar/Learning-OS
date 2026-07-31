/**
 * Seeds published "0–1 Year Journey" learning paths for every department.
 * Steps = each beginner course + its linked knowledge-check assessment.
 * Auto-enrolls active employees with experienceYears <= 1 (or beginner level).
 *
 * Run: npm run db:seed-beginner-paths
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { and, asc, eq, lte, or, sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { DEPARTMENT_LABELS } from "@/constants/navigation";
import {
  assessments,
  courses,
  learningPaths,
  notifications,
  pathEnrollments,
  pathSteps,
  profiles,
} from "@/db/schema";
import type { DepartmentId } from "@/types";

const DEPARTMENTS = Object.keys(DEPARTMENT_LABELS) as DepartmentId[];

function pathTitle(dept: DepartmentId) {
  return `0–1 Year Journey — ${DEPARTMENT_LABELS[dept]}`;
}

function pathDescription(dept: DepartmentId) {
  return (
    `Onboarding track for early-career ${DEPARTMENT_LABELS[dept]} teammates (0–1 years). ` +
    `Complete the beginner courses and pass each knowledge check to build a solid foundation. ` +
    `These steps align with your mandatory beginner assignments and support promotion readiness.`
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));
  let pathsCreated = 0;
  let pathsUpdated = 0;
  let enrollments = 0;

  for (const dept of DEPARTMENTS) {
    const title = pathTitle(dept);

    const beginnerCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        durationMinutes: courses.durationMinutes,
      })
      .from(courses)
      .where(
        and(
          eq(courses.departmentId, dept),
          eq(courses.level, "beginner"),
          eq(courses.publishStatus, "published")
        )
      )
      .orderBy(asc(courses.title));

    if (beginnerCourses.length === 0) {
      console.warn(`Skip ${dept}: no published beginner courses`);
      continue;
    }

    const durationMinutes = beginnerCourses.reduce((s, c) => s + (c.durationMinutes || 0), 0);
    const skills = [
      "Foundations",
      "0-1 Year",
      DEPARTMENT_LABELS[dept],
      ...beginnerCourses.slice(0, 3).map((c) => c.title.split(" ")[0]),
    ];

    const [existing] = await db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.title, title))
      .limit(1);

    let pathId = existing?.id;

    if (!pathId) {
      const [created] = await db
        .insert(learningPaths)
        .values({
          title,
          description: pathDescription(dept),
          departmentId: dept,
          level: "beginner",
          thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(`path-0-1-${dept}`)}/800/450`,
          skills,
          durationMinutes,
          enrolledCount: 0,
          publishStatus: "published",
          certificateTitle: `${DEPARTMENT_LABELS[dept]} Foundations Certificate (0–1 Year)`,
        })
        .returning();
      pathId = created.id;
      pathsCreated += 1;
    } else {
      await db
        .update(learningPaths)
        .set({
          description: pathDescription(dept),
          level: "beginner",
          skills,
          durationMinutes,
          publishStatus: "published",
          certificateTitle: `${DEPARTMENT_LABELS[dept]} Foundations Certificate (0–1 Year)`,
          updatedAt: new Date(),
        })
        .where(eq(learningPaths.id, pathId));
      await db.delete(pathSteps).where(eq(pathSteps.pathId, pathId));
      pathsUpdated += 1;
    }

    let orderIndex = 0;
    for (const course of beginnerCourses) {
      await db.insert(pathSteps).values({
        pathId,
        title: course.title,
        stepType: "course",
        courseId: course.id,
        orderIndex: orderIndex++,
      });

      const [assessment] = await db
        .select({ id: assessments.id, title: assessments.title })
        .from(assessments)
        .where(
          and(eq(assessments.courseId, course.id), eq(assessments.publishStatus, "published"))
        )
        .limit(1);

      if (assessment) {
        await db.insert(pathSteps).values({
          pathId,
          title: assessment.title,
          stepType: "assessment",
          assessmentId: assessment.id,
          orderIndex: orderIndex++,
        });
      }
    }

    // Enroll 0–1 year / beginner learners in this department
    const candidates = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(
        and(
          eq(profiles.status, "active"),
          eq(profiles.department, dept),
          or(lte(profiles.experienceYears, 1), eq(profiles.level, "beginner"))
        )
      );

    for (const person of candidates) {
      const [already] = await db
        .select({ id: pathEnrollments.id })
        .from(pathEnrollments)
        .where(
          and(eq(pathEnrollments.pathId, pathId), eq(pathEnrollments.userId, person.userId))
        )
        .limit(1);

      if (already) continue;

      await db.insert(pathEnrollments).values({
        pathId,
        userId: person.userId,
        progress: 0,
      });
      enrollments += 1;

      await db.insert(notifications).values({
        userId: person.userId,
        title: "0–1 Year Journey assigned",
        message: `You were enrolled in ${title}. Complete the beginner courses and knowledge checks.`,
        type: "info",
        href: `/dashboard/paths/${pathId}`,
        read: 0,
      });
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pathEnrollments)
      .where(eq(pathEnrollments.pathId, pathId));

    await db
      .update(learningPaths)
      .set({ enrolledCount: count, updatedAt: new Date() })
      .where(eq(learningPaths.id, pathId));

    console.log(
      `${dept}: path ready · ${beginnerCourses.length} courses · ${orderIndex} steps · ${count} enrolled`
    );
  }

  console.log(
    `Done. created=${pathsCreated} updated=${pathsUpdated} newEnrollments=${enrollments}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
