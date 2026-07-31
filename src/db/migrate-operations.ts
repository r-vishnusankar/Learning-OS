import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`ALTER TABLE profile ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'`;
  await sql`ALTER TABLE profile ADD COLUMN IF NOT EXISTS manager_id text`;
  await sql`ALTER TABLE profile ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb`;

  await sql`DROP TABLE IF EXISTS notification CASCADE`;
  await sql`DROP TABLE IF EXISTS audit_log CASCADE`;
  await sql`DROP TABLE IF EXISTS team CASCADE`;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_team (
      id text PRIMARY KEY,
      name text NOT NULL,
      department_id text NOT NULL REFERENCES department(id),
      manager_id text REFERENCES "user"(id) ON DELETE SET NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_team_member (
      id text PRIMARY KEY,
      team_id text NOT NULL REFERENCES lms_team(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS lms_team_member_unique ON lms_team_member(team_id, user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_notification (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      title text NOT NULL,
      message text NOT NULL,
      type text NOT NULL DEFAULT 'info',
      href text,
      read integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_audit_log (
      id text PRIMARY KEY,
      user_id text REFERENCES "user"(id) ON DELETE SET NULL,
      action text NOT NULL,
      entity_type text NOT NULL,
      entity_id text,
      metadata jsonb,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  console.log("Created / altered Sprint 5 operations tables");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
