/**
 * DRY-RUN: course duration backfill report
 *
 * Shows every course whose stored durationMinutes differs from the real
 * sum of its lesson durations. Does NOT write anything to the database.
 *
 * Run: npx tsx scripts/backfill-course-duration-dryrun.ts
 */
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set in .env.local");

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function main() {
  // Pull all courses with their stored duration
  const courseRows = await sql`
    SELECT id, title, duration_minutes AS stored_minutes
    FROM   lms_course
    ORDER  BY title
  `;

  // Pull all lessons with their durations, grouped by course via module
  const lessonRows = await sql`
    SELECT   c.id AS course_id, COALESCE(SUM(l.duration_minutes), 0)::int AS real_minutes
    FROM     lms_course c
    LEFT JOIN lms_module m ON m.course_id = c.id
    LEFT JOIN lms_lesson l ON l.module_id = m.id
    GROUP BY c.id
  `;

  const realByCoure = new Map(lessonRows.map((r) => [r.course_id as string, r.real_minutes as number]));

  const diffs = courseRows
    .map((c) => ({
      id: c.id as string,
      title: c.title as string,
      stored: c.stored_minutes as number,
      real: realByCoure.get(c.id as string) ?? 0,
    }))
    .filter((c) => c.stored !== c.real);

  if (diffs.length === 0) {
    console.log("✅ All courses already match — no backfill needed.");
    return;
  }

  console.log(`\n${diffs.length} courses with mismatched durationMinutes:\n`);
  console.log(
    ["Course ID", "Title", "Stored (min)", "Real (min)", "Diff"].join("\t")
  );
  console.log("─".repeat(90));
  for (const c of diffs) {
    const diff = c.real - c.stored;
    console.log(
      [c.id, c.title.slice(0, 40).padEnd(40), c.stored, c.real, diff > 0 ? `+${diff}` : String(diff)].join("\t")
    );
  }

  console.log(`\n⚠️  DRY-RUN only — nothing was written to the database.`);
  console.log(
    `To apply: run the following SQL for each row above:\n` +
    `  UPDATE lms_course SET duration_minutes = <real_minutes> WHERE id = '<id>';\n`
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
