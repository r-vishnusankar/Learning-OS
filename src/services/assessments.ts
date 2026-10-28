"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  countQuestions,
  getAssessmentById,
  getAssessmentEligibility,
  getAttemptById,
  getQuestionsForAssessment,
  getUserAttempts,
  gradeInProgressAttempt,
  listAssessments,
  startAttemptForUser,
} from "@/db/queries/assessments";
import { assessmentAttempts, assessments, questions } from "@/db/schema";
import { requireAdminOrInstructor, requireUserId } from "@/lib/auth-utils";
import type { Assessment, AssessmentStatus } from "@/types";
import type { CodingCheck } from "@/types/coding";
import {
  createAssessmentSchema,
  createQuestionSchema,
  saveAnswersSchema,
  submitAttemptSchema,
  updateAssessmentSchema,
  updateQuestionSchema,
} from "@/validators/assessment";

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

export async function updateAssessmentAction(input: unknown): Promise<
  | { ok: true; id: string }
  | { ok: false; fieldErrors: Record<string, string[]> }
> {
  await requireAdminOrInstructor();
  const parsed = updateAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
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
  if (!updated) {
    return { ok: false, fieldErrors: { id: ["Assessment not found"] } };
  }
  revalidatePath("/dashboard/admin/assessments");
  revalidatePath(`/dashboard/admin/assessments/${data.id}`);
  revalidatePath("/dashboard/assessments");
  return { ok: true, id: updated.id };
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
      assessmentId: data.assessmentId,
      prompt: data.prompt,
      type: data.type,
      options: data.options,
      correctAnswers: data.correctAnswers,
      points: data.points,
      difficulty: data.difficulty,
      skillTags: data.skillTags,
      bloomLevel: data.bloomLevel,
      timeEstimateSeconds: data.timeEstimateSeconds,
      meta: data.meta ?? {},
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
      ...(data.meta !== undefined ? { meta: data.meta } : {}),
    })
    .where(eq(questions.id, data.id))
    .returning();
  if (updated) {
    revalidatePath(`/dashboard/admin/assessments/${updated.assessmentId}`);
  }
  return updated;
}

export async function deleteQuestionAction(id: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  const [q] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  await db.delete(questions).where(eq(questions.id, id));
  if (q) revalidatePath(`/dashboard/admin/assessments/${q.assessmentId}`);
}

export async function startAttemptAction(
  assessmentId: string
): Promise<
  | { ok: true; attemptId: string }
  | { ok: false; reason: "attempts_exhausted" | "already_passed" | "unavailable" }
> {
  const userId = await requireUserId();
  const eligibility = await getAssessmentEligibility(userId, assessmentId);

  if (eligibility.state === "UNAVAILABLE") return { ok: false, reason: "unavailable" };
  if (eligibility.state === "ATTEMPTS_EXHAUSTED") return { ok: false, reason: "attempts_exhausted" };
  if (eligibility.state === "PASSED") return { ok: false, reason: "already_passed" };
  if (eligibility.state === "IN_PROGRESS") return { ok: true, attemptId: eligibility.attemptId };

  const attempt = await startAttemptForUser(userId, assessmentId);
  if (!attempt) return { ok: false, reason: "attempts_exhausted" };
  return { ok: true, attemptId: attempt.id };
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
    meta:
      q.type === "coding"
        ? {
            coding: {
              language: q.meta?.coding?.language ?? "javascript",
              starterCode: q.meta?.coding?.starterCode ?? "",
              checks: (q.meta?.coding?.checks ?? []).map(
                (check): Pick<CodingCheck, "id" | "label"> => ({
                  id: check.id,
                  label: check.label,
                })
              ),
            },
          }
        : {},
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

  const graded = await gradeInProgressAttempt(data.attemptId, data.answers);
  const { assessment, result, questions: qs } = graded;

  if (!graded.wrote) {
    const current = graded.attempt;
    return {
      attempt: current,
      percentage: current?.percentage ?? result.percentage,
      passed: current?.passed ?? null,
      needsManual: current?.status === "submitted" ? true : result.needsManual,
    };
  }

  const updated = graded.attempt;
  if (!updated) throw new Error("Invalid attempt");

  if (!result.needsManual && graded.passed) {
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
    passed: result.needsManual ? null : graded.passed,
    needsManual: result.needsManual,
  };
}

export async function fetchAssessmentDetailAction(assessmentId: string) {
  const userId = await requireUserId();
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment || assessment.publishStatus !== "published") return null;

  const [attempts, qCount, eligibility] = await Promise.all([
    getUserAttempts(userId, assessmentId),
    countQuestions(assessmentId),
    getAssessmentEligibility(userId, assessmentId),
  ]);
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
    eligibility,
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
