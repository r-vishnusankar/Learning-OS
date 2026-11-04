import { z } from "zod";

const learningLevel = z.enum([
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

export const promotionConsoleFilterSchema = z.object({
  departmentId: z.string().optional(),
  status: z
    .enum(["in_progress", "eligible", "blocked", "max_level", "rejected", "all"])
    .default("all"),
  search: z.string().optional(),
});

export const approvePromotionSchema = z.object({
  userId: z.string().min(1),
  toLevel: learningLevel.optional(),
  toDesignation: z.string().max(120).optional().nullable(),
});

export const rejectPromotionSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export const remindPromotionSchema = z.object({
  userId: z.string().min(1),
});
