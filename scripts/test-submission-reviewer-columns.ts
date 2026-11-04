/**
 * Integration: reviewer columns exist on connected DATABASE_URL.
 *   npx tsx scripts/test-submission-reviewer-columns.ts
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.log("test-submission-reviewer-columns: SKIP (no DATABASE_URL)");
  process.exit(0);
}

async function main() {
  const sql = neon(DATABASE_URL);
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'lms_assignment_submission'
      AND column_name IN ('reviewed_by', 'reviewed_at')
    ORDER BY column_name
  `;
  if (cols.length !== 2) {
    throw new Error(
      `Expected reviewed_by and reviewed_at on lms_assignment_submission, found ${cols.length}`
    );
  }
  console.log("test-submission-reviewer-columns: all assertions passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
