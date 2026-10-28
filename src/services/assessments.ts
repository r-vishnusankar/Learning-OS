"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  countQuestions,
  getAssessmentByCourseId,
  getAssessmentById,
  getAssessmentEligibility,
  getAttemptById,
  getQuestionsForAssessment,
  getUserAttempts,
  gradeInProgressAttempt,
  listAssessments,
  startAttemptForUser,
} from "@/db/queries/assessments";
import { getCourseById } from "@/db/queries/courses";
import { assessmentAttempts, assessments, questions } from "@/db/schema";
import { courses } from "@/db/schema/courses";
import { unansweredQuestionNumbers } from "@/lib/assessment-answers";
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

const COURSE_TAKEN = "This course already has a knowledge check.";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

async function courseIdTaken(courseId: string, exceptAssessmentId?: string): Promise<boolean> {
  const existing = await getAssessmentByCourseId(courseId);
  if (!existing) return false;
  if (exceptAssessmentId && existing.id === exceptAssessmentId) return false;
  return true;
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
  const courseIds = [
    ...new Set(rows.map((r) => r.courseId).filter((id): id is string => !!id)),
  ];
  const db = getDb();
  const courseRows =
    courseIds.length > 0
      ? await db
          .select({ id: courses.id, title: courses.title })
          .from(courses)
          .where(inArray(courses.id, courseIds))
      : [];
  const titleById = new Map(courseRows.map((c) => [c.id, c.title]));
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      questionsCount: await countQuestions(row.id),
      courseTitle: row.courseId ? (titleById.get(row.courseId) ?? null) : null,
    }))
  );
}

export async function fetchAssessmentBuilderAction(id: string) {
  await requireAdminOrInstructor();
  const assessment = await getAssessmentById(id);
  if (!assessment) return null;
  const qs = await getQuestionsForAssessment(id);
  const linked = assessment.courseId ? await getCourseById(assessment.courseId) : null;
  return {
    assessment,
    questions: qs,
    linkedCourse: linked
      ? {
          id: linked.course.id,
          title: linked.course.title,
          publishStatus: linked.course.publishStatus,
        }
      : null,
  };
}

export async function createAssessmentAction(input: unknown): Promise<
  | { ok: true; id: string }
  | { ok: false; fieldErrors: Record<string, string[]> }
> {
  await requireAdminOrInstructor();
  const parsed = createAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const courseId = data.courseId ?? null;
  if (courseId && (await courseIdTaken(courseId))) {
    return { ok: false, fieldErrors: { courseId: [COURSE_TAKEN] } };
  }
  const db = getDb();
  try {
    const [created] = await db
      .insert(assessments)
      .values({
        title: data.title,
        description: data.description,
        departmentId: data.departmentId,
        level: data.level,
        type: data.type,
        courseId,
        durationMinutes: data.durationMinutes,
        passingScore: data.passingScore,
        maxAttempts: data.maxAttempts,
        negativeMarking: data.negativeMarking,
        randomize: data.randomize,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        publishStatus: "draft",
      })
      .returning();
    if (!created) {
      return { ok: false, fieldErrors: { title: ["Could not create assessment"] } };
    }
    revalidatePath("/dashboard/admin/assessments");
    return { ok: true, id: created.id };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, fieldErrors: { courseId: [COURSE_TAKEN] } };
    }
    throw err;
  }
}

export async function openOrCreateKnowledgeCheckAction(courseId: string): Promise<
  | { ok: true; id: string; created: boolean }
  | { ok: false; code: "not_found"; message: string }
> {
  await requireAdminOrInstructor();
  const courseRow = await getCourseById(courseId);
  if (!courseRow) {
    return { ok: false, code: "not_found", message: "Course not found." };
  }
  const existing = await getAssessmentByCourseId(courseId);
  if (existing) return { ok: true, id: existing.id, created: false };

  const title = `${courseRow.course.title} — Knowledge Check`.slice(0, 200);
  const db = getDb();
  try {
    const [created] = await db
      .insert(assessments)
      .values({
        title,
        description: `Knowledge check for ${courseRow.course.title}`,
        departmentId: courseRow.course.departmentId,
        level: courseRow.course.level,
        courseId,
        publishStatus: "draft",
      })
      .returning();
    revalidatePath("/dashboard/admin/assessments");
    revalidatePath(`/dashboard/admin/courses/${courseId}`);
    return { ok: true, id: created.id, created: true };
  } catch (err) {
    if (isUniqueViolation(err)) {
      const raced = await getAssessmentByCourseId(courseId);
      if (raced) return { ok: true, id: raced.id, created: false };
    }
    throw err;
  }
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
  if (data.courseId && (await courseIdTaken(data.courseId, data.id))) {
    return { ok: false, fieldErrors: { courseId: [COURSE_TAKEN] } };
  }
  const db = getDb();
  try {
    const [updated] = await db
      .update(assessments)
      .set({
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.courseId !== undefined ? { courseId: data.courseId } : {}),
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
    if (updated.courseId) {
      revalidatePath(`/dashboard/admin/courses/${updated.courseId}`);
    }
    return { ok: true, id: updated.id };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, fieldErrors: { courseId: [COURSE_TAKEN] } };
    }
    throw err;
  }
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

export async function submitAttemptAction(input: unknown): Promise<
  | {
      ok: true;
      percentage: number;
      passed: boolean | null;
      needsManual: boolean;
    }
  | {
      ok: false;
      code: "already_submitted" | "invalid" | "unanswered";
      message: string;
      unansweredNumbers?: number[];
    }
> {
  const userId = await requireUserId();
  const parsed = submitAttemptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid", message: "Invalid submission." };
  }
  const data = parsed.data;
  const attempt = await getAttemptById(data.attemptId);
  if (!attempt || attempt.userId !== userId) {
    return { ok: false, code: "invalid", message: "Attempt not found." };
  }
  if (attempt.status !== "in_progress") {
    return {
      ok: false,
      code: "already_submitted",
      message: "This attempt has already been submitted.",
    };
  }

  const assessment = await getAssessmentById(attempt.assessmentId);
  if (!assessment) {
    return { ok: false, code: "invalid", message: "Assessment missing." };
  }

  const mergedAnswers = { ...attempt.answers, ...(data.answers ?? {}) };
  const deadline = new Date(attempt.startedAt).getTime() + assessment.durationMinutes * 60 * 1000;
  const timedOut = Date.now() >= deadline;
  // Timeout auto-submit may include blanks (existing behavior). Manual submit may not.
  if (!timedOut) {
    const unansweredNumbers = unansweredQuestionNumbers(attempt.questionOrder, mergedAnswers);
    if (unansweredNumbers.length > 0) {
      return {
        ok: false,
        code: "unanswered",
        unansweredNumbers,
        message: `Answer question${unansweredNumbers.length === 1 ? "" : "s"} ${unansweredNumbers.join(", ")} before submitting.`,
      };
    }
  }

  const graded = await gradeInProgressAttempt(data.attemptId, data.answers);
  const { assessment, result, questions: qs } = graded;

  if (!graded.wrote) {
    const current = graded.attempt;
    return {
      ok: true,
      percentage: current?.percentage ?? result.percentage,
      passed: current?.passed ?? null,
      needsManual: current?.status === "submitted" ? true : result.needsManual,
    };
  }

  const updated = graded.attempt;
  if (!updated) {
    return { ok: false, code: "already_submitted", message: "This attempt has already been submitted." };
  }

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
    ok: true,
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
