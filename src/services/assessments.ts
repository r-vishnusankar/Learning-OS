"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  countQuestions,
  getAssessmentById,
  getAttemptById,
  getInProgressAttempt,
  getQuestionsForAssessment,
  getUserAttempts,
  listAssessments,
  scoreAnswers,
} from "@/db/queries/assessments";
import { assessmentAttempts, assessments, questions } from "@/db/schema";
import { requireAdminOrInstructor, requireUserId } from "@/lib/auth-utils";
import type { Assessment, AssessmentStatus } from "@/types";
import {
  createAssessmentSchema,
  createQuestionSchema,
  saveAnswersSchema,
  submitAttemptSchema,
  updateAssessmentSchema,
  updateQuestionSchema,
} from "@/validators/assessment";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function toLearnerStatus(
  assessment: typeof assessments.$inferSelect,
  attemptsUsed: number,
  bestScore: number | null,
  hasInProgress: boolean
): AssessmentStatus {
  if (hasInProgress) return "in_progress";
  if (assessment.dueDate && assessment.dueDate > new Date() && attemptsUsed === 0) {
    // upcoming if due in future and not started - treat published as available for now
  }
  if (bestScore != null) {
    return bestScore >= assessment.passingScore ? "completed" : "failed";
  }
  if (attemptsUsed >= assessment.maxAttempts) return "expired";
  return "available";
}

export async function fetchLearnerAssessmentsAction(): Promise<Assessment[]> {
  const userId = await requireUserId();
  const rows = await listAssessments({ publishStatus: "published" });

  const mapped = await Promise.all(
    rows.map(async (row) => {
      const attempts = await getUserAttempts(userId, row.id);
      const submitted = attempts.filter((a) => a.status !== "in_progress");
      const best = submitted.reduce<number | null>((max, a) => {
        if (a.percentage == null) return max;
        return max == null ? a.percentage : Math.max(max, a.percentage);
      }, null);
      const inProgress = attempts.some((a) => a.status === "in_progress");
      const qCount = await countQuestions(row.id);

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        department: row.departmentId,
        level: row.level,
        status: toLearnerStatus(row, submitted.length, best, inProgress),
        attempts: submitted.length,
        maxAttempts: row.maxAttempts,
        dueDate: row.dueDate?.toISOString() ?? new Date(Date.now() + 14 * 86400000).toISOString(),
        score: best ?? undefined,
        passingScore: row.passingScore,
        durationMinutes: row.durationMinutes,
        questionsCount: qCount,
        type: row.type,
      } satisfies Assessment;
    })
  );

  return mapped;
}

export async function fetchAdminAssessmentsAction() {
  await requireAdminOrInstructor();
  const rows = await listAssessments();
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      questionsCount: await countQuestions(row.id),
    }))
  );
}

export async function fetchAssessmentBuilderAction(id: string) {
  await requireAdminOrInstructor();
  const assessment = await getAssessmentById(id);
  if (!assessment) return null;
  const qs = await getQuestionsForAssessment(id);
  return { assessment, questions: qs };
}

export async function createAssessmentAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = createAssessmentSchema.parse(input);
  const db = getDb();
  const [created] = await db
    .insert(assessments)
    .values({
      title: data.title,
      description: data.description,
      departmentId: data.departmentId,
      level: data.level,
      type: data.type,
      courseId: data.courseId ?? null,
      durationMinutes: data.durationMinutes,
      passingScore: data.passingScore,
      maxAttempts: data.maxAttempts,
      negativeMarking: data.negativeMarking,
      randomize: data.randomize,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      publishStatus: "draft",
    })
    .returning();
  revalidatePath("/dashboard/admin/assessments");
  return created;
}

export async function updateAssessmentAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = updateAssessmentSchema.parse(input);
  const db = getDb();
  const [updated] = await db
    .update(assessments)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
      ...(data.passingScore !== undefined ? { passingScore: data.passingScore } : {}),
      ...(data.maxAttempts !== undefined ? { maxAttempts: data.maxAttempts } : {}),
      ...(data.negativeMarking !== undefined ? { negativeMarking: data.negativeMarking } : {}),
      ...(data.randomize !== undefined ? { randomize: data.randomize } : {}),
      ...(data.publishStatus !== undefined ? { publishStatus: data.publishStatus } : {}),
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, data.id))
    .returning();
  revalidatePath("/dashboard/admin/assessments");
  revalidatePath(`/dashboard/admin/assessments/${data.id}`);
  revalidatePath("/dashboard/assessments");
  return updated;
}

export async function deleteAssessmentAction(id: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  await db.delete(assessments).where(eq(assessments.id, id));
  revalidatePath("/dashboard/admin/assessments");
  revalidatePath("/dashboard/assessments");
}

export async function createQuestionAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = createQuestionSchema.parse(input);
  const db = getDb();
  const existing = await getQuestionsForAssessment(data.assessmentId);
  const [created] = await db
    .insert(questions)
    .values({
      ...data,
      orderIndex: existing.length,
    })
    .returning();
  revalidatePath(`/dashboard/admin/assessments/${data.assessmentId}`);
  return created;
}

export async function updateQuestionAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = updateQuestionSchema.parse(input);
  const db = getDb();
  const [updated] = await db
    .update(questions)
    .set({
      ...(data.prompt !== undefined ? { prompt: data.prompt } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.options !== undefined ? { options: data.options } : {}),
      ...(data.correctAnswers !== undefined ? { correctAnswers: data.correctAnswers } : {}),
      ...(data.points !== undefined ? { points: data.points } : {}),
      ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
      ...(data.skillTags !== undefined ? { skillTags: data.skillTags } : {}),
      ...(data.bloomLevel !== undefined ? { bloomLevel: data.bloomLevel } : {}),
    })
    .where(eq(questions.id, data.id))
    .returning();
  return updated;
}

export async function deleteQuestionAction(id: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  const [q] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  await db.delete(questions).where(eq(questions.id, id));
  if (q) revalidatePath(`/dashboard/admin/assessments/${q.assessmentId}`);
}

export async function startAttemptAction(assessmentId: string) {
  const userId = await requireUserId();
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

export async function fetchAttemptSessionAction(attemptId: string) {
  const userId = await requireUserId();
  const attempt = await getAttemptById(attemptId);
  if (!attempt || attempt.userId !== userId) return null;

  const assessment = await getAssessmentById(attempt.assessmentId);
  if (!assessment) return null;

  const allQuestions = await getQuestionsForAssessment(assessment.id);
  const byId = Object.fromEntries(allQuestions.map((q) => [q.id, q]));
  const ordered = attempt.questionOrder.map((id) => byId[id]).filter(Boolean);

  // Never send correct answers to client while in progress
  const safeQuestions = ordered.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    type: q.type,
    options: q.options,
    points: q.points,
    timeEstimateSeconds: q.timeEstimateSeconds,
  }));

  return {
    attempt,
    assessment: {
      id: assessment.id,
      title: assessment.title,
      durationMinutes: assessment.durationMinutes,
      passingScore: assessment.passingScore,
    },
    questions: safeQuestions,
  };
}

export async function saveAnswersAction(input: unknown) {
  const userId = await requireUserId();
  const data = saveAnswersSchema.parse(input);
  const attempt = await getAttemptById(data.attemptId);
  if (!attempt || attempt.userId !== userId || attempt.status !== "in_progress") {
    throw new Error("Invalid attempt");
  }

  const db = getDb();
  await db
    .update(assessmentAttempts)
    .set({ answers: { ...attempt.answers, ...data.answers } })
    .where(eq(assessmentAttempts.id, data.attemptId));

  return { ok: true };
}

export async function submitAttemptAction(input: unknown) {
  const userId = await requireUserId();
  const data = submitAttemptSchema.parse(input);
  const attempt = await getAttemptById(data.attemptId);
  if (!attempt || attempt.userId !== userId || attempt.status !== "in_progress") {
    throw new Error("Invalid attempt");
  }

  const assessment = await getAssessmentById(attempt.assessmentId);
  if (!assessment) throw new Error("Assessment missing");

  const qs = await getQuestionsForAssessment(assessment.id);
  const answers = { ...attempt.answers, ...(data.answers ?? {}) };
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
    .where(eq(assessmentAttempts.id, data.attemptId))
    .returning();

  if (!result.needsManual && passed) {
    const { mintCertificateForAssessmentPass } = await import("@/services/certification");
    await mintCertificateForAssessmentPass({
      userId,
      assessmentId: assessment.id,
      attemptId: updated.id,
      title: assessment.title,
      departmentId: assessment.departmentId,
      level: assessment.level,
      score: result.percentage,
      skills: [...new Set(qs.flatMap((q) => q.skillTags))],
      courseId: assessment.courseId,
    });

    try {
      const { syncEligiblePromotionRecordAction } = await import("@/services/promotions");
      await syncEligiblePromotionRecordAction(userId);
    } catch {
      // non-blocking
    }
  }

  revalidatePath("/dashboard/assessments");
  revalidatePath(`/dashboard/assessments/${assessment.id}`);
  revalidatePath("/dashboard/certificates");
  revalidatePath("/dashboard/learning");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/promotions");

  return {
    attempt: updated,
    percentage: result.percentage,
    passed: result.needsManual ? null : passed,
    needsManual: result.needsManual,
  };
}

export async function fetchAssessmentDetailAction(assessmentId: string) {
  const userId = await requireUserId();
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment || assessment.publishStatus !== "published") return null;

  const attempts = await getUserAttempts(userId, assessmentId);
  const qCount = await countQuestions(assessmentId);
  const inProgress = attempts.find((a) => a.status === "in_progress");
  const submitted = attempts.filter((a) => a.status !== "in_progress");
  const best = submitted.reduce<number | null>((max, a) => {
    if (a.percentage == null) return max;
    return max == null ? a.percentage : Math.max(max, a.percentage);
  }, null);

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      department: assessment.departmentId,
      level: assessment.level,
      status: toLearnerStatus(assessment, submitted.length, best, !!inProgress),
      attempts: submitted.length,
      maxAttempts: assessment.maxAttempts,
      dueDate: assessment.dueDate?.toISOString() ?? "",
      score: best ?? undefined,
      passingScore: assessment.passingScore,
      durationMinutes: assessment.durationMinutes,
      questionsCount: qCount,
      type: assessment.type,
    } satisfies Assessment,
    inProgressAttemptId: inProgress?.id ?? null,
    recentAttempts: submitted.slice(0, 5).map((a) => ({
      id: a.id,
      percentage: a.percentage,
      passed: a.passed,
      submittedAt: a.submittedAt?.toISOString() ?? null,
      status: a.status,
    })),
  };
}
