import { z } from "zod";
import { departmentIdSchema, learningLevelSchema, publishStatusSchema } from "./course";

export const questionTypeSchema = z.enum([
  "mcq",
  "multi_select",
  "true_false",
  "fill_blank",
  "coding",
  "case_study",
  "essay",
]);

export const assessmentKindSchema = z.enum(["mcq", "mixed", "coding", "case_study"]);

export const createAssessmentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).default(""),
  departmentId: departmentIdSchema,
  level: learningLevelSchema.default("intermediate"),
  type: assessmentKindSchema.default("mixed"),
  courseId: z.string().uuid().optional().nullable(),
  durationMinutes: z.number().int().min(5).default(60),
  passingScore: z.number().int().min(1).max(100).default(70),
  maxAttempts: z.number().int().min(1).default(3),
  negativeMarking: z.boolean().default(false),
  randomize: z.boolean().default(true),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateAssessmentSchema = createAssessmentSchema.partial().extend({
  id: z.string().uuid(),
  publishStatus: publishStatusSchema.optional(),
});

export const createQuestionSchema = z.object({
  assessmentId: z.string().uuid(),
  prompt: z.string().min(3),
  type: questionTypeSchema,
  options: z.array(z.string()).default([]),
  correctAnswers: z.array(z.string()).default([]),
  points: z.number().int().min(1).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  skillTags: z.array(z.string()).default([]),
  bloomLevel: z.string().default("understand"),
  timeEstimateSeconds: z.number().int().min(10).default(60),
  meta: z
    .object({
      coding: z
        .object({
          language: z
            .enum(["javascript", "typescript", "python", "sql", "java", "other"])
            .default("javascript"),
          starterCode: z.string().optional(),
          checks: z
            .array(
              z.object({
                id: z.string(),
                label: z.string(),
                kind: z.enum([
                  "contains",
                  "not_contains",
                  "regex",
                  "min_lines",
                  "min_chars",
                ]),
                value: z.string(),
              })
            )
            .default([]),
        })
        .optional(),
    })
    .default({}),
});

export const updateQuestionSchema = createQuestionSchema.partial().extend({
  id: z.string().uuid(),
});

export const saveAnswersSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export const submitAttemptSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
});
