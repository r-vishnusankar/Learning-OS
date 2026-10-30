"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { courses, notifications, users } from "@/db/schema";
import {
  assignmentSubmissions,
  certificates,
  homeworkAssignments,
  learningPaths,
  pathEnrollments,
  pathSteps,
} from "@/db/schema/certification";
import {
  getCourseById,
  getCourseProgressForUser,
  getUserActiveCourseIds,
} from "@/db/queries/courses";
import { getProgressCells, listAssignmentsForUser } from "@/db/queries/course-assignments";
import { hasPassedAssessment } from "@/db/queries/eligibility";
import { getAssessmentById, listAssessments } from "@/db/queries/assessments";
import { courseResumePath } from "@/lib/course-progress";
import { presentPathStep } from "@/lib/path-step";
import {
  countPathSteps,
  insertCertificateForAssessmentPass,
  getCertificateByCredentialId,
  getCertificateById,
  canUserAccessHomework,
  getHomeworkAssignmentById,
  getLearningPathById,
  getPathEnrollment,
  getPathSteps,
  getSubmissionById,
  getUserSubmission,
  listAllCertificates,
  listAssigneesForAssignment,
  listHomeworkAssignments,
  listLearningPaths,
  listSubmissionsForAssignment,
  listUserCertificates,
  listUserPathEnrollments,
  listPublishedPathsByCourseIds,
  listVisibleHomeworkForUser,
  replaceAssignmentAssignees,
} from "@/db/queries/certification";
import { requireAdminOrInstructor, requireUserId } from "@/lib/auth-utils";
import { toPlainTextComment } from "@/lib/plain-text";
import { generateCredentialId } from "@/lib/credentials";
import { getProfileByUserId } from "@/lib/profile";
import type {
  Assignment,
  AssignmentStatus,
  Certificate,
  CertificateRequirement,
  LearningPath,
} from "@/types";
import {
  createAssignmentSchema,
  createPathSchema,
  enrollPathSchema,
  reissueCertificateSchema,
  reorderPathStepsSchema,
  reviewSubmissionSchema,
  revokeCertificateSchema,
  submitAssignmentSchema,
  updateAssignmentSchema,
  updatePathSchema,
  upsertPathStepSchema,
} from "@/validators/certification";

function toLearnerAssignmentStatus(
  dueDate: Date | null,
  submission: typeof assignmentSubmissions.$inferSelect | null
): AssignmentStatus {
  if (!submission || submission.status === "pending") {
    if (dueDate && dueDate < new Date()) return "overdue";
    return "pending";
  }
  if (submission.status === "graded" || submission.status === "approved") return "graded";
  if (submission.status === "submitted" || submission.status === "in_review") return "submitted";
  if (submission.status === "rejected") return "submitted";
  return "pending";
}

export async function mintCertificateForAssessmentPass(input: {
  userId: string;
  assessmentId: string;
  attemptId: string;
  title: string;
  departmentId: Certificate["department"];
  level: Certificate["level"];
  score: number;
  skills?: string[];
  courseId?: string | null;
}) {
  const created = await insertCertificateForAssessmentPass(input);
  try {
    revalidatePath("/dashboard/certificates");
  } catch {
    // CLI / seed has no Next.js request context
  }
  return created;
}

export async function fetchLearnerPathsAction(): Promise<LearningPath[]> {
  const userId = await requireUserId();
  const rows = await listLearningPaths({ publishStatus: "published" });
  const enrollments = await listUserPathEnrollments(userId);
  const byPath = Object.fromEntries(enrollments.map((e) => [e.pathId, e]));

  return Promise.all(
    rows.map(async (row) => {
      const steps = await countPathSteps(row.id);
      const enrollment = byPath[row.id];
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        department: row.departmentId,
        level: row.level,
        coursesCount: steps,
        durationHours: Math.round(row.durationMinutes / 60),
        progress: enrollment?.progress ?? 0,
        enrolledCount: row.enrolledCount,
        thumbnail:
          row.thumbnailUrl ||
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
        skills: row.skills,
      } satisfies LearningPath;
    })
  );
}

export async function fetchPathDetailAction(pathId: string) {
  const userId = await requireUserId();
  const path = await getLearningPathById(pathId);
  if (!path || path.publishStatus !== "published") return null;

  const steps = await getPathSteps(pathId);
  const enrollment = await getPathEnrollment(pathId, userId);

  const db = getDb();
  const courseIds = steps
    .map((s) => s.courseId)
    .filter((id): id is string => Boolean(id));
  const assessmentIds = steps
    .map((s) => s.assessmentId)
    .filter((id): id is string => Boolean(id));
  const courseRows =
    courseIds.length > 0
      ? await db
          .select({
            id: courses.id,
            slug: courses.slug,
            title: courses.title,
            publishStatus: courses.publishStatus,
          })
          .from(courses)
          .where(inArray(courses.id, courseIds))
      : [];
  const courseById = new Map(courseRows.map((c) => [c.id, c]));
  const assessmentRows =
    assessmentIds.length > 0
      ? await Promise.all(assessmentIds.map((id) => getAssessmentById(id)))
      : [];
  const assessmentById = new Map(
    assessmentRows.filter(Boolean).map((a) => [a!.id, a!])
  );
  const progressCells = await getProgressCells([userId], courseIds);

  const enrichedSteps = steps.map((step) => {
    const course = step.courseId ? courseById.get(step.courseId) ?? null : null;
    const assessment = step.assessmentId
      ? assessmentById.get(step.assessmentId) ?? null
      : null;
    const presented = presentPathStep({
      title: step.title,
      stepType: step.stepType,
      courseId: step.courseId,
      assessmentId: step.assessmentId,
      course,
      assessment,
    });
    const cell = step.courseId ? progressCells.get(`${userId}:${step.courseId}`) : undefined;
    return {
      ...step,
      courseSlug: presented.cta === "open_course" ? course?.slug ?? null : null,
      courseTitle: presented.title,
      href: presented.href,
      cta: presented.cta,
      linked: presented.linked,
      progressStatus: cell?.status ?? null,
      progressPercent: cell?.percent ?? null,
    };
  });

  return {
    path: {
      id: path.id,
      title: path.title,
      description: path.description,
      department: path.departmentId,
      level: path.level,
      coursesCount: steps.filter((s) => s.stepType === "course").length,
      durationHours: Math.round(path.durationMinutes / 60),
      progress: enrollment?.progress ?? 0,
      enrolledCount: path.enrolledCount,
      thumbnail: path.thumbnailUrl,
      skills: path.skills,
      certificateTitle: path.certificateTitle,
    },
    steps: enrichedSteps,
    enrolled: !!enrollment,
    enrollmentId: enrollment?.id ?? null,
  };
}

export async function enrollPathAction(input: unknown) {
  const userId = await requireUserId();
  const data = enrollPathSchema.parse(input);
  const path = await getLearningPathById(data.pathId);
  if (!path || path.publishStatus !== "published") throw new Error("Path not available");

  const existing = await getPathEnrollment(data.pathId, userId);
  if (existing) return existing;

  const db = getDb();
  const [enrollment] = await db
    .insert(pathEnrollments)
    .values({ pathId: data.pathId, userId, progress: 0 })
    .returning();

  await db
    .update(learningPaths)
    .set({ enrolledCount: path.enrolledCount + 1, updatedAt: new Date() })
    .where(eq(learningPaths.id, data.pathId));

  revalidatePath("/dashboard/paths");
  return enrollment;
}

export async function completePathAction(pathId: string) {
  const userId = await requireUserId();
  const path = await getLearningPathById(pathId);
  if (!path) throw new Error("Path not found");

  const enrollment = await getPathEnrollment(pathId, userId);
  if (!enrollment) throw new Error("Not enrolled");

  const db = getDb();
  await db
    .update(pathEnrollments)
    .set({ progress: 100, completedAt: new Date() })
    .where(eq(pathEnrollments.id, enrollment.id));

  if (path.certificateTitle) {
    const existing = await listUserCertificates(userId);
    const already = existing.find(
      (c) => c.pathId === pathId && (c.status === "earned" || c.status === "pending")
    );
    if (!already) {
      await db.insert(certificates).values({
        userId,
        credentialId: generateCredentialId(),
        title: path.certificateTitle,
        departmentId: path.departmentId,
        level: path.level,
        status: "earned",
        pathId,
        skills: path.skills,
        score: 100,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 2 * 86400000),
      });
    }
  }

  revalidatePath("/dashboard/paths");
  revalidatePath("/dashboard/certificates");
  return { ok: true };
}

export async function fetchAdminPathsAction() {
  await requireAdminOrInstructor();
  const rows = await listLearningPaths();
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      stepsCount: await countPathSteps(row.id),
    }))
  );
}

export async function fetchAdminPathBuilderAction(pathId: string) {
  await requireAdminOrInstructor();
  const path = await getLearningPathById(pathId);
  if (!path) return null;
  const steps = await getPathSteps(pathId);
  const db = getDb();
  const courseIds = steps
    .map((s) => s.courseId)
    .filter((id): id is string => Boolean(id));
  const assessmentIds = steps
    .map((s) => s.assessmentId)
    .filter((id): id is string => Boolean(id));
  const courseRows =
    courseIds.length > 0
      ? await db
          .select({
            id: courses.id,
            title: courses.title,
            publishStatus: courses.publishStatus,
          })
          .from(courses)
          .where(inArray(courses.id, courseIds))
      : [];
  const courseById = new Map(courseRows.map((c) => [c.id, c]));
  const assessmentRows =
    assessmentIds.length > 0
      ? await Promise.all(assessmentIds.map((id) => getAssessmentById(id)))
      : [];
  const assessmentById = new Map(
    assessmentRows.filter(Boolean).map((a) => [a!.id, a!])
  );

  return {
    path,
    steps: steps.map((step) => {
      const course = step.courseId ? courseById.get(step.courseId) : undefined;
      const assessment = step.assessmentId
        ? assessmentById.get(step.assessmentId)
        : undefined;
      return {
        ...step,
        linkedTitle: course?.title || assessment?.title || step.title,
        linked: Boolean(step.courseId || step.assessmentId),
        targetPublished:
          step.stepType === "assessment"
            ? assessment?.publishStatus === "published"
            : course?.publishStatus === "published",
      };
    }),
  };
}

export async function createPathAction(input: unknown): Promise<
  | { ok: true; id: string; title: string; [key: string]: unknown }
  | { ok: false; fieldErrors: Record<string, string[]> }
> {
  await requireAdminOrInstructor();
  const parsed = createPathSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const db = getDb();
  const [created] = await db
    .insert(learningPaths)
    .values({
      title: data.title,
      description: data.description ?? "",
      departmentId: data.departmentId,
      level: data.level ?? "intermediate",
      thumbnailUrl: data.thumbnailUrl ?? "",
      skills: data.skills ?? [],
      certificateTitle: data.certificateTitle ?? null,
      publishStatus: "draft",
    })
    .returning();
  revalidatePath("/dashboard/admin/paths");
  return { ok: true, ...created };
}

export async function updatePathAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = updatePathSchema.parse(input);
  const { id, ...rest } = data;
  const db = getDb();
  const [updated] = await db
    .update(learningPaths)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(learningPaths.id, id))
    .returning();
  revalidatePath("/dashboard/admin/paths");
  revalidatePath("/dashboard/paths");
  return updated;
}

export async function deletePathAction(pathId: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  await db.delete(learningPaths).where(eq(learningPaths.id, pathId));
  revalidatePath("/dashboard/admin/paths");
  return { ok: true };
}

export async function upsertPathStepAction(input: unknown): Promise<
  | { ok: true }
  | { ok: false; code: "not_found" | "unpublished"; message: string }
> {
  await requireAdminOrInstructor();
  const data = upsertPathStepSchema.parse(input);
  const db = getDb();

  let title = data.title.trim();
  let stepType = data.stepType;
  let courseId = data.courseId ?? null;
  let assessmentId = data.assessmentId ?? null;

  if (courseId) {
    const row = await getCourseById(courseId);
    if (!row) {
      return { ok: false, code: "not_found", message: "Course not found." };
    }
    if (row.course.publishStatus !== "published") {
      return { ok: false, code: "unpublished", message: "Pick a published course." };
    }
    title = row.course.title;
    stepType = "course";
    assessmentId = null;
  } else if (assessmentId) {
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) {
      return { ok: false, code: "not_found", message: "Assessment not found." };
    }
    if (assessment.publishStatus !== "published") {
      return { ok: false, code: "unpublished", message: "Pick a published assessment." };
    }
    title = assessment.title;
    stepType = "assessment";
    courseId = null;
  }

  if (data.id) {
    await db
      .update(pathSteps)
      .set({
        title,
        stepType,
        courseId,
        assessmentId,
        ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
      })
      .where(eq(pathSteps.id, data.id));
  } else {
    const existing = await getPathSteps(data.pathId);
    await db.insert(pathSteps).values({
      pathId: data.pathId,
      title,
      stepType,
      courseId,
      assessmentId,
      orderIndex: data.orderIndex ?? existing.length,
    });
  }

  revalidatePath("/dashboard/admin/paths");
  revalidatePath("/dashboard/paths");
  revalidatePath(`/dashboard/paths/${data.pathId}`);
  revalidatePath("/dashboard/courses");
  return { ok: true };
}

export async function deletePathStepAction(stepId: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  await db.delete(pathSteps).where(eq(pathSteps.id, stepId));
  revalidatePath("/dashboard/admin/paths");
  revalidatePath("/dashboard/paths");
  revalidatePath("/dashboard/courses");
  return { ok: true };
}

export async function reorderPathStepsAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = reorderPathStepsSchema.parse(input);
  const db = getDb();
  await Promise.all(
    data.stepIds.map((id, index) =>
      db.update(pathSteps).set({ orderIndex: index }).where(eq(pathSteps.id, id))
    )
  );
  revalidatePath("/dashboard/admin/paths");
  revalidatePath(`/dashboard/paths/${data.pathId}`);
  return { ok: true };
}

export async function fetchLearnerAssignmentsAction(): Promise<Assignment[]> {
  const userId = await requireUserId();
  const profile = await getProfileByUserId(userId);
  const rows = await listVisibleHomeworkForUser(userId, profile?.department, {
    publishStatus: "published",
  });

  return Promise.all(
    rows.map(async (row) => {
      const submission = await getUserSubmission(row.id, userId);
      let courseTitle = "General";
      if (row.courseId) {
        const db = getDb();
        const [course] = await db
          .select({ title: courses.title, slug: courses.slug })
          .from(courses)
          .where(eq(courses.id, row.courseId))
          .limit(1);
        courseTitle = course?.title ?? "Course";
      }

      return {
        id: row.id,
        title: row.title,
        courseId: row.courseId ?? "",
        courseTitle,
        status: toLearnerAssignmentStatus(row.dueDate, submission),
        dueDate: row.dueDate?.toISOString() ?? new Date().toISOString(),
        submittedAt: submission?.submittedAt?.toISOString(),
        score: submission?.score ?? undefined,
        maxScore: row.maxScore,
      } satisfies Assignment;
    })
  );
}

export async function fetchAssignmentDetailAction(assignmentId: string) {
  const userId = await requireUserId();
  const assignment = await getHomeworkAssignmentById(assignmentId);
  if (!assignment || assignment.publishStatus !== "published") return null;
  const profile = await getProfileByUserId(userId);
  const allowed = await canUserAccessHomework(assignment, userId, profile?.department);
  if (!allowed) return null;
  const submission = await getUserSubmission(assignmentId, userId);
  return { assignment, submission };
}

export async function submitAssignmentAction(input: unknown) {
  const userId = await requireUserId();
  const data = submitAssignmentSchema.parse(input);
  const assignment = await getHomeworkAssignmentById(data.assignmentId);
  if (!assignment || assignment.publishStatus !== "published") {
    throw new Error("Assignment not available");
  }
  const profile = await getProfileByUserId(userId);
  const allowed = await canUserAccessHomework(assignment, userId, profile?.department);
  if (!allowed) throw new Error("Assignment not available");

  const db = getDb();
  const existing = await getUserSubmission(data.assignmentId, userId);
  const content = data.content ?? "";

  let score: number | null = null;
  let feedback: string | null = null;

  if (assignment.submissionType === "coding") {
    const checks = assignment.meta?.coding?.checks ?? [];
    if (checks.length && content.trim()) {
      const { evaluateCodingChecks, codingChecksSummary } = await import(
        "@/lib/coding-checks"
      );
      const results = evaluateCodingChecks(content, checks);
      const summary = codingChecksSummary(results);
      score = Math.round((assignment.maxScore * summary.percentage) / 100);
      feedback = [
        `Automated checks: ${summary.passed}/${summary.total} passed (${summary.percentage}%).`,
        ...results.map((r) => `${r.passed ? "✓" : "✗"} ${r.label} — ${r.detail}`),
        summary.allPassed
          ? "All checks passed — awaiting instructor confirmation."
          : "Some checks failed — instructor will review.",
      ].join("\n");
    } else if (!checks.length) {
      feedback = "Submitted for manual coding review (no automated checks configured).";
    }
  }

  const payload = {
    content,
    url: data.url || null,
    status: "submitted" as const,
    submittedAt: new Date(),
    ...(score != null ? { score } : {}),
    ...(feedback != null ? { feedback } : {}),
  };

  if (existing) {
    const [updated] = await db
      .update(assignmentSubmissions)
      .set(payload)
      .where(eq(assignmentSubmissions.id, existing.id))
      .returning();
    revalidatePath("/dashboard/assignments");
    return updated;
  }

  const [created] = await db
    .insert(assignmentSubmissions)
    .values({
      assignmentId: data.assignmentId,
      userId,
      ...payload,
    })
    .returning();

  revalidatePath("/dashboard/assignments");
  return created;
}

export async function fetchAdminAssignmentsAction() {
  await requireAdminOrInstructor();
  const rows = await listHomeworkAssignments();
  return Promise.all(
    rows.map(async (row) => {
      const assignees =
        row.scope === "user" ? await listAssigneesForAssignment(row.id) : [];
      return {
        ...row,
        submissionsCount: (await listSubmissionsForAssignment(row.id)).length,
        assigneeCount: assignees.length,
      };
    })
  );
}

export async function fetchAdminAssignmentDetailAction(assignmentId: string) {
  await requireAdminOrInstructor();
  const assignment = await getHomeworkAssignmentById(assignmentId);
  if (!assignment) return null;
  const submissions = await listSubmissionsForAssignment(assignmentId);
  const assignees = await listAssigneesForAssignment(assignmentId);
  return { assignment, submissions, assignees };
}

export async function createAssignmentAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = createAssignmentSchema.parse(input);
  const scope = data.scope ?? "department";
  const db = getDb();
  const [created] = await db
    .insert(homeworkAssignments)
    .values({
      title: data.title,
      description: data.description ?? "",
      courseId: data.courseId ?? null,
      maxScore: data.maxScore ?? 100,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      submissionType: data.submissionType ?? "text",
      meta: data.meta ?? {},
      publishStatus: "draft",
      scope,
      departmentId: scope === "department" ? (data.departmentId ?? null) : null,
    })
    .returning();

  if (scope === "user" && data.userIds?.length) {
    await replaceAssignmentAssignees(created.id, data.userIds);
  }

  revalidatePath("/dashboard/admin/assignments");
  return created;
}

export async function updateAssignmentAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = updateAssignmentSchema.parse(input);
  const { id, dueDate, userIds, scope, departmentId, ...rest } = data;

  if (scope === "department" && departmentId === undefined) {
    const existing = await getHomeworkAssignmentById(id);
    if (!existing?.departmentId && !departmentId) {
      throw new Error("Department is required when scope is department");
    }
  }
  if (scope === "user" && (!userIds || userIds.length === 0)) {
    const existingAssignees = await listAssigneesForAssignment(id);
    if (existingAssignees.length === 0) {
      throw new Error("Select at least one person when scope is user");
    }
  }

  const db = getDb();
  const patch: Record<string, unknown> = {
    ...rest,
    updatedAt: new Date(),
  };
  if (dueDate !== undefined) {
    patch.dueDate = dueDate ? new Date(dueDate) : null;
  }
  if (scope !== undefined) {
    patch.scope = scope;
    if (scope === "org") {
      patch.departmentId = null;
    } else if (scope === "department") {
      if (departmentId !== undefined) patch.departmentId = departmentId;
    } else if (scope === "user") {
      patch.departmentId = null;
    }
  } else if (departmentId !== undefined) {
    patch.departmentId = departmentId;
  }

  const [updated] = await db
    .update(homeworkAssignments)
    .set(patch)
    .where(eq(homeworkAssignments.id, id))
    .returning();

  const effectiveScope = scope ?? updated?.scope;
  if (effectiveScope === "user" && userIds) {
    await replaceAssignmentAssignees(id, userIds);
  } else if (scope === "org" || scope === "department") {
    await replaceAssignmentAssignees(id, []);
  }

  revalidatePath("/dashboard/admin/assignments");
  revalidatePath("/dashboard/assignments");
  return updated;
}

export async function deleteAssignmentAction(id: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  await db.delete(homeworkAssignments).where(eq(homeworkAssignments.id, id));
  revalidatePath("/dashboard/admin/assignments");
  return { ok: true };
}

export async function reviewSubmissionAction(input: unknown): Promise<
  | { ok: true }
  | { ok: false; code: "reason_required" | "not_found"; message: string }
> {
  const reviewerId = await requireAdminOrInstructor();
  const parsed = reviewSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    const message =
      parsed.error.issues.find((issue) => issue.path[0] === "feedback")?.message ??
      "Invalid review.";
    return { ok: false, code: "reason_required", message };
  }
  const data = parsed.data;
  const submission = await getSubmissionById(data.submissionId);
  if (!submission) {
    return { ok: false, code: "not_found", message: "Submission not found." };
  }

  const now = new Date();
  const reason =
    data.status === "rejected" ? toPlainTextComment(data.feedback ?? "") : data.feedback;
  if (data.status === "rejected" && !reason) {
    return { ok: false, code: "reason_required", message: "A comment is required when rejecting." };
  }
  const db = getDb();
  await db
    .update(assignmentSubmissions)
    .set({
      status: data.status,
      score: data.score ?? submission.score,
      feedback: reason ?? submission.feedback,
      gradedAt:
        data.status === "graded" || data.status === "approved" || data.status === "rejected"
          ? now
          : submission.gradedAt,
      ...(data.status === "rejected"
        ? { reviewedBy: reviewerId, reviewedAt: now }
        : {}),
    })
    .where(eq(assignmentSubmissions.id, data.submissionId));

  if (data.status === "rejected" && reason) {
    const assignment = await getHomeworkAssignmentById(submission.assignmentId);
    await db.insert(notifications).values({
      userId: submission.userId,
      title: "Assignment needs revision",
      message: `${assignment?.title ?? "Assignment"}: ${reason}`,
      type: "warning",
      href: `/dashboard/assignments/${submission.assignmentId}`,
      read: 0,
    });
  }

  revalidatePath("/dashboard/admin/assignments");
  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

const PENDING_COURSE_PREFIX = "pending-course-";
const LOCKED_PATH_PREFIX = "locked-path-";

async function requirementsForPath(
  userId: string,
  pathId: string
): Promise<CertificateRequirement[]> {
  const steps = await getPathSteps(pathId);
  const items: CertificateRequirement[] = [];

  for (const step of steps) {
    if (step.stepType === "assessment" || step.assessmentId) {
      const assessmentId = step.assessmentId;
      if (!assessmentId) {
        items.push({
          id: step.id,
          title: step.title || "Assessment",
          type: "assessment",
          status: "unavailable",
          href: null,
        });
        continue;
      }
      const assessment = await getAssessmentById(assessmentId);
      const passed = await hasPassedAssessment(userId, assessmentId);
      const published = assessment?.publishStatus === "published";
      items.push({
        id: step.id,
        title: assessment?.title || step.title || "Assessment",
        type: "assessment",
        status: passed ? "done" : published ? "todo" : "unavailable",
        href: published ? `/dashboard/assessments/${assessmentId}` : null,
      });
      continue;
    }

    const courseId = step.courseId;
    if (!courseId) {
      items.push({
        id: step.id,
        title: step.title || "Unlinked course",
        type: "course",
        status: "unavailable",
        href: null,
      });
      continue;
    }

    const row = await getCourseById(courseId);
    const course = row?.course;
    if (!course || course.publishStatus !== "published") {
      items.push({
        id: step.id,
        title: course?.title || step.title || "Course",
        type: "course",
        status: "unavailable",
        href: null,
      });
      continue;
    }

    const snap = await getCourseProgressForUser(userId, courseId);
    items.push({
      id: step.id,
      title: course.title,
      type: "course",
      status: snap.status === "completed" ? "done" : "todo",
      href: courseResumePath(course.slug, course.id, snap.nextAction),
    });
  }

  return items;
}

async function pendingCourseCertificates(
  userId: string,
  earned: (typeof certificates.$inferSelect)[]
): Promise<Certificate[]> {
  const earnedAssessmentIds = new Set(
    earned
      .filter((c) => c.status === "earned" && c.assessmentId)
      .map((c) => c.assessmentId as string)
  );
  const earnedCourseIds = new Set(
    earned
      .filter((c) => c.status === "earned" && c.courseId)
      .map((c) => c.courseId as string)
  );

  const [activeIds, assignments] = await Promise.all([
    getUserActiveCourseIds(userId, 48),
    listAssignmentsForUser(userId),
  ]);
  const courseIds = [...new Set([...activeIds, ...assignments.map((a) => a.courseId)])];
  const pending: Certificate[] = [];

  for (const courseId of courseIds) {
    if (earnedCourseIds.has(courseId)) continue;
    const snap = await getCourseProgressForUser(userId, courseId);
    if (snap.status !== "content_complete" || !snap.assessmentId) continue;
    if (earnedAssessmentIds.has(snap.assessmentId)) continue;

    const row = await getCourseById(courseId);
    const course = row?.course;
    if (!course || course.publishStatus !== "published") continue;

    const href = `/dashboard/assessments/${snap.assessmentId}`;
    pending.push({
      id: `${PENDING_COURSE_PREFIX}${courseId}`,
      title: `${course.title} Certificate`,
      department: course.departmentId,
      level: course.level,
      status: "pending",
      credentialId: "PENDING",
      skills: [],
      assessmentId: snap.assessmentId,
      courseSlug: course.slug,
      takeAssessmentHref: href,
      requirements: [
        {
          id: snap.assessmentId,
          title: "Knowledge check",
          type: "assessment",
          status: "todo",
          href,
        },
      ],
    });
  }

  return pending;
}

function mapCertificateRow(
  row: typeof certificates.$inferSelect,
  lockedFallback?: boolean
): Certificate {
  let status: Certificate["status"] = "earned";
  if (row.status === "revoked" || row.status === "expired") status = "expired";
  else if (row.status === "pending") status = "pending";
  else if (lockedFallback) status = "locked";
  else status = "earned";

  return {
    id: row.id,
    title: row.title,
    department: row.departmentId,
    level: row.level,
    status,
    issuedAt: row.issuedAt?.toISOString().slice(0, 10),
    expiresAt: row.expiresAt?.toISOString().slice(0, 10),
    credentialId: row.credentialId,
    score: row.score ?? undefined,
    skills: row.skills,
  };
}

export async function fetchLearnerCertificatesAction(): Promise<Certificate[]> {
  const userId = await requireUserId();
  const earned = await listUserCertificates(userId);
  const mapped = earned.map((row) => mapCertificateRow(row));

  // Locked opportunities: published paths with certificate titles not yet earned
  const paths = await listLearningPaths({ publishStatus: "published" });
  const earnedPathIds = new Set(
    earned.filter((c) => c.status === "earned").map((c) => c.pathId).filter(Boolean)
  );
  const locked: Certificate[] = [];
  for (const p of paths) {
    if (!p.certificateTitle || earnedPathIds.has(p.id)) continue;
    const requirements = await requirementsForPath(userId, p.id);
    locked.push({
      id: `${LOCKED_PATH_PREFIX}${p.id}`,
      title: p.certificateTitle,
      department: p.departmentId,
      level: p.level,
      status: "locked",
      credentialId: "PENDING",
      skills: p.skills,
      requirements,
    });
  }

  const pending = await pendingCourseCertificates(userId, earned);
  return [...mapped, ...locked, ...pending];
}

export async function fetchCertificateDetailAction(id: string): Promise<{
  certificate: Certificate;
  holderName: string | null;
  verifyUrl: string | null;
} | null> {
  const userId = await requireUserId();
  if (id.startsWith(LOCKED_PATH_PREFIX)) {
    const pathId = id.slice(LOCKED_PATH_PREFIX.length);
    const path = await getLearningPathById(pathId);
    if (!path) return null;
    const requirements = await requirementsForPath(userId, pathId);
    return {
      certificate: {
        id,
        title: path.certificateTitle ?? path.title,
        department: path.departmentId,
        level: path.level,
        status: "locked",
        credentialId: "PENDING",
        skills: path.skills,
        requirements,
      },
      holderName: null,
      verifyUrl: null,
    };
  }

  if (id.startsWith(PENDING_COURSE_PREFIX)) {
    const pending = await pendingCourseCertificates(userId, await listUserCertificates(userId));
    const certificate = pending.find((c) => c.id === id);
    if (!certificate) return null;
    return { certificate, holderName: null, verifyUrl: null };
  }

  const row = await getCertificateById(id);
  if (!row || row.userId !== userId) return null;

  const db = getDb();
  const [holder] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  return {
    certificate: mapCertificateRow(row),
    holderName: holder?.name ?? "Learner",
    verifyUrl: `/verify/${row.credentialId}`,
  };
}

export async function fetchAdminCertificatesAction() {
  await requireAdminOrInstructor();
  return listAllCertificates();
}

export async function revokeCertificateAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = revokeCertificateSchema.parse(input);
  const db = getDb();
  const [updated] = await db
    .update(certificates)
    .set({
      status: "revoked",
      revokedAt: new Date(),
      revokeReason: data.reason,
    })
    .where(eq(certificates.id, data.certificateId))
    .returning();
  revalidatePath("/dashboard/admin/certificates");
  revalidatePath("/dashboard/certificates");
  return updated;
}

export async function reissueCertificateAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = reissueCertificateSchema.parse(input);
  const existing = await getCertificateById(data.certificateId);
  if (!existing) throw new Error("Certificate not found");

  const db = getDb();
  await db
    .update(certificates)
    .set({ status: "revoked", revokedAt: new Date(), revokeReason: "Reissued" })
    .where(eq(certificates.id, existing.id));

  const [created] = await db
    .insert(certificates)
    .values({
      userId: existing.userId,
      credentialId: generateCredentialId(),
      title: existing.title,
      departmentId: existing.departmentId,
      level: existing.level,
      status: "earned",
      courseId: existing.courseId,
      assessmentId: existing.assessmentId,
      pathId: existing.pathId,
      attemptId: existing.attemptId,
      score: existing.score,
      skills: existing.skills,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 2 * 86400000),
    })
    .returning();

  revalidatePath("/dashboard/admin/certificates");
  revalidatePath("/dashboard/certificates");
  return created;
}

export async function verifyCredentialAction(credentialId: string) {
  const row = await getCertificateByCredentialId(credentialId);
  if (!row) {
    return { valid: false as const, reason: "Credential not found" };
  }
  if (row.status === "revoked") {
    return {
      valid: false as const,
      reason: row.revokeReason ?? "Credential revoked",
      certificate: mapCertificateRow(row),
    };
  }
  if (row.status === "expired" || (row.expiresAt && row.expiresAt < new Date())) {
    return {
      valid: false as const,
      reason: "Credential expired",
      certificate: mapCertificateRow(row),
    };
  }

  const db = getDb();
  const [holder] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  return {
    valid: true as const,
    certificate: mapCertificateRow(row),
    holderName: holder?.name ?? "Learner",
    holderEmail: holder?.email ?? null,
  };
}

export async function fetchCoursesForAdminSelectAction() {
  await requireAdminOrInstructor();
  const db = getDb();
  return db
    .select({ id: courses.id, title: courses.title, slug: courses.slug })
    .from(courses)
    .where(eq(courses.publishStatus, "published"));
}

export async function fetchAssessmentsForAdminSelectAction() {
  await requireAdminOrInstructor();
  const rows = await listAssessments({ publishStatus: "published" });
  return rows.map((row) => ({ id: row.id, title: row.title }));
}
