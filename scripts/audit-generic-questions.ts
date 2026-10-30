/**
 * P13 STEP 1 — read-only audit of assessment questions that look generic.
 * SELECT only. Safe to re-run. Does not INSERT/UPDATE/DELETE.
 *
 *   npx tsx scripts/audit-generic-questions.ts
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";
import { isGenericPrompt } from "../src/lib/generic-question";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set in .env.local");

const sql = neon(DATABASE_URL);

async function main() {
  const totals = await sql`
    SELECT
      count(*)::int AS assessments,
      count(*) FILTER (WHERE course_id IS NOT NULL)::int AS linked,
      count(*) FILTER (WHERE course_id IS NULL)::int AS unlinked
    FROM lms_assessment
  `;

  const questionCount = await sql`SELECT count(*)::int AS n FROM lms_question`;

  const rows = await sql`
    SELECT
      a.id AS assessment_id,
      a.title AS assessment_title,
      a.publish_status,
      a.course_id,
      c.title AS course_title,
      q.id AS question_id,
      q.prompt
    FROM lms_assessment a
    LEFT JOIN lms_question q ON q.assessment_id = a.id
    LEFT JOIN course c ON c.id = a.course_id
    ORDER BY a.title, q.order_index
  `;

  const byAssessment = new Map<
    string,
    {
      id: string;
      title: string;
      publishStatus: string;
      courseId: string | null;
      courseTitle: string | null;
      questionCount: number;
      genericCount: number;
      samplePrompt: string | null;
    }
  >();

  for (const row of rows) {
    const id = String(row.assessment_id);
    let entry = byAssessment.get(id);
    if (!entry) {
      entry = {
        id,
        title: String(row.assessment_title),
        publishStatus: String(row.publish_status),
        courseId: row.course_id ? String(row.course_id) : null,
        courseTitle: row.course_title ? String(row.course_title) : null,
        questionCount: 0,
        genericCount: 0,
        samplePrompt: null,
      };
      byAssessment.set(id, entry);
    }
    if (!row.question_id) continue;
    entry.questionCount += 1;
    const prompt = String(row.prompt ?? "");
    if (isGenericPrompt(prompt)) {
      entry.genericCount += 1;
      if (!entry.samplePrompt) entry.samplePrompt = prompt.slice(0, 140);
    }
  }

  const generic = [...byAssessment.values()]
    .filter((a) => a.genericCount > 0)
    .sort((a, b) => b.genericCount - a.genericCount || a.title.localeCompare(b.title));

  const unlinked = [...byAssessment.values()].filter((a) => !a.courseId);

  const genericQuestionTotal = generic.reduce((s, a) => s + a.genericCount, 0);
  const publishedGeneric = generic.filter((a) => a.publishStatus === "published");

  console.log("=== P13 question-source audit (read-only) ===");
  console.log("assessments:", totals[0]);
  console.log("questions:", questionCount[0]);
  console.log("assessments with template/generic prompts:", generic.length);
  console.log("generic questions:", genericQuestionTotal);
  console.log("published assessments that are generic:", publishedGeneric.length);
  console.log(JSON.stringify(generic, null, 2));
  console.log("unlinked assessments:", JSON.stringify(unlinked, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
