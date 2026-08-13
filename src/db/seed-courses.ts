import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  DEPARTMENT_INSTRUCTORS,
  instructorAvatar,
} from "@/db/catalog/department-instructors";
import { courses, instructors, lessons, modules, profiles, users } from "@/db/schema";

config({ path: ".env.local" });

const mockTypeMap = {
  video: "video" as const,
  reading: "article" as const,
  lab: "external_link" as const,
  quiz: "article" as const,
};

async function seedCourses() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));

  const demoEmail = (process.env.DEV_LOGIN_EMAIL ?? "vishnu.sankar@valoriz.com").toLowerCase();
  let demoUser = await db.select().from(users).where(eq(users.email, demoEmail)).limit(1);
  if (!demoUser[0]) {
    demoUser = await db.select().from(users).where(eq(users.email, "demo@nexus.local")).limit(1);
  }
  if (demoUser[0]) {
    await db
      .update(profiles)
      .set({ role: "admin" })
      .where(eq(profiles.userId, demoUser[0].id));
  }

  const developmentFaculty = DEPARTMENT_INSTRUCTORS.development;
  const [existingInstructor] = await db
    .select()
    .from(instructors)
    .where(eq(instructors.name, developmentFaculty.name))
    .limit(1);
  let instructorId = existingInstructor?.id;

  if (!instructorId) {
    const [created] = await db
      .insert(instructors)
      .values({
        name: developmentFaculty.name,
        avatar: instructorAvatar(developmentFaculty.name),
        title: developmentFaculty.title,
        bio: developmentFaculty.bio,
      })
      .returning();
    instructorId = created.id;
  }

  const existingCourse = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, "system-design-mastery"))
    .limit(1);

  if (existingCourse.length) {
    console.log("Courses already seeded");
    return;
  }

  const [course] = await db
    .insert(courses)
    .values({
      slug: "system-design-mastery",
      title: "System Design Mastery",
      description:
        "Design scalable distributed systems used by millions of users. Cover CAP, consistency models, caching, and real-world case studies.",
      thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
      departmentId: "development",
      instructorId,
      level: "senior",
      difficulty: "advanced",
      durationMinutes: 18 * 60,
      publishStatus: "published",
      xpReward: 850,
      tags: ["Architecture", "Distributed Systems", "Scalability"],
      enrolledCount: 1842,
      rating: 49,
      isTrending: true,
    })
    .returning();

  const moduleSeed = [
    {
      title: "Foundations of Scale",
      lessons: [
        // freeCodeCamp embeds — older demo IDs were removed / blocked by YouTube
        { title: "What is System Design?", type: "video" as const, content: "https://www.youtube.com/embed/F2FmTdLtb_4", duration: 18 },
        { title: "CAP Theorem Deep Dive", type: "video" as const, content: "https://www.youtube.com/embed/k-Yaq8AHlFA", duration: 24 },
        { title: "Load Balancing Patterns", type: "article" as const, content: "## Load Balancing\n\nLearn round-robin, least connections, and consistent hashing strategies.", duration: 20 },
      ],
    },
    {
      title: "Data and Caching",
      lessons: [
        { title: "Database Sharding", type: "video" as const, content: "https://www.youtube.com/embed/F2FmTdLtb_4?start=1680", duration: 32 },
        { title: "Redis Caching Strategies", type: "external_link" as const, content: "https://redis.io/docs/manual/patterns/", duration: 45 },
        { title: "Module Summary", type: "article" as const, content: "Review key caching patterns before moving to case studies.", duration: 20, isPreview: true },
      ],
    },
  ];

  for (const [mIndex, mod] of moduleSeed.entries()) {
    const [moduleRow] = await db
      .insert(modules)
      .values({
        courseId: course.id,
        title: mod.title,
        orderIndex: mIndex,
      })
      .returning();

    for (const [lIndex, lesson] of mod.lessons.entries()) {
      await db.insert(lessons).values({
        moduleId: moduleRow.id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        durationMinutes: lesson.duration,
        orderIndex: lIndex,
        isPreview: "isPreview" in lesson ? lesson.isPreview : lIndex === 0,
      });
    }
  }

  await db.insert(courses).values([
    {
      slug: "typescript-for-enterprise-apps",
      title: "TypeScript for Enterprise Apps",
      description: "Advanced TypeScript patterns for large React and Node codebases with strong typing and DX.",
      thumbnailUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
      departmentId: "development",
      instructorId,
      level: "intermediate",
      difficulty: "intermediate",
      durationMinutes: 12 * 60,
      publishStatus: "published",
      xpReward: 520,
      tags: ["TypeScript", "React"],
      enrolledCount: 3201,
      rating: 48,
    },
    {
      slug: "product-design-systems",
      title: "Product Design Systems",
      description: "Build scalable design systems with tokens, components, and accessibility-first patterns.",
      thumbnailUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
      departmentId: "uiux",
      instructorId,
      level: "intermediate",
      difficulty: "intermediate",
      durationMinutes: 10 * 60,
      publishStatus: "published",
      xpReward: 480,
      tags: ["Design Systems", "Figma"],
      enrolledCount: 986,
      rating: 49,
      isTrending: true,
    },
  ]);

  // Attach curriculum to TypeScript course when freshly seeded
  const [tsCourse] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, "typescript-for-enterprise-apps"))
    .limit(1);

  if (tsCourse) {
    const tsModules = [
      {
        title: "TypeScript Foundations",
        lessons: [
          {
            title: "Why TypeScript at Scale",
            type: "video" as const,
            content: "https://www.youtube.com/embed/30LWjhZzg50",
            duration: 25,
            isPreview: true,
          },
          {
            title: "Types, Interfaces & Generics",
            type: "article" as const,
            content:
              "## Types, Interfaces & Generics\n\nPrefer interface for shapes, type for unions, and generics over any.",
            duration: 20,
          },
          {
            title: "Strict Mode Checklist",
            type: "article" as const,
            content: "## Strict Mode\n\nEnable `strict: true` in tsconfig.json for enterprise apps.",
            duration: 15,
          },
        ],
      },
      {
        title: "React + API Patterns",
        lessons: [
          {
            title: "Typing React Components",
            type: "video" as const,
            content: "https://www.youtube.com/embed/zQnBQ4tB3ZA",
            duration: 30,
          },
          {
            title: "API Contracts with Zod",
            type: "external_link" as const,
            content: "https://zod.dev",
            duration: 25,
          },
          {
            title: "Module Wrap-up",
            type: "article" as const,
            content: "Review typing patterns, then ship a small typed React feature.",
            duration: 10,
          },
        ],
      },
    ];

    for (const [mIndex, mod] of tsModules.entries()) {
      const [moduleRow] = await db
        .insert(modules)
        .values({ courseId: tsCourse.id, title: mod.title, orderIndex: mIndex })
        .returning();
      for (const [lIndex, lesson] of mod.lessons.entries()) {
        await db.insert(lessons).values({
          moduleId: moduleRow.id,
          title: lesson.title,
          type: lesson.type,
          content: lesson.content,
          durationMinutes: lesson.duration,
          orderIndex: lIndex,
          isPreview: "isPreview" in lesson ? Boolean(lesson.isPreview) : false,
        });
      }
    }
  }

  console.log("Seeded courses");
}

seedCourses().catch((error) => {
  console.error(error);
  process.exit(1);
});
