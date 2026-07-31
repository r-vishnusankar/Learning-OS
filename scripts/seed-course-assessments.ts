/**
 * Creates / refreshes one published assessment (+ topic-aligned questions)
 * per published course. Re-run safe: updates Knowledge Check question banks.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, like } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getTopicLearningPoints } from "@/db/catalog/lesson-content";
import { assessments, courses, questions } from "@/db/schema";
import type { DepartmentId } from "@/types";

function buildQuestionBank(course: {
  title: string;
  departmentId: string;
  level: string;
  slug: string;
}) {
  const points = getTopicLearningPoints(
    course.title,
    course.departmentId as DepartmentId
  );
  const conceptA = points[0] ?? `Core idea of ${course.title}`;
  const conceptB = points[1] ?? `Applied practice for ${course.title}`;
  const distractor = `Ignore ${course.title} and skip documentation entirely`;

  return [
    {
      prompt: `Which statement best reflects a core concept of "${course.title}"?`,
      type: "mcq" as const,
      options: [conceptA, distractor, "Memorize trivia unrelated to the course", "Skip the practice lab"],
      correctAnswers: [conceptA],
    },
    {
      prompt: `True or false: Completing lessons alone (without passing this knowledge check) is enough to certify "${course.title}" for promotion eligibility.`,
      type: "true_false" as const,
      options: ["True", "False"],
      correctAnswers: ["False"],
    },
    {
      prompt: `Which focus area belongs to "${course.title}"?`,
      type: "mcq" as const,
      options: [
        conceptB,
        "Unrelated department onboarding trivia",
        "Deleting all documentation",
        "Avoiding peer feedback forever",
      ],
      correctAnswers: [conceptB],
    },
    {
      prompt: `True or false: This assessment is the knowledge check for the course "${course.title}".`,
      type: "true_false" as const,
      options: ["True", "False"],
      correctAnswers: ["True"],
    },
    {
      prompt: `After you pass the "${course.title}" knowledge check, what happens in the career loop?`,
      type: "mcq" as const,
      options: [
        "This course counts toward level certification / promotion eligibility",
        "Progress is discarded",
        "You must repeat all lessons immediately",
        "Nothing — assessments stay optional forever",
      ],
      correctAnswers: [
        "This course counts toward level certification / promotion eligibility",
      ],
    },
  ];
}

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

  let created = 0;
  let refreshed = 0;

  for (const course of published) {
    const existing = await db
      .select()
      .from(assessments)
      .where(eq(assessments.courseId, course.id))
      .limit(1);

    let assessmentId = existing[0]?.id;

    if (!assessmentId) {
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
      assessmentId = assessment.id;
      created += 1;
    } else {
      await db
        .update(assessments)
        .set({
          title: `${course.title} — Knowledge Check`,
          description: `Validate mastery of ${course.title}. Pass to certify this course for promotion eligibility.`,
          departmentId: course.departmentId,
          level: course.level,
          updatedAt: new Date(),
        })
        .where(eq(assessments.id, assessmentId));
      await db.delete(questions).where(eq(questions.assessmentId, assessmentId));
      refreshed += 1;
    }

    const bank = buildQuestionBank(course);
    await db.insert(questions).values(
      bank.map((q, orderIndex) => ({
        assessmentId: assessmentId!,
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
  }

  // Clean orphan knowledge checks no longer linked (optional safety)
  const orphans = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(like(assessments.title, "%— Knowledge Check"));

  console.log(
    `Course assessments: courses=${published.length} · created=${created} · refreshed=${refreshed} · knowledgeChecks=${orphans.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
