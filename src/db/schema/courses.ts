import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { DepartmentId, Difficulty, LearningCategory, LearningLevel } from "@/types";
import { departments, users } from "./auth";

export type PublishStatus = "draft" | "review" | "published" | "archived";
export type LessonContentType = "video" | "pdf" | "article" | "external_link" | "presentation";
export type MediaAssetType = "image" | "video" | "pdf" | "document" | "other";

export const categories = pgTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("BookOpen"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const instructors = pgTable("instructor", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  avatar: text("avatar"),
  title: text("title").notNull().default("Instructor"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const mediaAssets = pgTable("media_asset", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").$type<MediaAssetType>().notNull().default("other"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const courses = pgTable("course", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  departmentId: text("department_id")
    .$type<DepartmentId>()
    .notNull()
    .references(() => departments.id),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  instructorId: text("instructor_id").references(() => instructors.id, { onDelete: "set null" }),
  level: text("level").$type<LearningLevel>().notNull().default("beginner"),
  difficulty: text("difficulty").$type<Difficulty>().notNull().default("beginner"),
  /** Role-based (career track) vs Goal-based (skill/objective) learning. */
  learningCategory: text("learning_category")
    .$type<LearningCategory>()
    .notNull()
    .default("role"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  language: text("language").notNull().default("en"),
  publishStatus: text("publish_status").$type<PublishStatus>().notNull().default("draft"),
  learningObjectives: jsonb("learning_objectives").$type<string[]>().notNull().default([]),
  prerequisites: jsonb("prerequisites").$type<string[]>().notNull().default([]),
  xpReward: integer("xp_reward").notNull().default(0),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  rating: integer("rating").notNull().default(0),
  isTrending: boolean("is_trending").notNull().default(false),
  openToAll: boolean("open_to_all").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const modules = pgTable("module", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const lessons = pgTable("lesson", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  moduleId: text("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").$type<LessonContentType>().notNull(),
  content: text("content"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  orderIndex: integer("order_index").notNull().default(0),
  isPreview: boolean("is_preview").notNull().default(false),
  learningObjectives: jsonb("learning_objectives").$type<string[]>().notNull().default([]),
  prerequisites: jsonb("prerequisites").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const lessonResources = pgTable("lesson_resource", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
