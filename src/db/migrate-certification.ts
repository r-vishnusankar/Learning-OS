import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Drop thin Sprint-2 stubs that conflict with richer lms_* tables
  await sql`DROP TABLE IF EXISTS path_course CASCADE`;
  await sql`DROP TABLE IF EXISTS learning_path CASCADE`;
  await sql`DROP TABLE IF EXISTS certificate CASCADE`;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_learning_path (
      id text PRIMARY KEY,
      title text NOT NULL,
      description text NOT NULL DEFAULT '',
      department_id text NOT NULL REFERENCES department(id),
      level text NOT NULL DEFAULT 'intermediate',
      thumbnail_url text NOT NULL DEFAULT '',
      skills jsonb NOT NULL DEFAULT '[]'::jsonb,
      duration_minutes integer NOT NULL DEFAULT 0,
      enrolled_count integer NOT NULL DEFAULT 0,
      publish_status text NOT NULL DEFAULT 'draft',
      certificate_title text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_path_step (
      id text PRIMARY KEY,
      path_id text NOT NULL REFERENCES lms_learning_path(id) ON DELETE CASCADE,
      title text NOT NULL,
      step_type text NOT NULL DEFAULT 'course',
      course_id text REFERENCES course(id) ON DELETE SET NULL,
      assessment_id text REFERENCES lms_assessment(id) ON DELETE SET NULL,
      order_index integer NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_path_enrollment (
      id text PRIMARY KEY,
      path_id text NOT NULL REFERENCES lms_learning_path(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      progress integer NOT NULL DEFAULT 0,
      enrolled_at timestamp NOT NULL DEFAULT now(),
      completed_at timestamp
    )
  `;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS lms_path_enrollment_user_path ON lms_path_enrollment(path_id, user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_assignment (
      id text PRIMARY KEY,
      title text NOT NULL,
      description text NOT NULL DEFAULT '',
      course_id text REFERENCES course(id) ON DELETE SET NULL,
      max_score integer NOT NULL DEFAULT 100,
      due_date timestamp,
      submission_type text NOT NULL DEFAULT 'text',
      publish_status text NOT NULL DEFAULT 'draft',
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_assignment_submission (
      id text PRIMARY KEY,
      assignment_id text NOT NULL REFERENCES lms_assignment(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'pending',
      content text NOT NULL DEFAULT '',
      url text,
      score integer,
      feedback text,
      submitted_at timestamp,
      graded_at timestamp,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS lms_assignment_submission_user ON lms_assignment_submission(assignment_id, user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS lms_certificate (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      credential_id text NOT NULL,
      title text NOT NULL,
      department_id text NOT NULL REFERENCES department(id),
      level text NOT NULL DEFAULT 'intermediate',
      status text NOT NULL DEFAULT 'earned',
      course_id text REFERENCES course(id) ON DELETE SET NULL,
      assessment_id text REFERENCES lms_assessment(id) ON DELETE SET NULL,
      path_id text REFERENCES lms_learning_path(id) ON DELETE SET NULL,
      attempt_id text,
      score integer,
      skills jsonb NOT NULL DEFAULT '[]'::jsonb,
      issued_at timestamp,
      expires_at timestamp,
      revoked_at timestamp,
      revoke_reason text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS lms_certificate_credential ON lms_certificate(credential_id)`;

  console.log("Created lms certification / path / assignment tables");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
