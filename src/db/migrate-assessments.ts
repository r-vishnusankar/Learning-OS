import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`DROP TABLE IF EXISTS assessment_attempt CASCADE`;
  await sql`DROP TABLE IF EXISTS question_bank CASCADE`;
  await sql`DROP TABLE IF EXISTS assessment CASCADE`;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_assessment (
      id text PRIMARY KEY,
      title text NOT NULL,
      description text NOT NULL DEFAULT '',
      course_id text REFERENCES course(id) ON DELETE SET NULL,
      department_id text NOT NULL REFERENCES department(id),
      level text NOT NULL DEFAULT 'intermediate',
      type text NOT NULL DEFAULT 'mixed',
      duration_minutes integer NOT NULL DEFAULT 60,
      passing_score integer NOT NULL DEFAULT 70,
      max_attempts integer NOT NULL DEFAULT 3,
      negative_marking boolean NOT NULL DEFAULT false,
      randomize boolean NOT NULL DEFAULT true,
      publish_status text NOT NULL DEFAULT 'draft',
      due_date timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_question (
      id text PRIMARY KEY,
      assessment_id text NOT NULL REFERENCES lms_assessment(id) ON DELETE CASCADE,
      prompt text NOT NULL,
      type text NOT NULL,
      options jsonb NOT NULL DEFAULT '[]'::jsonb,
      correct_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
      points integer NOT NULL DEFAULT 5,
      difficulty text NOT NULL DEFAULT 'medium',
      skill_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      bloom_level text NOT NULL DEFAULT 'understand',
      time_estimate_seconds integer NOT NULL DEFAULT 60,
      order_index integer NOT NULL DEFAULT 0,
      meta jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`ALTER TABLE lms_question ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb`;
  await sql`
    CREATE TABLE IF NOT EXISTS lms_assessment_attempt (
      id text PRIMARY KEY,
      assessment_id text NOT NULL REFERENCES lms_assessment(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
      answers jsonb NOT NULL DEFAULT '{}'::jsonb,
      score integer,
      max_score integer,
      percentage integer,
      status text NOT NULL DEFAULT 'in_progress',
      passed boolean,
      started_at timestamp NOT NULL DEFAULT now(),
      submitted_at timestamp,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  console.log("Created lms_assessment tables");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
