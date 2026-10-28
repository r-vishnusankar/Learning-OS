/**
 * Additive unique index: one assessment per course (I4 / #44).
 * Default is --dry-run (prints only). Pass --apply to create the index.
 * Never auto-resolves duplicate course_id rows.
 *
 *   npx tsx scripts/migrate-assessment-course-unique.ts
 *   npx tsx scripts/migrate-assessment-course-unique.ts --apply
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set in .env.local");

const sql = neon(DATABASE_URL);
const apply = process.argv.includes("--apply");

async function main() {
  console.log(apply ? "MODE: --apply" : "MODE: --dry-run (no writes)");

  const duplicates = await sql`
    SELECT course_id, count(*)::int AS n, array_agg(id) AS assessment_ids
    FROM   lms_assessment
    WHERE  course_id IS NOT NULL
    GROUP  BY course_id
    HAVING count(*) > 1
  `;
  console.log("Duplicate course_id rows (must be 0 before apply):");
  console.table(duplicates);

  const [{ index_already_exists }] = await sql`
    SELECT EXISTS (
      SELECT FROM pg_indexes
      WHERE  schemaname = 'public'
        AND  indexname  = 'lms_assessment_course_unique'
    ) AS "index_already_exists"
  `;
  console.log("index_already_exists:", index_already_exists);

  if (!apply) {
    console.log("Would run: CREATE UNIQUE INDEX IF NOT EXISTS lms_assessment_course_unique ON lms_assessment (course_id);");
    return;
  }

  if (duplicates.length > 0) {
    console.error("Refusing --apply: duplicate course_id values exist. Resolve them first.");
    process.exit(1);
  }

  if (index_already_exists) {
    console.log("Index already exists — nothing to do.");
    return;
  }

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS lms_assessment_course_unique ON lms_assessment (course_id)`;
  const after = await sql`
    SELECT indexname, indexdef
    FROM   pg_indexes
    WHERE  schemaname = 'public'
      AND  indexname  = 'lms_assessment_course_unique'
  `;
  console.table(after);
  console.log("Index created.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
