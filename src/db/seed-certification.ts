import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  assessments,
  certificates,
  courses,
  homeworkAssignments,
  learningPaths,
  pathSteps,
  users,
} from "@/db/schema";
import { generateCredentialId } from "@/lib/credentials";

config({ path: ".env.local" });

async function seedCertification() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const db = drizzle(neon(databaseUrl));

  const existingPath = await db
    .select()
    .from(learningPaths)
    .where(eq(learningPaths.title, "Senior Systems Engineer Track"))
    .limit(1);

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, "system-design-mastery"))
    .limit(1);

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.title, "System Design Fundamentals Exam"))
    .limit(1);

  let pathId = existingPath[0]?.id;

  if (!pathId) {
    const [path] = await db
      .insert(learningPaths)
      .values({
        title: "Senior Systems Engineer Track",
        description:
          "Progress from system design fundamentals through assessment to a verifiable Skillrr certificate.",
        departmentId: "development",
        level: "senior",
        thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
        skills: ["System Design", "Caching", "Distributed Systems"],
        durationMinutes: 24 * 60,
        enrolledCount: 128,
        publishStatus: "published",
        certificateTitle: "Senior Systems Engineer Certificate",
      })
      .returning();
    pathId = path.id;

    await db.insert(pathSteps).values([
      {
        pathId,
        title: "System Design Mastery",
        stepType: "course",
        courseId: course?.id ?? null,
        orderIndex: 0,
      },
      {
        pathId,
        title: "System Design Fundamentals Exam",
        stepType: "assessment",
        assessmentId: assessment?.id ?? null,
        orderIndex: 1,
      },
      {
        pathId,
        title: "Final Certification Gate",
        stepType: "assessment",
        assessmentId: assessment?.id ?? null,
        orderIndex: 2,
      },
    ]);
    console.log("Seeded learning path:", pathId);
  } else {
    console.log("Learning path already seeded");
  }

  const existingAssignment = await db
    .select()
    .from(homeworkAssignments)
    .where(eq(homeworkAssignments.title, "Design a URL Shortener"))
    .limit(1);

  if (!existingAssignment.length) {
    await db.insert(homeworkAssignments).values({
      title: "Design a URL Shortener",
      description:
        "Submit a short architecture write-up covering API design, storage, and scaling for a URL shortener. Include a GitHub link if available.",
      courseId: course?.id ?? null,
      maxScore: 100,
      dueDate: new Date(Date.now() + 14 * 86400000),
      submissionType: "github",
      publishStatus: "published",
    });
    console.log("Seeded assignment");
  } else {
    console.log("Assignment already seeded");
  }

  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "demo@nexus.local"))
    .limit(1);

  if (demoUser) {
    const existingCert = await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, demoUser.id))
      .limit(1);

    if (!existingCert.length) {
      await db.insert(certificates).values({
        userId: demoUser.id,
        credentialId: generateCredentialId(),
        title: "System Design Fundamentals Certificate",
        departmentId: "development",
        level: "senior",
        status: "earned",
        courseId: course?.id ?? null,
        assessmentId: assessment?.id ?? null,
        pathId: pathId ?? null,
        score: 92,
        skills: ["System Design", "Caching", "CAP Theorem"],
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 2 * 86400000),
      });
      console.log("Seeded demo certificate");
    } else {
      console.log("Demo certificate already seeded");
    }
  }

  console.log("Certification seed complete");
}

seedCertification().catch((error) => {
  console.error(error);
  process.exit(1);
});
