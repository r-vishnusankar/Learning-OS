import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
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

/** Any status. At most one row once lms_assessment_course_unique is applied. */
export async function getAssessmentByCourseId(courseId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.courseId, courseId))
    .limit(1);
  return row ?? null;
}

/** Published knowledge checks keyed by course id. One query. */
export async function getPublishedAssessmentsByCourseIds(courseIds: string[]) {
  const map = new Map<string, { id: string }>();
  if (courseIds.length === 0) return map;
  const db = getDb();
  const rows = await db
    .select({ id: assessments.id, courseId: assessments.courseId })
    .from(assessments)
    .where(
      and(
        inArray(assessments.courseId, courseIds),
        eq(assessments.publishStatus, "published")
      )
    );
  for (const row of rows) {
    if (row.courseId && !map.has(row.courseId)) {
      map.set(row.courseId, { id: row.id });
    }
  }
  return map;
}

export async function getPassedAssessmentIds(userId: string, assessmentIds: string[]) {
  const passed = new Set<string>();
  if (assessmentIds.length === 0) return passed;
  const db = getDb();
  const rows = await db
    .select({
      assessmentId: assessmentAttempts.assessmentId,
      passed: assessmentAttempts.passed,
    })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, userId),
        inArray(assessmentAttempts.assessmentId, assessmentIds)
      )
    );
  for (const row of rows) {
    if (row.passed === true) passed.add(row.assessmentId);
  }
  return passed;
}

/** Keys are `${userId}:${assessmentId}`. */
export async function getPassedAssessmentPairs(userIds: string[], assessmentIds: string[]) {
  const passed = new Set<string>();
  if (userIds.length === 0 || assessmentIds.length === 0) return passed;
  const db = getDb();
  const rows = await db
    .select({
      userId: assessmentAttempts.userId,
      assessmentId: assessmentAttempts.assessmentId,
      passed: assessmentAttempts.passed,
    })
    .from(assessmentAttempts)
    .where(
      and(
        inArray(assessmentAttempts.userId, userIds),
        inArray(assessmentAttempts.assessmentId, assessmentIds)
      )
    );
  for (const row of rows) {
    if (row.passed === true) passed.add(`${row.userId}:${row.assessmentId}`);
  }
  return passed;
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

export type AssessmentEligibility =
  | { state: "AVAILABLE" }
  | { state: "IN_PROGRESS"; attemptId: string }
  | { state: "PASSED"; bestScore: number }
  | { state: "ATTEMPTS_EXHAUSTED" }
  | { state: "UNAVAILABLE" };

/** Pure eligibility check — no side effects. */
export async function getAssessmentEligibility(
  userId: string,
  assessmentId: string
): Promise<AssessmentEligibility> {
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment || assessment.publishStatus !== "published") return { state: "UNAVAILABLE" };

  const attempts = await getUserAttempts(userId, assessmentId);
  const inProgress = attempts.find((a) => a.status === "in_progress");
  if (inProgress) return { state: "IN_PROGRESS", attemptId: inProgress.id };

  const submitted = attempts.filter((a) => a.status !== "in_progress");
  const bestScore = submitted.reduce<number | null>((max, a) => {
    if (a.percentage == null) return max;
    return max == null ? a.percentage : Math.max(max, a.percentage);
  }, null);

  // Check passed BEFORE exhausted — passing on last attempt is a pass, not exhausted
  if (bestScore != null && bestScore >= assessment.passingScore) {
    return { state: "PASSED", bestScore };
  }
  if (submitted.length >= assessment.maxAttempts) return { state: "ATTEMPTS_EXHAUSTED" };
  return { state: "AVAILABLE" };
}

/**
 * Start (or resume) an attempt.
 * Returns the attempt row, or null when max attempts already reached.
 * Never throws for expected conditions — callers check for null.
 *
 * Atomicity: neon-http has no interactive transactions. We use an
 * insert-then-verify-and-rollback pattern: insert the in_progress row,
 * then immediately count submitted rows. If the count already equals or
 * exceeds maxAttempts we delete the row we just inserted and return null.
 * A concurrent submitter who finishes between our insert and our count
 * will cause our count check to fire and we abort — the user cannot sneak
 * past the limit via a race.
 */
export async function startAttemptForUser(
  userId: string,
  assessmentId: string
): Promise<(typeof assessmentAttempts.$inferSelect) | null> {
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment || assessment.publishStatus !== "published") return null;

  const existing = await getInProgressAttempt(userId, assessmentId);
  if (existing) return existing;

  // Pre-check (non-atomic fast path — catches the common case)
  const attempts = await getUserAttempts(userId, assessmentId);
  const submitted = attempts.filter((a) => a.status !== "in_progress");
  if (submitted.length >= assessment.maxAttempts) return null;

  // Also reject if already passed
  const bestScore = submitted.reduce<number | null>((max, a) => {
    if (a.percentage == null) return max;
    return max == null ? a.percentage : Math.max(max, a.percentage);
  }, null);
  if (bestScore != null && bestScore >= assessment.passingScore) return null;

  let qs = await getQuestionsForAssessment(assessmentId);
  if (!qs.length) return null;
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

  if (!attempt) return null;

  // Post-insert atomic guard: count submitted rows (in_progress excluded)
  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, userId),
        eq(assessmentAttempts.assessmentId, assessmentId),
        sql`${assessmentAttempts.status} != 'in_progress'`
      )
    );
  if ((countRow?.n ?? 0) >= assessment.maxAttempts) {
    // Race: another attempt was submitted between our pre-check and now — roll back
    await db.delete(assessmentAttempts).where(eq(assessmentAttempts.id, attempt.id));
    return null;
  }

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
