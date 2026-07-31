"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { courses, users } from "@/db/schema";
import {
  assignmentSubmissions,
  certificates,
  homeworkAssignments,
  learningPaths,
  pathEnrollments,
  pathSteps,
} from "@/db/schema/certification";
import {
  countPathSteps,
  findActiveCertForAssessment,
  findExistingCertForAttempt,
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
  listVisibleHomeworkForUser,
  replaceAssignmentAssignees,
} from "@/db/queries/certification";
import { requireAdminOrInstructor, requireUserId } from "@/lib/auth-utils";
import { generateCredentialId } from "@/lib/credentials";
import { getProfileByUserId } from "@/lib/profile";
import type { Assignment, AssignmentStatus, Certificate, LearningPath } from "@/types";
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
  const existingAttempt = await findExistingCertForAttempt(input.userId, input.attemptId);
  if (existingAttempt) return existingAttempt;

  const active = await findActiveCertForAssessment(input.userId, input.assessmentId);
  if (active) return active;

  const db = getDb();
  const [created] = await db
    .insert(certificates)
    .values({
      userId: input.userId,
      credentialId: generateCredentialId(),
      title: input.title.includes("Certificate")
        ? input.title
        : `${input.title} Certificate`,
      departmentId: input.departmentId,
      level: input.level,
      status: "earned",
      courseId: input.courseId ?? null,
      assessmentId: input.assessmentId,
      attemptId: input.attemptId,
      score: input.score,
      skills: input.skills ?? [],
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 2 * 86400000),
    })
    .returning();

  revalidatePath("/dashboard/certificates");
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
        durationHours: Math.round(row.durationMinutes / 60) || 1,
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
  const courseRows =
    courseIds.length > 0
      ? await db
          .select({ id: courses.id, slug: courses.slug, title: courses.title })
          .from(courses)
          .where(inArray(courses.id, courseIds))
      : [];
  const courseById = new Map(courseRows.map((c) => [c.id, c]));

  const enrichedSteps = steps.map((step) => {
    const course = step.courseId ? courseById.get(step.courseId) : undefined;
    return {
      ...step,
      courseSlug: course?.slug ?? null,
      courseTitle: course?.title ?? null,
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
      durationHours: Math.round(path.durationMinutes / 60) || 1,
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
  return { path, steps };
}

export async function createPathAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = createPathSchema.parse(input);
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
  return created;
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

export async function upsertPathStepAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = upsertPathStepSchema.parse(input);
  const db = getDb();

  if (data.id) {
    const [updated] = await db
      .update(pathSteps)
      .set({
        title: data.title,
        stepType: data.stepType,
        courseId: data.courseId ?? null,
        assessmentId: data.assessmentId ?? null,
        orderIndex: data.orderIndex ?? 0,
      })
      .where(eq(pathSteps.id, data.id))
      .returning();
    return updated;
  }

  const existing = await getPathSteps(data.pathId);
  const [created] = await db
    .insert(pathSteps)
    .values({
      pathId: data.pathId,
      title: data.title,
      stepType: data.stepType,
      courseId: data.courseId ?? null,
      assessmentId: data.assessmentId ?? null,
      orderIndex: data.orderIndex ?? existing.length,
    })
    .returning();
  return created;
}

export async function deletePathStepAction(stepId: string) {
  await requireAdminOrInstructor();
  const db = getDb();
  await db.delete(pathSteps).where(eq(pathSteps.id, stepId));
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

export async function reviewSubmissionAction(input: unknown) {
  await requireAdminOrInstructor();
  const data = reviewSubmissionSchema.parse(input);
  const submission = await getSubmissionById(data.submissionId);
  if (!submission) throw new Error("Submission not found");

  const db = getDb();
  const [updated] = await db
    .update(assignmentSubmissions)
    .set({
      status: data.status,
      score: data.score ?? submission.score,
      feedback: data.feedback ?? submission.feedback,
      gradedAt:
        data.status === "graded" || data.status === "approved" || data.status === "rejected"
          ? new Date()
          : submission.gradedAt,
    })
    .where(eq(assignmentSubmissions.id, data.submissionId))
    .returning();

  revalidatePath("/dashboard/admin/assignments");
  revalidatePath("/dashboard/assignments");
  return updated;
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
  const earnedPathIds = new Set(earned.map((c) => c.pathId).filter(Boolean));
  const locked: Certificate[] = paths
    .filter((p) => p.certificateTitle && !earnedPathIds.has(p.id))
    .map((p) => ({
      id: `locked-path-${p.id}`,
      title: p.certificateTitle!,
      department: p.departmentId,
      level: p.level,
      status: "locked" as const,
      credentialId: "PENDING",
      skills: p.skills,
    }));

  return [...mapped, ...locked];
}

export async function fetchCertificateDetailAction(id: string): Promise<{
  certificate: Certificate;
  holderName: string | null;
  verifyUrl: string | null;
} | null> {
  const userId = await requireUserId();
  if (id.startsWith("locked-path-")) {
    const pathId = id.replace("locked-path-", "");
    const path = await getLearningPathById(pathId);
    if (!path) return null;
    return {
      certificate: {
        id,
        title: path.certificateTitle ?? path.title,
        department: path.departmentId,
        level: path.level,
        status: "locked",
        credentialId: "PENDING",
        skills: path.skills,
      },
      holderName: null,
      verifyUrl: null,
    };
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
