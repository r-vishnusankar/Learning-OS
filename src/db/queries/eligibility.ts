import { and, eq, inArray } from "drizzle-orm";
import { nextLearningLevel } from "@/db/catalog/employees";
import { normalizeCareerLevel } from "@/constants/navigation";
import { getDb } from "@/db";
import { getCourseProgressForUser } from "@/db/queries/courses";
import type { CourseProgressStatus } from "@/lib/course-progress";
import {
  assessmentAttempts,
  assessments,
  courseAssignments,
  courses,
  profiles,
  users,
} from "@/db/schema";
import type { DepartmentId, LearningLevel } from "@/types";

export type CourseCareerState =
  | "not_started"
  | "in_progress"
  | "assessment_pending"
  | "certified";

export type CourseEligibilityRow = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  assignmentId: string;
  lessonProgress: number;
  assessmentId: string | null;
  assessmentPassed: boolean;
  state: CourseCareerState;
};

export type PromotionEligibility = {
  userId: string;
  name: string;
  email: string;
  department: DepartmentId;
  designation: string;
  currentLevel: LearningLevel;
  nextLevel: LearningLevel | null;
  status: "in_progress" | "eligible" | "blocked" | "max_level";
  courses: CourseEligibilityRow[];
  certifiedCount: number;
  requiredCount: number;
  eligibleAt: string | null;
};

function deriveState(
  status: CourseProgressStatus,
  assessmentPassed: boolean
): CourseCareerState {
  if (status === "completed" && assessmentPassed) return "certified";
  if (status === "completed" || status === "content_complete") return "assessment_pending";
  if (status === "in_progress") return "in_progress";
  return "not_started";
}

export async function getAssessmentForCourse(courseId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.courseId, courseId), eq(assessments.publishStatus, "published"))
    )
    .limit(1);
  return row ?? null;
}

export async function hasPassedAssessment(userId: string, assessmentId: string) {
  const db = getDb();
  const rows = await db
    .select({ passed: assessmentAttempts.passed })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, userId),
        eq(assessmentAttempts.assessmentId, assessmentId)
      )
    );
  return rows.some((r) => r.passed === true);
}

export async function computePromotionEligibility(
  userId: string
): Promise<PromotionEligibility | null> {
  const db = getDb();
  const [person] = await db
    .select({
      userId: profiles.userId,
      name: users.name,
      email: users.email,
      department: profiles.department,
      designation: profiles.designation,
      level: profiles.level,
      status: profiles.status,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!person || person.status !== "active") return null;

  const currentLevel = normalizeCareerLevel(person.level, person.department);
  const nextLevel = nextLearningLevel(person.level, person.department);

  const assignmentRows = await db
    .select({
      assignmentId: courseAssignments.id,
      courseId: courses.id,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      courseLevel: courses.level,
      courseDept: courses.departmentId,
      mandatory: courseAssignments.mandatory,
    })
    .from(courseAssignments)
    .innerJoin(courses, eq(courses.id, courseAssignments.courseId))
    .where(
      and(
        eq(courseAssignments.userId, userId),
        eq(courseAssignments.mandatory, true),
        eq(courses.level, currentLevel),
        eq(courses.departmentId, person.department)
      )
    );

  const courseRows: CourseEligibilityRow[] = [];

  for (const row of assignmentRows) {
    const snap = await getCourseProgressForUser(userId, row.courseId);
    const state = deriveState(snap.status, snap.assessmentPassed);
    courseRows.push({
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      courseSlug: row.courseSlug,
      assignmentId: row.assignmentId,
      lessonProgress: snap.percent,
      assessmentId: snap.assessmentId,
      assessmentPassed: snap.assessmentPassed,
      state,
    });
  }

  const requiredCount = courseRows.length;
  const certifiedCount = courseRows.filter((c) => c.state === "certified").length;

  let status: PromotionEligibility["status"];
  if (!nextLevel) {
    status = "max_level";
  } else if (requiredCount === 0) {
    status = "blocked";
  } else if (certifiedCount === requiredCount) {
    status = "eligible";
  } else if (courseRows.some((c) => c.state === "assessment_pending" && !c.assessmentId)) {
    status = "blocked";
  } else {
    status = "in_progress";
  }

  return {
    userId: person.userId,
    name: person.name ?? "Unknown",
    email: person.email ?? "",
    department: person.department,
    designation: person.designation,
    currentLevel,
    nextLevel,
    status,
    courses: courseRows,
    certifiedCount,
    requiredCount,
    eligibleAt: status === "eligible" ? new Date().toISOString() : null,
  };
}

export async function listPromotionEligibilities(filters?: {
  departmentId?: DepartmentId;
  status?: PromotionEligibility["status"] | "all";
}): Promise<PromotionEligibility[]> {
  const db = getDb();
  let people = await db
    .select({ userId: profiles.userId, department: profiles.department })
    .from(profiles)
    .where(eq(profiles.status, "active"));

  if (filters?.departmentId) {
    people = people.filter((p) => p.department === filters.departmentId);
  }

  const results: PromotionEligibility[] = [];
  for (const p of people) {
    const elig = await computePromotionEligibility(p.userId);
    if (!elig) continue;
    if (filters?.status && filters.status !== "all" && elig.status !== filters.status) {
      continue;
    }
    results.push(elig);
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/** Assign published courses for a user's current dept+level (rule source). */
export async function assignLevelCoursesForUser(userId: string, assignedBy?: string | null) {
  const db = getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!profile) return { inserted: 0, skipped: 0 };

  const level = normalizeCareerLevel(profile.level, profile.department);

  const matching = await db
    .select({ id: courses.id, title: courses.title, slug: courses.slug })
    .from(courses)
    .where(
      and(
        eq(courses.departmentId, profile.department),
        eq(courses.level, level),
        eq(courses.publishStatus, "published")
      )
    );

  let inserted = 0;
  let skipped = 0;

  for (const course of matching) {
    const [existing] = await db
      .select({ id: courseAssignments.id })
      .from(courseAssignments)
      .where(
        and(eq(courseAssignments.courseId, course.id), eq(courseAssignments.userId, userId))
      )
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    await db.insert(courseAssignments).values({
      courseId: course.id,
      userId,
      departmentId: profile.department,
      scope: "user",
      mandatory: true,
      source: "rule",
      assignedBy: assignedBy ?? null,
    });
    inserted += 1;
  }

  return { inserted, skipped, courses: matching };
}

export async function getUsersByIds(userIds: string[]) {
  if (userIds.length === 0) return [];
  const db = getDb();
  return db.select().from(users).where(inArray(users.id, userIds));
}
