/**
 * Fix course.level when it disagrees with the level segment in slug (catalog audit URL fail).
 * Default --dry-run. Pass --apply to UPDATE.
 *
 *   npx tsx scripts/fix-course-level-from-slug.ts
 *   npx tsx scripts/fix-course-level-from-slug.ts --apply
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";
import { LEVELS } from "../src/constants/navigation";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set in .env.local");

const sql = neon(DATABASE_URL);
const apply = process.argv.includes("--apply");

function levelFromSlug(slug: string): string | null {
  const part = slug.split("-")[1];
  return LEVELS.includes(part as (typeof LEVELS)[number]) ? part : null;
}

async function main() {
  console.log(apply ? "MODE: --apply" : "MODE: --dry-run (no writes)");
  const rows = await sql`
    SELECT id, slug, level, title FROM course WHERE publish_status = 'published'
  `;
  const mismatches: Array<{ id: string; slug: string; level: string; expected: string }> = [];
  for (const row of rows) {
    const expected = levelFromSlug(row.slug as string);
    if (!expected) continue;
    if (row.level !== expected) {
      mismatches.push({
        id: row.id as string,
        slug: row.slug as string,
        level: row.level as string,
        expected,
      });
    }
  }
  console.log(`mismatches: ${mismatches.length}`);
  for (const m of mismatches) {
    console.log(`  ${m.slug}: db level=${m.level} → expected=${m.expected}`);
  }
  if (!apply || mismatches.length === 0) return;
  for (const m of mismatches) {
    await sql`UPDATE course SET level = ${m.expected} WHERE id = ${m.id}`;
  }
  console.log("applied updates:", mismatches.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
