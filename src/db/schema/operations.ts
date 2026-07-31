import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { DepartmentId } from "@/types";
import { departments, users, type NotificationType } from "./auth";
import { courses } from "./courses";

export type { NotificationType, EmployeeStatus } from "./auth";

/** How the assignment was targeted (resolved to per-user rows). */
export type CourseAssignmentScope = "org" | "department" | "user";

/**
 * Provenance for future lifecycle / annual-review plug-in.
 * Phase 1 only writes `manual`.
 */
export type CourseAssignmentSource = "manual" | "rule" | "onboarding" | "annual_review";

/** Enterprise course-to-user assignment (not homework). */
export const teams = pgTable("lms_team", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  departmentId: text("department_id")
    .$type<DepartmentId>()
    .notNull()
    .references(() => departments.id),
  managerId: text("manager_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const teamMembers = pgTable(
  "lms_team_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lms_team_member_unique").on(t.teamId, t.userId)]
);

/**
 * One row per (course, user). Org/dept assigns expand to members at write time.
 * Nullable planId/cycleId reserved for Employee Lifecycle / Annual Review.
 */
export const courseAssignments = pgTable(
  "course_assignment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
    departmentId: text("department_id").$type<DepartmentId | null>(),
    scope: text("scope").$type<CourseAssignmentScope>().notNull().default("user"),
    mandatory: boolean("mandatory").notNull().default(false),
    startDate: timestamp("start_date", { mode: "date" }),
    dueDate: timestamp("due_date", { mode: "date" }),
    source: text("source").$type<CourseAssignmentSource>().notNull().default("manual"),
    planId: text("plan_id"),
    cycleId: text("cycle_id"),
    assignedBy: text("assigned_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("course_assignment_course_user_unique").on(t.courseId, t.userId)]
);

export const badges = pgTable("badge", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
});

export const notifications = pgTable("lms_notification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").$type<NotificationType>().notNull().default("info"),
  href: text("href"),
  read: integer("read").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const auditLogs = pgTable("lms_audit_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
