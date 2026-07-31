import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

/**
 * Creates / upgrades course_assignment for enterprise course assign (Phase 1).
 * Additive — does not drop existing data. Lifecycle/annual-review columns are nullable stubs.
 */
async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS course_assignment (
      id text PRIMARY KEY,
      course_id text NOT NULL REFERENCES course(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      team_id text REFERENCES lms_team(id) ON DELETE SET NULL,
      department_id text,
      scope text NOT NULL DEFAULT 'user',
      mandatory boolean NOT NULL DEFAULT false,
      start_date timestamp,
      due_date timestamp,
      source text NOT NULL DEFAULT 'manual',
      plan_id text,
      cycle_id text,
      assigned_by text REFERENCES "user"(id) ON DELETE SET NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // Upgrade path if an older stub table exists
  await sql`ALTER TABLE course_assignment ADD COLUMN IF NOT EXISTS department_id text`;
  await sql`ALTER TABLE course_assignment ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'user'`;
  await sql`ALTER TABLE course_assignment ADD COLUMN IF NOT EXISTS mandatory boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE course_assignment ADD COLUMN IF NOT EXISTS start_date timestamp`;
  await sql`ALTER TABLE course_assignment ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'`;
  await sql`ALTER TABLE course_assignment ADD COLUMN IF NOT EXISTS plan_id text`;
  await sql`ALTER TABLE course_assignment ADD COLUMN IF NOT EXISTS cycle_id text`;
  await sql`ALTER TABLE course_assignment ADD COLUMN IF NOT EXISTS assigned_by text`;

  // Ensure user_id is NOT NULL for new model (skip if legacy nulls — clean manually)
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS course_assignment_course_user_unique ON course_assignment(course_id, user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS course_assignment_user_idx ON course_assignment(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS course_assignment_due_idx ON course_assignment(due_date)`;

  console.log("course_assignment table ready (Phase 1 enterprise assign)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
