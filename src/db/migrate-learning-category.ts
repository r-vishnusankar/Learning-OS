/**
 * Adds course learning_category: role | goal (Role-based vs Goal-based).
 * Existing rows default to role so catalog/career-track courses keep working.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    ALTER TABLE course
    ADD COLUMN IF NOT EXISTS learning_category text NOT NULL DEFAULT 'role'
  `;

  console.log("Course learning_category column ready");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
