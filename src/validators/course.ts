import { z } from "zod";

export const publishStatusSchema = z.enum(["draft", "review", "published", "archived"]);
export const lessonTypeSchema = z.enum(["video", "pdf", "article", "external_link", "presentation"]);
export const mediaTypeSchema = z.enum(["image", "video", "pdf", "document", "other"]);
export const departmentIdSchema = z.enum([
  "qa",
  "development",
  "ba",
  "hr",
  "marketing",
  "uiux",
  "devops",
]);
export const learningLevelSchema = z.enum([
  "beginner",
  "associate",
  "intermediate",
  "advanced",
  "senior",
  "lead",
  "architect",
  "expert",
  "qa_manager",
  "product_owner",
  "assistant_hr_manager",
  "hr_manager",
]);
export const difficultySchema = z.enum(["beginner", "intermediate", "advanced", "expert"]);
export const learningCategorySchema = z.enum(["role", "goal"]);

export const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  departmentId: departmentIdSchema,
  learningCategory: learningCategorySchema,
  level: learningLevelSchema.default("intermediate"),
  difficulty: difficultySchema.default("intermediate"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  instructorId: z.string().optional(),
  language: z.string().default("en"),
  xpReward: z.number().int().min(0).default(400),
  tags: z.array(z.string()).default([]),
  learningObjectives: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  isTrending: z.boolean().default(false),
  openToAll: z.boolean().default(true),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  id: z.string().uuid(),
  publishStatus: publishStatusSchema.optional(),
  durationMinutes: z.number().int().min(0).optional(),
});

export const createModuleSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
});

export const updateModuleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const createLessonSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(2).max(200),
  type: lessonTypeSchema,
  content: z.string().optional(),
  durationMinutes: z.number().int().min(0).default(10),
  isPreview: z.boolean().default(false),
  learningObjectives: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
});

export const updateLessonSchema = z.object({
  id: z.string().uuid(),
  moduleId: z.string().uuid().optional(),
  title: z.string().min(2).max(200).optional(),
  type: lessonTypeSchema.optional(),
  content: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(0).optional(),
  isPreview: z.boolean().optional(),
  learningObjectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
});

export const addLessonResourceSchema = z.object({
  lessonId: z.string().uuid(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
});

export const createMediaAssetSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: mediaTypeSchema.default("other"),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const upsertProgressSchema = z.object({
  lessonId: z.string().uuid(),
  percentage: z.number().int().min(0).max(100),
  completed: z.boolean().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpsertProgressInput = z.infer<typeof upsertProgressSchema>;
