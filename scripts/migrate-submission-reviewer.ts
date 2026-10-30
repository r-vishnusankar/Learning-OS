/**
 * Additive columns lms_assignment_submission.reviewed_by / reviewed_at.
 * Default --dry-run. Pass --apply to ALTER.
 *
 *   npx tsx scripts/migrate-submission-reviewer.ts
 *   npx tsx scripts/migrate-submission-reviewer.ts --apply
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

  const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'lms_assignment_submission'
      AND column_name IN ('reviewed_by', 'reviewed_at')
    ORDER BY column_name
  `;
  console.log("before:", cols);
  console.log(
    "Would run: ALTER TABLE lms_assignment_submission ADD COLUMN IF NOT EXISTS reviewed_by text REFERENCES \"user\"(id) ON DELETE SET NULL;"
  );
  console.log(
    "Would run: ALTER TABLE lms_assignment_submission ADD COLUMN IF NOT EXISTS reviewed_at timestamp;"
  );

  if (!apply) return;

  await sql`
    ALTER TABLE lms_assignment_submission
    ADD COLUMN IF NOT EXISTS reviewed_by text REFERENCES "user"(id) ON DELETE SET NULL
  `;
  await sql`
    ALTER TABLE lms_assignment_submission
    ADD COLUMN IF NOT EXISTS reviewed_at timestamp
  `;
  const after = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'lms_assignment_submission'
      AND column_name IN ('reviewed_by', 'reviewed_at')
    ORDER BY column_name
  `;
  console.log("after:", after);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
