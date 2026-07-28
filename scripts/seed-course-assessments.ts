/**
 * Creates one published assessment (+ auto-scored questions) per published course
 * that does not already have a linked assessment.
 * Revert: npm run db:revert-career-loop
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, isNotNull } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { assessments, courses, questions } from "@/db/schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));

  const published = await db
    .select({
      id: courses.id,
      title: courses.title,
      departmentId: courses.departmentId,
      level: courses.level,
      slug: courses.slug,
    })
    .from(courses)
    .where(eq(courses.publishStatus, "published"));

  const linked = await db
    .select({ courseId: assessments.courseId })
    .from(assessments)
    .where(isNotNull(assessments.courseId));

  const linkedSet = new Set(linked.map((r) => r.courseId).filter(Boolean) as string[]);

  let created = 0;
  let skipped = 0;

  for (const course of published) {
    if (linkedSet.has(course.id)) {
      skipped += 1;
      continue;
    }

    const [assessment] = await db
      .insert(assessments)
      .values({
        title: `${course.title} — Knowledge Check`,
        description: `Validate mastery of ${course.title}. Pass to certify this course for promotion eligibility.`,
        courseId: course.id,
        departmentId: course.departmentId,
        level: course.level,
        type: "mcq",
        durationMinutes: 20,
        passingScore: 70,
        maxAttempts: 3,
        negativeMarking: false,
        randomize: true,
        publishStatus: "published",
      })
      .returning();

    const bank = [
      {
        prompt: `What is the primary learning outcome of "${course.title}"?`,
        type: "mcq" as const,
        options: [
          "Apply the course skills in a real work context",
          "Memorize unrelated trivia",
          "Skip practice labs",
          "Avoid documentation",
        ],
        correctAnswers: ["Apply the course skills in a real work context"],
      },
      {
        prompt: `True or false: Completing lessons alone is enough to certify "${course.title}" for promotion eligibility.`,
        type: "true_false" as const,
        options: ["True", "False"],
        correctAnswers: ["False"],
      },
      {
        prompt: `Which practice best reinforces ${course.level}-level skills from this course?`,
        type: "mcq" as const,
        options: [
          "Hands-on lab with a clear deliverable",
          "Ignoring feedback",
          "Copying answers without understanding",
          "Skipping assessments",
        ],
        correctAnswers: ["Hands-on lab with a clear deliverable"],
      },
      {
        prompt: `True or false: This assessment is linked to the course "${course.title}".`,
        type: "true_false" as const,
        options: ["True", "False"],
        correctAnswers: ["True"],
      },
      {
        prompt: `After passing this knowledge check, what happens next in the career loop?`,
        type: "mcq" as const,
        options: [
          "Course counts toward level certification / promotion eligibility",
          "Progress is discarded",
          "You must repeat all lessons immediately",
          "Nothing — assessments are optional forever",
        ],
        correctAnswers: [
          "Course counts toward level certification / promotion eligibility",
        ],
      },
    ];

    await db.insert(questions).values(
      bank.map((q, orderIndex) => ({
        assessmentId: assessment.id,
        prompt: q.prompt,
        type: q.type,
        options: q.options,
        correctAnswers: q.correctAnswers,
        points: 10,
        difficulty: "medium",
        skillTags: [course.departmentId, course.level, course.slug],
        bloomLevel: "understand",
        timeEstimateSeconds: 60,
        orderIndex,
      }))
    );

    created += 1;
  }

  console.log(
    `Course assessments: courses=${published.length} · created=${created} · skipped(existing)=${skipped}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
