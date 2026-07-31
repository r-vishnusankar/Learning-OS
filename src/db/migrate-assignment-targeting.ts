/**
 * Adds homework targeting: scope + department_id + assignee junction.
 * Additive — existing rows default to scope=org (visible to all until reassigned).
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`ALTER TABLE lms_assignment ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'org'`;
  await sql`ALTER TABLE lms_assignment ADD COLUMN IF NOT EXISTS department_id text`;

  // Best-effort FK (ignore if already present / unsupported)
  try {
    await sql`
      DO $$ BEGIN
        ALTER TABLE lms_assignment
          ADD CONSTRAINT lms_assignment_department_id_fkey
          FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `;
  } catch {
    /* optional */
  }

  await sql`
    CREATE TABLE IF NOT EXISTS lms_assignment_assignee (
      id text PRIMARY KEY,
      assignment_id text NOT NULL REFERENCES lms_assignment(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS lms_assignment_assignee_unique ON lms_assignment_assignee(assignment_id, user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS lms_assignment_assignee_user_idx ON lms_assignment_assignee(user_id)`;

  await sql`ALTER TABLE lms_assignment ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb`;

  console.log("Homework assignment targeting columns ready");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
