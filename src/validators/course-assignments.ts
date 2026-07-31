import { z } from "zod";

const scopeSchema = z.enum(["org", "department", "user"]);

export const assignCourseSchema = z
  .object({
    /** Prefer courseIds for multi-assign; courseId kept for single-call compat */
    courseId: z.string().min(1).optional(),
    courseIds: z.array(z.string().min(1)).optional(),
    scope: scopeSchema,
    departmentId: z.string().optional(),
    userIds: z.array(z.string().min(1)).optional(),
    mandatory: z.boolean().default(false),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    source: z.enum(["manual", "rule", "onboarding", "annual_review"]).default("manual"),
    planId: z.string().optional().nullable(),
    cycleId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const ids = data.courseIds?.length ? data.courseIds : data.courseId ? [data.courseId] : [];
    if (ids.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one course",
        path: ["courseIds"],
      });
    }
    if (data.scope === "department" && !data.departmentId) {
      ctx.addIssue({
        code: "custom",
        message: "departmentId is required for department scope",
        path: ["departmentId"],
      });
    }
    if (data.scope === "user" && (!data.userIds || data.userIds.length === 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one employee",
        path: ["userIds"],
      });
    }
  });

export const revokeCourseAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
});

export const bulkAssignmentIdsSchema = z.object({
  assignmentIds: z.array(z.string().min(1)).min(1),
});

export const bulkUpdateDueDateSchema = z.object({
  assignmentIds: z.array(z.string().min(1)).min(1),
  dueDate: z.string().nullable(),
});
