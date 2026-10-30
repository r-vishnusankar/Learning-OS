import { integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { DepartmentId, LearningLevel } from "@/types";
import type { QuestionMeta } from "@/types/coding";
import { departments, users } from "./auth";
import { assessments } from "./assessments";
import { courses, type PublishStatus } from "./courses";

export type PathStepType = "course" | "assessment";
export type AssignmentSubmissionType = "text" | "url" | "github" | "file" | "coding";
export type SubmissionWorkflowStatus =
  | "pending"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "graded";
export type CredentialStatus = "earned" | "pending" | "revoked" | "expired";

export const learningPaths = pgTable("lms_learning_path", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  departmentId: text("department_id")
    .$type<DepartmentId>()
    .notNull()
    .references(() => departments.id),
  level: text("level").$type<LearningLevel>().notNull().default("intermediate"),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  publishStatus: text("publish_status").$type<PublishStatus>().notNull().default("draft"),
  certificateTitle: text("certificate_title"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const pathSteps = pgTable("lms_path_step", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pathId: text("path_id")
    .notNull()
    .references(() => learningPaths.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  stepType: text("step_type").$type<PathStepType>().notNull().default("course"),
  courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),
  assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "set null" }),
  orderIndex: integer("order_index").notNull().default(0),
});

export const pathEnrollments = pgTable(
  "lms_path_enrollment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pathId: text("path_id")
      .notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    progress: integer("progress").notNull().default(0),
    enrolledAt: timestamp("enrolled_at", { mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (t) => [uniqueIndex("lms_path_enrollment_user_path").on(t.pathId, t.userId)]
);

export type HomeworkAssignmentScope = "org" | "department" | "user";

export const homeworkAssignments = pgTable("lms_assignment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),
  maxScore: integer("max_score").notNull().default(100),
  dueDate: timestamp("due_date", { mode: "date" }),
  submissionType: text("submission_type")
    .$type<AssignmentSubmissionType>()
    .notNull()
    .default("text"),
  /** Coding language, starter code, automated checks, etc. */
  meta: jsonb("meta").$type<QuestionMeta>().notNull().default({}),
  publishStatus: text("publish_status").$type<PublishStatus>().notNull().default("draft"),
  /** Who can see this homework: org (all), one department, or specific users. */
  scope: text("scope").$type<HomeworkAssignmentScope>().notNull().default("org"),
  departmentId: text("department_id")
    .$type<DepartmentId | null>()
    .references(() => departments.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/** Specific people when homeworkAssignments.scope === "user". */
export const assignmentAssignees = pgTable(
  "lms_assignment_assignee",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => homeworkAssignments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lms_assignment_assignee_unique").on(t.assignmentId, t.userId)]
);

export const assignmentSubmissions = pgTable(
  "lms_assignment_submission",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => homeworkAssignments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<SubmissionWorkflowStatus>().notNull().default("pending"),
    content: text("content").notNull().default(""),
    url: text("url"),
    score: integer("score"),
    feedback: text("feedback"),
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    submittedAt: timestamp("submitted_at", { mode: "date" }),
    gradedAt: timestamp("graded_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lms_assignment_submission_user").on(t.assignmentId, t.userId)]
);

export const certificates = pgTable(
  "lms_certificate",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").notNull(),
    title: text("title").notNull(),
    departmentId: text("department_id")
      .$type<DepartmentId>()
      .notNull()
      .references(() => departments.id),
    level: text("level").$type<LearningLevel>().notNull().default("intermediate"),
    status: text("status").$type<CredentialStatus>().notNull().default("earned"),
    courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),
    assessmentId: text("assessment_id").references(() => assessments.id, { onDelete: "set null" }),
    pathId: text("path_id").references(() => learningPaths.id, { onDelete: "set null" }),
    attemptId: text("attempt_id"),
    score: integer("score"),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    issuedAt: timestamp("issued_at", { mode: "date" }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    revokeReason: text("revoke_reason"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lms_certificate_credential").on(t.credentialId)]
);
