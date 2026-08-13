import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { assessmentAttempts, assessments, questions } from "@/db/schema";
import { codingChecksSummary, evaluateCodingChecks } from "@/lib/coding-checks";
import type { QuestionType } from "@/db/schema/assessments";
import type { QuestionMeta } from "@/types/coding";

export async function listAssessments(filters?: { publishStatus?: string; departmentId?: string }) {
  const db = getDb();
  const rows = await db.select().from(assessments).orderBy(desc(assessments.updatedAt));
  return rows.filter((row) => {
    if (filters?.publishStatus && row.publishStatus !== filters.publishStatus) return false;
    if (filters?.departmentId && row.departmentId !== filters.departmentId) return false;
    return true;
  });
}

export async function getAssessmentById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return row ?? null;
}

export async function getQuestionsForAssessment(assessmentId: string) {
  const db = getDb();
  return db
    .select()
    .from(questions)
    .where(eq(questions.assessmentId, assessmentId))
    .orderBy(asc(questions.orderIndex));
}

export async function countQuestions(assessmentId: string) {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(eq(questions.assessmentId, assessmentId));
  return row?.count ?? 0;
}

export async function getUserAttempts(userId: string, assessmentId: string) {
  const db = getDb();
  return db
    .select()
    .from(assessmentAttempts)
    .where(
      and(eq(assessmentAttempts.userId, userId), eq(assessmentAttempts.assessmentId, assessmentId))
    )
    .orderBy(desc(assessmentAttempts.startedAt));
}

export async function getAttemptById(attemptId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(assessmentAttempts)
    .where(eq(assessmentAttempts.id, attemptId))
    .limit(1);
  return row ?? null;
}

export async function getInProgressAttempt(userId: string, assessmentId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, userId),
        eq(assessmentAttempts.assessmentId, assessmentId),
        eq(assessmentAttempts.status, "in_progress")
      )
    )
    .limit(1);
  return row ?? null;
}

export function scoreAnswers(
  qs: Array<{
    id: string;
    type: QuestionType;
    correctAnswers: string[];
    points: number;
    meta: QuestionMeta;
  }>,
  answers: Record<string, string | string[]>,
  negativeMarking: boolean
) {
  let score = 0;
  let maxScore = 0;
  let needsManual = false;

  for (const q of qs) {
    maxScore += q.points;
    const answer = answers[q.id];
    const autoTypes = ["mcq", "multi_select", "true_false", "fill_blank"];

    // Coding with configured checks → auto partial credit; otherwise manual
    if (q.type === "coding") {
      const checks = q.meta?.coding?.checks ?? [];
      if (!checks.length) {
        needsManual = true;
        continue;
      }
      const code = typeof answer === "string" ? answer : "";
      if (!code.trim()) continue;
      const summary = codingChecksSummary(evaluateCodingChecks(code, checks));
      score += Math.round((q.points * summary.percentage) / 100);
      if (!summary.allPassed) {
        // Still mark for review if any check failed
        needsManual = true;
      }
      continue;
    }

    if (!autoTypes.includes(q.type)) {
      needsManual = true;
      continue;
    }

    if (answer == null || (Array.isArray(answer) && answer.length === 0) || answer === "") {
      continue;
    }

    const correct = q.correctAnswers.map((a) => a.trim().toLowerCase());
    let isCorrect = false;

    if (q.type === "multi_select") {
      const given = (Array.isArray(answer) ? answer : [answer]).map((a) => a.trim().toLowerCase());
      isCorrect =
        given.length === correct.length && given.every((g) => correct.includes(g));
    } else {
      const given = (Array.isArray(answer) ? answer[0] : answer).trim().toLowerCase();
      isCorrect = correct.includes(given);
    }

    if (isCorrect) {
      score += q.points;
    } else if (negativeMarking) {
      score = Math.max(0, score - Math.floor(q.points / 2));
    }
  }

  return { score, maxScore, needsManual, percentage: maxScore ? Math.round((score / maxScore) * 100) : 0 };
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Start (or resume) an in-progress attempt. Same path as startAttemptAction. */
export async function startAttemptForUser(userId: string, assessmentId: string) {
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment || assessment.publishStatus !== "published") {
    throw new Error("Assessment not available");
  }

  const existing = await getInProgressAttempt(userId, assessmentId);
  if (existing) return existing;

  const attempts = await getUserAttempts(userId, assessmentId);
  const submitted = attempts.filter((a) => a.status !== "in_progress");
  if (submitted.length >= assessment.maxAttempts) {
    throw new Error("Max attempts reached");
  }

  let qs = await getQuestionsForAssessment(assessmentId);
  if (!qs.length) throw new Error("No questions in this assessment");
  if (assessment.randomize) qs = shuffle(qs);

  const db = getDb();
  const [attempt] = await db
    .insert(assessmentAttempts)
    .values({
      assessmentId,
      userId,
      questionOrder: qs.map((q) => q.id),
      answers: {},
      status: "in_progress",
      maxScore: qs.reduce((sum, q) => sum + q.points, 0),
    })
    .returning();

  return attempt;
}

/**
 * Grade an in-progress attempt with scoreAnswers and persist.
 * Does not mint a certificate — callers use mintCertificateForAssessmentPass.
 */
export async function gradeInProgressAttempt(
  attemptId: string,
  extraAnswers?: Record<string, string | string[]>
) {
  const attempt = await getAttemptById(attemptId);
  if (!attempt || attempt.status !== "in_progress") {
    throw new Error("Invalid attempt");
  }

  const assessment = await getAssessmentById(attempt.assessmentId);
  if (!assessment) throw new Error("Assessment missing");

  const qs = await getQuestionsForAssessment(assessment.id);
  const answers = { ...attempt.answers, ...(extraAnswers ?? {}) };
  const result = scoreAnswers(qs, answers, assessment.negativeMarking);
  const passed = result.percentage >= assessment.passingScore;
  const status = result.needsManual ? "submitted" : "graded";

  const db = getDb();
  const [updated] = await db
    .update(assessmentAttempts)
    .set({
      answers,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed: result.needsManual ? null : passed,
      status,
      submittedAt: new Date(),
    })
    .where(
      and(eq(assessmentAttempts.id, attemptId), eq(assessmentAttempts.status, "in_progress"))
    )
    .returning();

  return {
    attempt: updated ?? (await getAttemptById(attemptId)),
    assessment,
    questions: qs,
    result,
    passed: result.needsManual ? null : passed,
    needsManual: result.needsManual,
    wrote: Boolean(updated),
  };
}
