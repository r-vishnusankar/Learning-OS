/**
 * Creates lms_promotion for career-loop eligibility / approvals.
 * Additive. Drop via db:revert-career-loop.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS lms_promotion (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      from_level text NOT NULL,
      to_level text NOT NULL,
      from_designation text,
      to_designation text,
      status text NOT NULL DEFAULT 'eligible',
      eligible_at timestamp NOT NULL DEFAULT now(),
      decided_at timestamp,
      decided_by text REFERENCES "user"(id) ON DELETE SET NULL,
      reason text,
      snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS lms_promotion_user_idx ON lms_promotion(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS lms_promotion_status_idx ON lms_promotion(status)`;

  console.log("lms_promotion table ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
