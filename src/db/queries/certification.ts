import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assignmentAssignees,
  assignmentSubmissions,
  certificates,
  homeworkAssignments,
  learningPaths,
  pathEnrollments,
  pathSteps,
} from "@/db/schema";
import { users } from "@/db/schema/auth";
import type { HomeworkAssignmentScope } from "@/db/schema/certification";
import type { PublishStatus } from "@/db/schema/courses";
import type { DepartmentId, LearningLevel } from "@/types";
import { generateCredentialId } from "@/lib/credentials";
export { generateCredentialId };

export async function listLearningPaths(opts?: { publishStatus?: PublishStatus }) {
  const db = getDb();
  if (opts?.publishStatus) {
    return db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.publishStatus, opts.publishStatus))
      .orderBy(desc(learningPaths.updatedAt));
  }
  return db.select().from(learningPaths).orderBy(desc(learningPaths.updatedAt));
}

export async function getLearningPathById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(learningPaths).where(eq(learningPaths.id, id)).limit(1);
  return row ?? null;
}

export async function getPathSteps(pathId: string) {
  const db = getDb();
  return db
    .select()
    .from(pathSteps)
    .where(eq(pathSteps.pathId, pathId))
    .orderBy(asc(pathSteps.orderIndex));
}

export async function getPathEnrollment(pathId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(pathEnrollments)
    .where(and(eq(pathEnrollments.pathId, pathId), eq(pathEnrollments.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function listUserPathEnrollments(userId: string) {
  const db = getDb();
  return db.select().from(pathEnrollments).where(eq(pathEnrollments.userId, userId));
}

export async function countPathSteps(pathId: string) {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pathSteps)
    .where(eq(pathSteps.pathId, pathId));
  return row?.count ?? 0;
}

export async function listHomeworkAssignments(opts?: { publishStatus?: PublishStatus }) {
  const db = getDb();
  if (opts?.publishStatus) {
    return db
      .select()
      .from(homeworkAssignments)
      .where(eq(homeworkAssignments.publishStatus, opts.publishStatus))
      .orderBy(desc(homeworkAssignments.updatedAt));
  }
  return db.select().from(homeworkAssignments).orderBy(desc(homeworkAssignments.updatedAt));
}

export async function getHomeworkAssignmentById(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(homeworkAssignments)
    .where(eq(homeworkAssignments.id, id))
    .limit(1);
  return row ?? null;
}

export async function listAssigneesForAssignment(assignmentId: string) {
  const db = getDb();
  return db
    .select()
    .from(assignmentAssignees)
    .where(eq(assignmentAssignees.assignmentId, assignmentId));
}

export async function replaceAssignmentAssignees(assignmentId: string, userIds: string[]) {
  const db = getDb();
  await db
    .delete(assignmentAssignees)
    .where(eq(assignmentAssignees.assignmentId, assignmentId));
  if (userIds.length === 0) return;
  await db.insert(assignmentAssignees).values(
    userIds.map((userId) => ({
      assignmentId,
      userId,
    }))
  );
}

export async function canUserAccessHomework(
  assignment: {
    id: string;
    scope: HomeworkAssignmentScope;
    departmentId: DepartmentId | null;
  },
  userId: string,
  departmentId?: DepartmentId | null
) {
  if (assignment.scope === "org") return true;
  if (assignment.scope === "department") {
    return Boolean(departmentId) && assignment.departmentId === departmentId;
  }
  if (assignment.scope === "user") {
    const db = getDb();
    const [row] = await db
      .select({ id: assignmentAssignees.id })
      .from(assignmentAssignees)
      .where(
        and(
          eq(assignmentAssignees.assignmentId, assignment.id),
          eq(assignmentAssignees.userId, userId)
        )
      )
      .limit(1);
    return Boolean(row);
  }
  return false;
}

/** Published (or filtered) homework visible to this learner only. */
export async function listVisibleHomeworkForUser(
  userId: string,
  departmentId?: DepartmentId | null,
  opts?: { publishStatus?: PublishStatus }
) {
  const rows = await listHomeworkAssignments(opts);
  if (rows.length === 0) return [];

  const userScopedIds = rows.filter((r) => r.scope === "user").map((r) => r.id);
  const assignedIds = new Set<string>();
  if (userScopedIds.length > 0) {
    const db = getDb();
    const assigneeRows = await db
      .select({ assignmentId: assignmentAssignees.assignmentId })
      .from(assignmentAssignees)
      .where(
        and(
          eq(assignmentAssignees.userId, userId),
          inArray(assignmentAssignees.assignmentId, userScopedIds)
        )
      );
    for (const row of assigneeRows) assignedIds.add(row.assignmentId);
  }

  return rows.filter((row) => {
    if (row.scope === "org") return true;
    if (row.scope === "department") {
      return Boolean(departmentId) && row.departmentId === departmentId;
    }
    if (row.scope === "user") return assignedIds.has(row.id);
    return false;
  });
}

export async function getUserSubmission(assignmentId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.assignmentId, assignmentId),
        eq(assignmentSubmissions.userId, userId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function listSubmissionsForAssignment(assignmentId: string) {
  const db = getDb();
  return db
    .select()
    .from(assignmentSubmissions)
    .where(eq(assignmentSubmissions.assignmentId, assignmentId))
    .orderBy(desc(assignmentSubmissions.createdAt));
}

export async function getSubmissionById(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(assignmentSubmissions)
    .where(eq(assignmentSubmissions.id, id))
    .limit(1);
  return row ?? null;
}

export async function listUserCertificates(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(certificates)
    .where(eq(certificates.userId, userId))
    .orderBy(desc(certificates.createdAt));
}

export async function listAllCertificates() {
  const db = getDb();
  const rows = await db
    .select({
      cert: certificates,
      userName: users.name,
      userEmail: users.email,
    })
    .from(certificates)
    .leftJoin(users, eq(users.id, certificates.userId))
    .orderBy(desc(certificates.createdAt));
  return rows.map(({ cert, userName, userEmail }) => ({
    ...cert,
    userName: userName ?? null,
    userEmail: userEmail ?? null,
  }));
}

export async function getCertificateById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1);
  return row ?? null;
}

export async function getCertificateByCredentialId(credentialId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.credentialId, credentialId))
    .limit(1);
  return row ?? null;
}

export async function findExistingCertForAttempt(userId: string, attemptId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.attemptId, attemptId)))
    .limit(1);
  return row ?? null;
}

export async function findActiveCertForAssessment(userId: string, assessmentId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, userId),
        eq(certificates.assessmentId, assessmentId),
        eq(certificates.status, "earned")
      )
    )
    .limit(1);
  return row ?? null;
}

/** Persist a certificate for a passed auto-graded attempt. Same insert as mintCertificateForAssessmentPass. */
export async function insertCertificateForAssessmentPass(input: {
  userId: string;
  assessmentId: string;
  attemptId: string;
  title: string;
  departmentId: DepartmentId;
  level: LearningLevel;
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

  return created;
}
