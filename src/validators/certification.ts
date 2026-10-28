import { z } from "zod";

const departmentId = z.enum([
  "qa",
  "development",
  "ba",
  "hr",
  "marketing",
  "uiux",
  "devops",
]);

const level = z.enum([
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

const publishStatus = z.enum(["draft", "review", "published", "archived"]);

export const createPathSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  departmentId,
  level: level.optional(),
  thumbnailUrl: z.string().optional(),
  skills: z.array(z.string()).optional(),
  certificateTitle: z.string().max(200).optional().nullable(),
});

export const updatePathSchema = createPathSchema.partial().extend({
  id: z.string().min(1),
  publishStatus: publishStatus.optional(),
  durationMinutes: z.number().int().min(0).optional(),
});

export const upsertPathStepSchema = z.object({
  pathId: z.string().min(1),
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  stepType: z.enum(["course", "assessment"]),
  courseId: z.string().nullable().optional(),
  assessmentId: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const reorderPathStepsSchema = z.object({
  pathId: z.string().min(1),
  stepIds: z.array(z.string().min(1)).min(1),
});

export const enrollPathSchema = z.object({
  pathId: z.string().min(1),
});

export const createAssignmentSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    courseId: z.string().nullable().optional(),
    maxScore: z.number().int().min(1).max(1000).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    submissionType: z.enum(["text", "url", "github", "file", "coding"]).optional(),
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
      .optional()
      .default({}),
    scope: z.enum(["org", "department", "user"]).default("department"),
    departmentId: departmentId.optional().nullable(),
    userIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "department" && !data.departmentId) {
      ctx.addIssue({
        code: "custom",
        message: "Department is required when scope is department",
        path: ["departmentId"],
      });
    }
    if (data.scope === "user" && !(data.userIds && data.userIds.length > 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one person when scope is user",
        path: ["userIds"],
      });
    }
  });

export const updateAssignmentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  courseId: z.string().nullable().optional(),
  maxScore: z.number().int().min(1).max(1000).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  submissionType: z.enum(["text", "url", "github", "file", "coding"]).optional(),
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
    .optional(),
  publishStatus: publishStatus.optional(),
  scope: z.enum(["org", "department", "user"]).optional(),
  departmentId: departmentId.optional().nullable(),
  userIds: z.array(z.string().min(1)).optional(),
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  content: z.string().max(100000).optional(),
  url: z.string().url().optional().or(z.literal("")),
});

export const reviewSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  status: z.enum(["in_review", "approved", "rejected", "graded"]),
  score: z.number().int().min(0).max(1000).optional(),
  feedback: z.string().max(5000).optional(),
});

export const revokeCertificateSchema = z.object({
  certificateId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export const reissueCertificateSchema = z.object({
  certificateId: z.string().min(1),
});

export const mintCertificateSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  departmentId,
  level,
  score: z.number().int().min(0).max(100).optional(),
  skills: z.array(z.string()).optional(),
  courseId: z.string().nullable().optional(),
  assessmentId: z.string().nullable().optional(),
  pathId: z.string().nullable().optional(),
  attemptId: z.string().nullable().optional(),
});
