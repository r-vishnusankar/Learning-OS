import { config } from "dotenv";
config({ path: ".env.local" });
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { buildDepartmentCourseCatalog } from "../src/db/catalog/department-courses";
import { courses, lessons, modules } from "../src/db/schema";

/** Courses that previously used the dead xH5rFe8vHAs embed (or need QA video refresh). */
const TITLES = [
  "Manual Test Case Design",
  "QA Mindset & Bug Lifecycle",
  "Exploratory Testing Basics",
  "Test Plans & Traceability",
  "Defect Reporting Excellence",
  "Regression Strategy",
  "Risk-Based Testing",
  "QA Leadership",
  "Cross-Team Quality Rituals",
  "Enterprise QE Strategy",
  "Quality Transformation",
];

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const catalog = buildDepartmentCourseCatalog();

  for (const title of TITLES) {
    const item = catalog.find((c) => c.title === title);
    if (!item) {
      console.log("missing catalog", title);
      continue;
    }
    const [row] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.slug, item.slug))
      .limit(1);
    if (!row) {
      console.log("missing db", title);
      continue;
    }

    const mods = await db.select().from(modules).where(eq(modules.courseId, row.id));
    for (const mod of mods) {
      await db.delete(lessons).where(eq(lessons.moduleId, mod.id));
    }
    if (mods.length) {
      await db.delete(modules).where(eq(modules.courseId, row.id));
    }

    const [mod] = await db
      .insert(modules)
      .values({ courseId: row.id, title: "Curriculum", orderIndex: 0 })
      .returning();

    await db.insert(lessons).values(
      item.lessons.map((l, i) => ({
        moduleId: mod.id,
        title: l.title,
        type: l.type,
        content: l.content,
        durationMinutes: l.durationMinutes,
        orderIndex: i,
        isPreview: Boolean(l.isPreview),
        learningObjectives: l.learningObjectives ?? [],
        prerequisites: [],
      }))
    );
    console.log("OK", title, "=>", item.lessons[0].content);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
