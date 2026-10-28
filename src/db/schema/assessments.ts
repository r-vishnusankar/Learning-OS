import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { DepartmentId, LearningLevel } from "@/types";
import { departments, users } from "./auth";
import { courses } from "./courses";
import type { PublishStatus } from "./courses";
import type { QuestionMeta } from "@/types/coding";

export type QuestionType =
  | "mcq"
  | "multi_select"
  | "true_false"
  | "fill_blank"
  | "coding"
  | "case_study"
  | "essay";

export type AssessmentKind = "mcq" | "mixed" | "coding" | "case_study";
export type AttemptStatus = "in_progress" | "submitted" | "graded";

/** Use distinct table names to avoid clash with Sprint-2 stub `assessment` / `question_bank`. */
export const assessments = pgTable("lms_assessment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),
  departmentId: text("department_id")
    .$type<DepartmentId>()
    .notNull()
    .references(() => departments.id),
  level: text("level").$type<LearningLevel>().notNull().default("intermediate"),
  type: text("type").$type<AssessmentKind>().notNull().default("mixed"),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  passingScore: integer("passing_score").notNull().default(70),
  maxAttempts: integer("max_attempts").notNull().default(3),
  negativeMarking: boolean("negative_marking").notNull().default(false),
  randomize: boolean("randomize").notNull().default(true),
  publishStatus: text("publish_status").$type<PublishStatus>().notNull().default("draft"),
  dueDate: timestamp("due_date", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
},
(t) => [
  // Postgres unique indexes allow multiple NULLs, so unlinked assessments stay valid.
  uniqueIndex("lms_assessment_course_unique").on(t.courseId),
]);

export const questions = pgTable("lms_question", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  type: text("type").$type<QuestionType>().notNull(),
  options: jsonb("options").$type<string[]>().notNull().default([]),
  correctAnswers: jsonb("correct_answers").$type<string[]>().notNull().default([]),
  points: integer("points").notNull().default(5),
  difficulty: text("difficulty").notNull().default("medium"),
  skillTags: jsonb("skill_tags").$type<string[]>().notNull().default([]),
  bloomLevel: text("bloom_level").notNull().default("understand"),
  timeEstimateSeconds: integer("time_estimate_seconds").notNull().default(60),
  orderIndex: integer("order_index").notNull().default(0),
  /** Extra config (e.g. coding language, starter code, automated checks). */
  meta: jsonb("meta").$type<QuestionMeta>().notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const assessmentAttempts = pgTable("lms_assessment_attempt", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionOrder: jsonb("question_order").$type<string[]>().notNull().default([]),
  answers: jsonb("answers").$type<Record<string, string | string[]>>().notNull().default({}),
  score: integer("score"),
  maxScore: integer("max_score"),
  percentage: integer("percentage"),
  status: text("status").$type<AttemptStatus>().notNull().default("in_progress"),
  passed: boolean("passed"),
  startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
