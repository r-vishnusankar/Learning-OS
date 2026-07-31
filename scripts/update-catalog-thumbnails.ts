import { config } from "dotenv";
config({ path: ".env.local" });
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { buildDepartmentCourseCatalog } from "@/db/catalog/department-courses";
import { courses } from "@/db/schema";

/** Refresh thumbnails for catalog courses already in Neon. */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(databaseUrl));
  const catalog = buildDepartmentCourseCatalog();
  let updated = 0;

  for (const item of catalog) {
    const result = await db
      .update(courses)
      .set({ thumbnailUrl: item.thumbnailUrl, updatedAt: new Date() })
      .where(eq(courses.slug, item.slug))
      .returning({ slug: courses.slug });
    if (result.length) updated += 1;
  }

  console.log(`Updated thumbnails for ${updated}/${catalog.length} courses`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
