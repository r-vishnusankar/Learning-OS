import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { assessments, questions } from "@/db/schema";

config({ path: ".env.local" });

async function seedAssessments() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const db = drizzle(neon(databaseUrl));

  const existing = await db
    .select()
    .from(assessments)
    .where(eq(assessments.title, "System Design Fundamentals Exam"))
    .limit(1);

  if (existing.length) {
    console.log("Assessments already seeded");
    return;
  }

  const [assessment] = await db
    .insert(assessments)
    .values({
      title: "System Design Fundamentals Exam",
      description:
        "Validate CAP theorem, caching, and load balancing fundamentals for senior engineers.",
      departmentId: "development",
      level: "senior",
      type: "mixed",
      durationMinutes: 30,
      passingScore: 70,
      maxAttempts: 3,
      randomize: true,
      publishStatus: "published",
    })
    .returning();

  await db.insert(questions).values([
    {
      assessmentId: assessment.id,
      prompt: "Which consistency model does a strongly consistent distributed database typically guarantee?",
      type: "mcq",
      options: ["Eventual consistency", "Linearizability", "Causal consistency", "Session consistency"],
      correctAnswers: ["Linearizability"],
      points: 10,
      difficulty: "medium",
      skillTags: ["Distributed Systems"],
      bloomLevel: "understand",
      orderIndex: 0,
    },
    {
      assessmentId: assessment.id,
      prompt: "Select all valid strategies for reducing read latency in a high-traffic system:",
      type: "multi_select",
      options: [
        "CDN edge caching",
        "Database read replicas",
        "Single monolithic database",
        "Application-level caching",
      ],
      correctAnswers: ["CDN edge caching", "Database read replicas", "Application-level caching"],
      points: 15,
      difficulty: "medium",
      skillTags: ["Caching"],
      orderIndex: 1,
    },
    {
      assessmentId: assessment.id,
      prompt: "True or False: CAP theorem says you can always have Consistency, Availability, and Partition tolerance simultaneously.",
      type: "true_false",
      options: ["True", "False"],
      correctAnswers: ["False"],
      points: 5,
      difficulty: "easy",
      orderIndex: 2,
    },
    {
      assessmentId: assessment.id,
      prompt: "Name the algorithm commonly used for rate limiting that refills tokens over time (two words).",
      type: "fill_blank",
      options: [],
      correctAnswers: ["token bucket", "Token Bucket"],
      points: 10,
      difficulty: "hard",
      orderIndex: 3,
    },
    {
      assessmentId: assessment.id,
      prompt: "Briefly describe how you would design a URL shortener for 500M monthly active users.",
      type: "case_study",
      options: [],
      correctAnswers: [],
      points: 20,
      difficulty: "hard",
      bloomLevel: "create",
      orderIndex: 4,
    },
  ]);

  console.log("Seeded assessment:", assessment.id);
}

seedAssessments().catch((error) => {
  console.error(error);
  process.exit(1);
});
