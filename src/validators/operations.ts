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

const userRole = z.enum(["employee", "manager", "department_head", "admin", "instructor"]);
const employeeStatus = z.enum(["active", "inactive"]);
const notificationType = z.enum(["info", "success", "warning", "reminder", "achievement"]);

export const inviteUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  department: departmentId,
  role: userRole.default("employee"),
  designation: z.string().max(120).optional(),
  managerId: z.string().nullable().optional(),
  password: z.string().min(8).max(120).optional(),
});

export const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  department: departmentId.optional(),
  role: userRole.optional(),
  designation: z.string().max(120).optional(),
  status: employeeStatus.optional(),
  managerId: z.string().nullable().optional(),
});

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
});

export const bulkImportUsersSchema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        department: departmentId,
        role: userRole.optional(),
        designation: z.string().optional(),
      })
    )
    .min(1)
    .max(500),
});

export const createTeamSchema = z.object({
  name: z.string().min(1).max(120),
  departmentId,
  managerId: z.string().nullable().optional(),
  memberIds: z.array(z.string()).optional(),
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: notificationType.optional(),
  href: z.string().optional().nullable(),
});

export const markNotificationSchema = z.object({
  notificationId: z.string().min(1),
});
