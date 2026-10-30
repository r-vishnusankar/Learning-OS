/**
 * Additive column profile.last_activity_date (IST YYYY-MM-DD).
 * Default is --dry-run (prints only). Pass --apply to ALTER.
 *
 *   npx tsx scripts/migrate-last-activity-date.ts
 *   npx tsx scripts/migrate-last-activity-date.ts --apply
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

  const [col] = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'profile' AND column_name = 'last_activity_date'
  `;
  console.log("before:", col ?? "(missing)");
  console.log('Would run: ALTER TABLE profile ADD COLUMN IF NOT EXISTS last_activity_date text;');

  if (!apply) return;

  await sql`ALTER TABLE profile ADD COLUMN IF NOT EXISTS last_activity_date text`;
  const [after] = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'profile' AND column_name = 'last_activity_date'
  `;
  console.log("after:", after);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
